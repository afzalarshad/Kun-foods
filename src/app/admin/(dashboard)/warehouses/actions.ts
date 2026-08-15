"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/require-admin";
import { logAudit } from "@/lib/audit";

const warehouseSchema = z.object({
  name: z.string().min(2).max(100),
  code: z.string().min(2).max(20),
  city: z.string().min(2).max(100),
  address: z.string().max(300).optional(),
  isDefault: z.coerce.boolean().optional(),
  active: z.coerce.boolean().optional(),
});

function parseForm(formData: FormData) {
  return warehouseSchema.parse({
    name: formData.get("name"),
    code: formData.get("code"),
    city: formData.get("city"),
    address: formData.get("address") || undefined,
    isDefault: formData.get("isDefault") === "on",
    active: formData.get("active") === "on",
  });
}

export async function createWarehouse(formData: FormData) {
  const session = await requirePermission("warehouses.manage");
  const parsed = parseForm(formData);
  const actorEmail = session.user.email ?? "unknown";

  const created = await prisma.$transaction(async (tx) => {
    if (parsed.isDefault) {
      await tx.warehouse.updateMany({ where: { isDefault: true }, data: { isDefault: false } });
    }
    return tx.warehouse.create({
      data: {
        name: parsed.name,
        code: parsed.code.toUpperCase().trim(),
        city: parsed.city.trim(),
        address: parsed.address?.trim() || null,
        isDefault: parsed.isDefault ?? false,
        active: parsed.active ?? true,
      },
    });
  });

  await logAudit({
    actorEmail,
    action: "warehouse.create",
    entityType: "Warehouse",
    entityId: created.id,
    after: { name: created.name, code: created.code, city: created.city, isDefault: created.isDefault },
  });

  revalidatePath("/admin/warehouses");
  redirect("/admin/warehouses");
}

export async function updateWarehouse(warehouseId: string, formData: FormData) {
  const session = await requirePermission("warehouses.manage");
  const parsed = parseForm(formData);
  const actorEmail = session.user.email ?? "unknown";
  const before = await prisma.warehouse.findUniqueOrThrow({ where: { id: warehouseId } });

  const updated = await prisma.$transaction(async (tx) => {
    if (parsed.isDefault) {
      await tx.warehouse.updateMany({ where: { isDefault: true, id: { not: warehouseId } }, data: { isDefault: false } });
    }
    return tx.warehouse.update({
      where: { id: warehouseId },
      data: {
        name: parsed.name,
        code: parsed.code.toUpperCase().trim(),
        city: parsed.city.trim(),
        address: parsed.address?.trim() || null,
        isDefault: parsed.isDefault ?? false,
        active: parsed.active ?? true,
      },
    });
  });

  await logAudit({
    actorEmail,
    action: "warehouse.update",
    entityType: "Warehouse",
    entityId: warehouseId,
    before: { name: before.name, city: before.city, isDefault: before.isDefault, active: before.active },
    after: { name: updated.name, city: updated.city, isDefault: updated.isDefault, active: updated.active },
  });

  revalidatePath("/admin/warehouses");
  redirect("/admin/warehouses");
}

export async function deleteWarehouse(warehouseId: string): Promise<{ message?: string }> {
  const session = await requirePermission("warehouses.manage");
  const actorEmail = session.user.email ?? "unknown";
  const before = await prisma.warehouse.findUniqueOrThrow({ where: { id: warehouseId } });

  const [stockCount, orderCount] = await Promise.all([
    prisma.warehouseStock.count({ where: { warehouseId, quantity: { gt: 0 } } }),
    prisma.order.count({ where: { warehouseId } }),
  ]);

  if (stockCount > 0) {
    return { message: "This warehouse still holds stock — transfer it out before deleting." };
  }

  if (orderCount > 0) {
    // Has order history — deactivate instead of a hard delete, matching every
    // other "safer delete" in this app (products/bundles/coupons).
    await prisma.warehouse.update({ where: { id: warehouseId }, data: { active: false, isDefault: false } });
    await logAudit({
      actorEmail,
      action: "warehouse.deactivate",
      entityType: "Warehouse",
      entityId: warehouseId,
      before: { name: before.name },
    });
    revalidatePath("/admin/warehouses");
    return { message: "This warehouse has order history, so it was deactivated instead of deleted." };
  }

  await prisma.warehouse.delete({ where: { id: warehouseId } });
  await logAudit({
    actorEmail,
    action: "warehouse.delete",
    entityType: "Warehouse",
    entityId: warehouseId,
    before: { name: before.name, code: before.code },
  });

  revalidatePath("/admin/warehouses");
  return {};
}

