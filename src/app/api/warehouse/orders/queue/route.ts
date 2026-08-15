import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAnyPermission } from "@/lib/require-admin";

/**
 * Pick queue for a warehouse pick-and-pack app: orders that are confirmed
 * (processing) and waiting to be picked, packed, and handed to a courier.
 * GET /api/warehouse/orders/queue
 */
export async function GET() {
  await requireAnyPermission(["warehouse.pick", "warehouse.pack"]);

  const orders = await prisma.order.findMany({
    where: { status: "processing" },
    include: {
      items: { include: { product: { select: { sku: true, barcode: true } } } },
      shipment: { select: { courier: true, trackingNumber: true, status: true } },
    },
    orderBy: [{ priority: "desc" }, { createdAt: "asc" }],
  });

  return NextResponse.json({
    orders: orders.map((o) => ({
      id: o.id,
      orderNumber: o.orderNumber,
      priority: o.priority,
      city: o.city,
      items: o.items.map((item) => ({
        name: item.name,
        sku: item.product?.sku ?? null,
        barcode: item.product?.barcode ?? null,
        quantity: item.quantity,
        pickedQuantity: item.pickedQuantity,
      })),
      shipment: o.shipment,
    })),
  });
}
