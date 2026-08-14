import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/require-admin";

/**
 * Barcode/SKU scan lookup for a warehouse pick-and-pack app.
 * GET /api/warehouse/products/lookup?barcode=XXXX  (or ?sku=XXXX)
 */
export async function GET(request: Request) {
  await requireRole(["admin", "staff"]);
  const { searchParams } = new URL(request.url);
  const barcode = searchParams.get("barcode")?.trim();
  const sku = searchParams.get("sku")?.trim();

  if (!barcode && !sku) {
    return NextResponse.json({ error: "Provide a barcode or sku query param" }, { status: 400 });
  }

  const product = await prisma.product.findFirst({
    where: barcode ? { barcode } : { sku },
    include: { category: true },
  });

  if (!product) {
    return NextResponse.json({ error: "No product matches that code" }, { status: 404 });
  }

  return NextResponse.json({
    id: product.id,
    name: product.name,
    sku: product.sku,
    barcode: product.barcode,
    category: product.category.name,
    stock: product.stock,
    reorderLevel: product.reorderLevel,
    price: product.price,
  });
}