const transferSchema = z.object({
  productId: z.string().min(1),
  fromWarehouseId: z.string().min(1),
  toWarehouseId: z.string().min(1),
  quantity: z.coerce.number().int().min(1),
  reason: z.string().max(300).optional(),
});

export async function createStockTransfer(formData: FormData): Promise<{ error?: string }> {
  const session = await requirePermission("warehouses.manage");
  const parsed = transferSchema.parse({
    productId: formData.get("productId"),
    fromWarehouseId: formData.get("fromWarehouseId"),
    toWarehouseId: formData.get("toWarehouseId"),
    quantity: formData.get("quantity"),
    reason: formData.get("reason") || undefined,
  });
  const actorEmail = session.user.email ?? "unknown";

  if (parsed.fromWarehouseId === parsed.toWarehouseId) {
    return { error: "Source and destination warehouses must be different." };
  }

  const sourceStock = await prisma.warehouseStock.findUnique({
    where: { productId_warehouseId: { productId: parsed.productId, warehouseId: parsed.fromWarehouseId } },
  });
  if (!sourceStock || sourceStock.quantity < parsed.quantity) {
    return { error: `Source warehouse only has ${sourceStock?.quantity ?? 0} in stock.` };
  }

  const [product] = await Promise.all([
    prisma.product.findUniqueOrThrow({ where: { id: parsed.productId }, select: { name: true } }),
  ]);

  const transfer = await prisma.$transaction(async (tx) => {
    // Moving stock between locations doesn't touch the cross-warehouse total
    // (Product.stock), so update WarehouseStock directly on both sides
    // instead of going through the decrement/increment helpers.
    await tx.warehouseStock.update({ where: { id: sourceStock.id }, data: { quantity: { decrement: parsed.quantity } } });
    await tx.warehouseStock.upsert({
      where: { productId_warehouseId: { productId: parsed.productId, warehouseId: parsed.toWarehouseId } },
      create: { productId: parsed.productId, warehouseId: parsed.toWarehouseId, quantity: parsed.quantity },
      update: { quantity: { increment: parsed.quantity } },
    });

    const created = await tx.stockTransfer.create({
      data: {
        productId: parsed.productId,
        quantity: parsed.quantity,
        fromWarehouseId: parsed.fromWarehouseId,
        toWarehouseId: parsed.toWarehouseId,
        reason: parsed.reason?.trim() || null,
        actorEmail,
      },
    });

    await tx.inventoryMovement.createMany({
      data: [
        {
          productId: parsed.productId,
          warehouseId: parsed.fromWarehouseId,
          type: "transfer_out",
          quantity: -parsed.quantity,
          reason: parsed.reason?.trim() || `Transfer to another warehouse`,
          actorEmail,
        },
        {
          productId: parsed.productId,
          warehouseId: parsed.toWarehouseId,
          type: "transfer_in",
          quantity: parsed.quantity,
          reason: parsed.reason?.trim() || `Transfer from another warehouse`,
          actorEmail,
        },
      ],
    });

    return created;
  });

  await logAudit({
    actorEmail,
    action: "warehouse.stock_transfer",
    entityType: "StockTransfer",
    entityId: transfer.id,
    after: {
      product: product.name,
      quantity: parsed.quantity,
      from: parsed.fromWarehouseId,
      to: parsed.toWarehouseId,
    },
  });

  revalidatePath("/admin/warehouses");
  revalidatePath("/admin/inventory");
  return {};
}
