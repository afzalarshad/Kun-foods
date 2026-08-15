"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/require-admin";
import { logAudit } from "@/lib/audit";
import { createAdminNotification } from "@/lib/admin-notifications";

const returnStatuses = ["requested", "approved", "rejected", "received", "refunded"] as const;

export async function createReturn(orderId: string, formData: FormData) {
  const session = await requirePermission("orders.refund");
  const reason = z.string().min(3).max(500).parse(formData.get("reason"));

  const created = await prisma.return.create({
    data: { orderId, reason, actorEmail: session.user.email ?? "unknown" },
  });

  await logAudit({
    actorEmail: session.user.email ?? "unknown",
    action: "return.create",
    entityType: "Return",
    entityId: created.id,
    after: { orderId, reason },
  });

  const orderForNotif = await prisma.order.findUnique({ where: { id: orderId }, select: { orderNumber: true } });
  await createAdminNotification({
    type: "return_requested",
    message: `Return requested for order #${orderForNotif?.orderNumber ?? orderId} — ${reason}`,
    link: `/admin/orders/${orderId}`,
  });

  revalidatePath(`/admin/orders/${orderId}`);
}

export async function updateReturnStatus(returnId: string, orderId: string, formData: FormData) {
  const session = await requirePermission("orders.refund");
  const status = z.enum(returnStatuses).parse(formData.get("status"));
  const actorEmail = session.user.email ?? "unknown";
  const before = await prisma.return.findUniqueOrThrow({ where: { id: returnId } });

  await prisma.return.update({
    where: { id: returnId },
    data: { status, actorEmail },
  });

  // Restock once, the moment an item is physically back in the warehouse.
  if (status === "received" && before.status !== "received") {
    const [order, items] = await Promise.all([
      prisma.order.findUniqueOrThrow({ where: { id: orderId }, select: { orderNumber: true } }),
      prisma.orderItem.findMany({ where: { orderId, productId: { not: null } } }),
    ]);
    await prisma.$transaction(
      items.flatMap((item) => [
        prisma.product.update({ where: { id: item.productId! }, data: { stock: { increment: item.quantity } } }),
        prisma.inventoryMovement.create({
          data: {
            productId: item.productId!,
            type: "return",
            quantity: item.quantity,
            reason: `Return received for order ${order.orderNumber}`,
            orderId,
            actorEmail,
          },
        }),
      ])
    );
  }

  await logAudit({
    actorEmail,
    action: "return.status_update",
    entityType: "Return",
    entityId: returnId,
    before: { status: before.status },
    after: { status },
  });

  revalidatePath(`/admin/orders/${orderId}`);
  revalidatePath("/admin/inventory");
}

const priorityEnum = z.enum(["low", "normal", "high", "urgent"]);

export async function updateOrderMeta(orderId: string, formData: FormData) {
  const session = await requirePermission("orders.refund");
  const priority = priorityEnum.parse(formData.get("priority"));
  const assignedTo = (formData.get("assignedTo") as string | null)?.trim() || null;

  const before = await prisma.order.findUniqueOrThrow({ where: { id: orderId } });

  await prisma.order.update({
    where: { id: orderId },
    data: { priority, assignedTo },
  });

  await logAudit({
    actorEmail: session.user.email ?? "unknown",
    action: "order.meta_update",
    entityType: "Order",
    entityId: orderId,
    before: { priority: before.priority, assignedTo: before.assignedTo },
    after: { priority, assignedTo },
  });

  revalidatePath(`/admin/orders/${orderId}`);
}
