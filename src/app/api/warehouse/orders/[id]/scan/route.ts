import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/require-admin";

/**
 * Scans one unit of a barcode/SKU against an order's line items, moving
 * that item's picked count forward by one. Intended for a warehouse
 * pick-and-pack app confirming items as they're pulled off the shelf.
 * POST /api/warehouse/orders/[id]/scan   body: { "code": "<barcode or sku>" }
 */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  await requirePermission("warehouse.pick");
  const { id: orderId } = await params;
  const body = await request.json().catch(() => null);
  const code = typeof body?.code === "string" ? body.code.trim() : "";
  if (!code) return NextResponse.json({ error: "Missing 'code' in request body" }, { status: 400 });

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: { include: { product: { select: { name: true, barcode: true, sku: true } } } } },
  });
  if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });
  if (order.status !== "processing") {
    return NextResponse.json({ error: `Order is "${order.status}", not ready to pick` }, { status: 409 });
  }

  const item = order.items.find((i) => i.product && (i.product.barcode === code || i.product.sku === code));
  if (!item) return NextResponse.json({ error: `No item in this order matches code "${code}"` }, { status: 404 });
  if (item.pickedQuantity >= item.quantity) {
    return NextResponse.json(
      { error: `${item.name} is already fully picked (${item.quantity}/${item.quantity})` },
      { status: 409 }
    );
  }

  const updated = await prisma.orderItem.update({
    where: { id: item.id },
    data: { pickedQuantity: { increment: 1 } },
  });

  return NextResponse.json({
    itemName: item.name,
    pickedQuantity: updated.pickedQuantity,
    quantity: updated.quantity,
    fullyPicked: updated.pickedQuantity >= updated.quantity,
  });
}
