"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/require-admin";
import { logAudit } from "@/lib/audit";

const idsSchema = z.array(z.string().min(1)).min(1);
const statuses = ["pending", "processing", "packed", "shipped", "delivered", "cancelled"] as const;

export async function bulkAssignOrders(orderIds: string[], assignedTo: string) {
  const session = await requirePermission("orders.edit");
  const actorEmail = session.user.email ?? "unknown";
  const ids = idsSchema.parse(orderIds);
  const cleanAssignee = assignedTo.trim() || null;

  await prisma.order.updateMany({ where: { id: { in: ids } }, data: { assignedTo: cleanAssignee } });

  await logAudit({
    actorEmail,
    action: "order.bulk_assign",
    entityType: "Order",
    after: { count: ids.length, ids, assignedTo: cleanAssignee },
  });

  revalidatePath("/admin/orders");
}

// Intentionally skips customer notifications for bulk changes -- emailing/texting
// dozens of customers at once from a single click is surprising, not helpful.
export async function bulkSetOrderStatus(orderIds: string[], status: string) {
  const session = await requirePermission("orders.edit");
  const actorEmail = session.user.email ?? "unknown";
  const ids = idsSchema.parse(orderIds);
  const parsedStatus = z.enum(statuses).parse(status);

  await prisma.order.updateMany({ where: { id: { in: ids } }, data: { status: parsedStatus } });
  await prisma.orderStatusEvent.createMany({
    data: ids.map((orderId) => ({ orderId, status: parsedStatus, note: "Bulk status update", actorEmail })),
  });

  await logAudit({
    actorEmail,
    action: "order.bulk_status_update",
    entityType: "Order",
    after: { count: ids.length, ids, status: parsedStatus },
  });

  revalidatePath("/admin/orders");
}
