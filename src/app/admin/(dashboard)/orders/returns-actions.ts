"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";
import { logAudit } from "@/lib/audit";

const returnStatuses = ["requested", "approved", "rejected", "received", "refunded"] as const;

export async function createReturn(orderId: string, formData: FormData) {
  const session = await requireAdmin();
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

  revalidatePath(`/admin/orders/${orderId}`);
}

export async function updateReturnStatus(returnId: string, orderId: string, formData: FormData) {
  const session = await requireAdmin();
  const status = z.enum(returnStatuses).parse(formData.get("status"));
  const before = await prisma.return.findUniqueOrThrow({ where: { id: returnId } });

  await prisma.return.update({
    where: { id: returnId },
    data: { status, actorEmail: session.user.email ?? "unknown" },
  });

  await logAudit({
    actorEmail: session.user.email ?? "unknown",
    action: "return.status_update",
    entityType: "Return",
    entityId: returnId,
    before: { status: before.status },
    after: { status },
  });

  revalidatePath(`/admin/orders/${orderId}`);
}

const priorityEnum = z.enum(["low", "normal", "high", "urgent"]);

export async function updateOrderMeta(orderId: string, formData: FormData) {
  const session = await requireAdmin();
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
