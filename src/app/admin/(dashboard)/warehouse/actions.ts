"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/require-admin";
import { logAudit } from "@/lib/audit";
import { notifyOrderStatusChanged } from "@/lib/notifications";

type ScanResult = { error?: string; matchedItemName?: string; pickedQuantity?: number; quantity?: number };

export async function scanPickItem(orderId: string, formData: FormData): Promise<ScanResult> {
  await requireRole(["admin", "staff"]);
  const code = z.string().min(1).parse(formData.get("code")).trim();

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: { include: { product: { select: { name: true, barcode: true, sku: true } } } } },
  });
  if (!order) return { error: "Order not found" };
  if (order.status !== "processing") return { error: `Order is "${order.status}", not ready to pick` };

  const item = order.items.find(
    (i) => i.product && (i.product.barcode === code || i.product.sku === code)
  );
  if (!item) return { error: `No item in this order matches code "${code}"` };
  if (item.pickedQuantity >= item.quantity) {
    return { error: `${item.name} is already fully picked (${item.quantity}/${item.quantity})`, matchedItemName: item.name };
  }

  const updated = await prisma.orderItem.update({
    where: { id: item.id },
    data: { pickedQuantity: { increment: 1 } },
  });

  revalidatePath(`/admin/warehouse/${orderId}/pick`);
  return { matchedItemName: item.name, pickedQuantity: updated.pickedQuantity, quantity: updated.quantity };
}

export async function adjustPickedQuantity(orderId: string, itemId: string, formData: FormData) {
  await requireRole(["admin", "staff"]);
  const delta = z.enum(["1", "-1"]).parse(formData.get("delta"));

  const item = await prisma.orderItem.findUniqueOrThrow({ where: { id: itemId } });
  const next = Math.max(0, Math.min(item.quantity, item.pickedQuantity + Number(delta)));

  await prisma.orderItem.update({ where: { id: itemId }, data: { pickedQuantity: next } });

  revalidatePath(`/admin/warehouse/${orderId}/pick`);
}

export async function markOrderPacked(orderId: string): Promise<{ error?: string }> {
  const session = await requireRole(["admin", "staff"]);
  const actorEmail = session.user.email ?? "unknown";

  const order = await prisma.order.findUnique({ where: { id: orderId }, include: { items: true } });
  if (!order) return { error: "Order not found" };
  if (order.status !== "processing") return { error: `Order is "${order.status}", expected "processing"` };

  const incomplete = order.items.find((i) => i.pickedQuantity < i.quantity);
  if (incomplete) {
    return { error: `${incomplete.name} is not fully picked (${incomplete.pickedQuantity}/${incomplete.quantity})` };
  }

  const updated = await prisma.order.update({
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
    before: { status: "processing" },
    after: { status: "shipped", source: "warehouse-pick-pack" },
  });

  notifyOrderStatusChanged(updated).catch((err) => console.error("[markOrderPacked] notification failed:", err));

  revalidatePath(`/admin/warehouse`);
  revalidatePath(`/admin/warehouse/${orderId}/pick`);
  revalidatePath(`/admin/orders/${orderId}`);
  return {};
}
