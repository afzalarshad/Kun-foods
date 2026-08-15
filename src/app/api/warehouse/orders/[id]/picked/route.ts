import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/require-admin";
import { logAudit } from "@/lib/audit";
import { notifyOrderStatusChanged } from "@/lib/notifications";

/**
 * Marks an order as picked & packed, ready for courier handoff.
 * Requires every line item to be fully scanned first (see
 * POST /api/warehouse/orders/[id]/scan). Moves the order to "shipped".
 * POST /api/warehouse/orders/[id]/picked
 */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requirePermission("warehouse.pack");
  const actorEmail = session.user.email ?? "unknown";
  const { id: orderId } = await params;

  const before = await prisma.order.findUnique({ where: { id: orderId }, include: { items: true } });
  if (!before) return NextResponse.json({ error: "Order not found" }, { status: 404 });
  if (before.status !== "processing") {
    return NextResponse.json({ error: `Order is "${before.status}", expected "processing"` }, { status: 409 });
  }
  const incomplete = before.items.find((i) => i.pickedQuantity < i.quantity);
  if (incomplete) {
    return NextResponse.json(
      { error: `${incomplete.name} is not fully picked (${incomplete.pickedQuantity}/${incomplete.quantity})` },
      { status: 409 }
    );
  }

  const order = await prisma.order.update({
    where: { id: orderId },
    data: { status: "shipped" },
    include: { items: true },
  });

  await prisma.orderStatusEvent.create({
    data: { orderId, status: "shipped", note: "Picked & packed via warehouse app", actorEmail },
  });

  await logAudit({
    actorEmail,
    action: "order.status_update",
    entityType: "Order",
    entityId: orderId,
    before: { status: before.status },
    after: { status: "shipped", source: "warehouse-app" },
  });

  notifyOrderStatusChanged(order).catch((err) => console.error("[warehouse picked] notification failed:", err));

  return NextResponse.json({ id: order.id, orderNumber: order.orderNumber, status: order.status });
}
