import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission, slugify } from "@/lib/require-admin";
import { parseCsv } from "@/lib/csv";
import { logAudit } from "@/lib/audit";
import { getDefaultWarehouse, incrementWarehouseStock, decrementWarehouseStock } from "@/lib/warehouse-stock";

type RowError = { row: number; message: string };

function toRupeeCents(value: string): number | null {
  const n = Number(value);
  if (!Number.isFinite(n) || n < 0) return null;
  return Math.round(n * 100);
}

export async function POST(request: Request) {
  const session = await requirePermission("import_export.manage");
  const actorEmail = session.user.email ?? "unknown";

  const formData = await request.formData();
  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
  }

  const text = await file.text();
  const rows = parseCsv(text);
  if (rows.length < 2) {
    return NextResponse.json({ error: "CSV has no data rows" }, { status: 400 });
  }

  const header = rows[0].map((h) => h.trim().toLowerCase());
  const col = (name: string) => header.indexOf(name);
  const idx = {
    name: col("name"),
    sku: col("sku"),
    barcode: col("barcode"),
    category: col("category"),
    price: col("price"),
    compareAtPrice: col("compareatprice"),
    costPrice: col("costprice"),
    stock: col("stock"),
    reorderLevel: col("reorderlevel"),
    supplier: col("supplier"),
    weightLabel: col("weightlabel"),
    featured: col("featured"),
  };

  if (idx.name === -1 || idx.category === -1 || idx.price === -1 || idx.stock === -1) {
    return NextResponse.json(
      { error: "CSV must include at least: name, category, price, stock columns" },
      { status: 400 }
    );
  }

  const categories = await prisma.category.findMany();
  const categoryByName = new Map(categories.map((c) => [c.name.toLowerCase(), c]));
  const defaultWarehouse = await getDefaultWarehouse();

  const errors: RowError[] = [];
  let created = 0;
  let updated = 0;

  for (let r = 1; r < rows.length; r++) {
    const row = rows[r];
    const rowNum = r + 1; // 1-indexed with header as row 1
    const get = (i: number) => (i >= 0 ? (row[i] ?? "").trim() : "");

    const name = get(idx.name);
    const categoryName = get(idx.category);
    const priceRaw = get(idx.price);
    const stockRaw = get(idx.stock);

    if (!name) {
      errors.push({ row: rowNum, message: "Missing name" });
      continue;
    }
    const category = categoryByName.get(categoryName.toLowerCase());
    if (!category) {
      errors.push({ row: rowNum, message: `Unknown category "${categoryName}"` });
      continue;
    }
    const price = toRupeeCents(priceRaw);
    if (price === null || price <= 0) {
      errors.push({ row: rowNum, message: `Invalid price "${priceRaw}"` });
      continue;
    }
    const stock = Number(stockRaw);
    if (!Number.isInteger(stock) || stock < 0) {
      errors.push({ row: rowNum, message: `Invalid stock "${stockRaw}"` });
      continue;
    }

    const sku = get(idx.sku) || null;
    const compareAtPrice = idx.compareAtPrice >= 0 && get(idx.compareAtPrice) ? toRupeeCents(get(idx.compareAtPrice)) : null;
    const costPrice = idx.costPrice >= 0 && get(idx.costPrice) ? toRupeeCents(get(idx.costPrice)) : null;
    const reorderLevelRaw = get(idx.reorderLevel);
    const reorderLevel = reorderLevelRaw ? Number(reorderLevelRaw) : null;
    const supplier = get(idx.supplier) || null;
    const weightLabel = get(idx.weightLabel) || null;
    const barcode = get(idx.barcode) || null;
    const featured = get(idx.featured).toLowerCase() === "yes" || get(idx.featured).toLowerCase() === "true";

    try {
      const existing = sku ? await prisma.product.findUnique({ where: { sku } }) : null;

      if (existing) {
        // The CSV's "stock" column always targets the default warehouse — for
        // any other location, use per-warehouse Inventory adjustments instead.
        const defaultLevel = await prisma.warehouseStock.findUnique({
          where: { productId_warehouseId: { productId: existing.id, warehouseId: defaultWarehouse.id } },
        });
        const stockDelta = stock - (defaultLevel?.quantity ?? 0);
        if (stockDelta < 0 && (defaultLevel?.quantity ?? 0) + stockDelta < 0) {
          errors.push({ row: rowNum, message: `Would take default-warehouse stock below zero for SKU "${sku}"` });
          continue;
        }

        await prisma.product.update({
          where: { id: existing.id },
          data: { name, categoryId: category.id, price, compareAtPrice, costPrice, barcode, reorderLevel, supplier, weightLabel, featured },
        });
        if (stockDelta !== 0) {
          await prisma.$transaction(async (tx) => {
            if (stockDelta > 0) {
              await incrementWarehouseStock(tx, { productId: existing.id, warehouseId: defaultWarehouse.id, quantity: stockDelta });
            } else {
              await decrementWarehouseStock(tx, { productId: existing.id, warehouseId: defaultWarehouse.id, quantity: -stockDelta });
            }
            await tx.inventoryMovement.create({
              data: {
                productId: existing.id,
                warehouseId: defaultWarehouse.id,
                type: "adjustment",
                quantity: stockDelta,
                reason: "CSV import",
                actorEmail,
              },
            });
          });
        }
        updated++;
      } else {
        let slug = slugify(name);
        const slugExists = await prisma.product.findUnique({ where: { slug } });
        if (slugExists) slug = `${slug}-${Date.now().toString(36)}`;

        const createdProduct = await prisma.product.create({
          data: {
            name,
            slug,
            description: name,
            categoryId: category.id,
            price,
            compareAtPrice,
            costPrice,
            sku,
            barcode,
            reorderLevel,
            supplier,
            weightLabel,
            stock,
            featured,
            images: JSON.stringify(["🌶️"]),
          },
        });
        await prisma.warehouseStock.create({
          data: { productId: createdProduct.id, warehouseId: defaultWarehouse.id, quantity: stock },
        });
        if (stock > 0) {
          await prisma.inventoryMovement.create({
            data: {
              productId: createdProduct.id,
              warehouseId: defaultWarehouse.id,
              type: "restock",
              quantity: stock,
              reason: "CSV import — initial stock",
              actorEmail,
            },
          });
        }
        created++;
      }
    } catch {
      errors.push({ row: rowNum, message: sku ? `Failed to save SKU "${sku}"` : "Failed to save row" });
    }
  }

  await logAudit({
    actorEmail,
    action: "product.import",
    entityType: "Product",
    after: { created, updated, errorCount: errors.length },
  });

  return NextResponse.json({ created, updated, errors });
}
