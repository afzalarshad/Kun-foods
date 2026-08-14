"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";
import { logAudit } from "@/lib/audit";

const methods = ["cod", "cash", "card", "bank_transfer", "other"] as const;
const statuses = ["pending", "paid", "refunded", "partially_refunded"] as const;

export async function createPayment(orderId: string, formData: FormData) {
  const session = await requireAdmin();
  const actorEmail = session.user.email ?? "unknown";

  const parsed = z
    .object({
      amount: z.coerce.number().min(1),
      method: z.enum(methods),
      status: z.enum(statuses),
      transactionRef: z.string().max(120).optional(),
      notes: z.string().max(500).optional(),
    })
    .parse({
      amount: formData.get("amount"),
      method: formData.get("method"),
      status: formData.get("status"),
      transactionRef: formData.get("transactionRef") || undefined,
      notes: formData.get("notes") || undefined,
    });

  const created = await prisma.payment.create({
    data: {
      orderId,
      amount: Math.round(parsed.amount * 100),
      method: parsed.method,
      status: parsed.status,
      transactionRef: parsed.transactionRef || null,
      notes: parsed.notes || null,
      actorEmail,
    },
  });

  await logAudit({
    actorEmail,
    action: "payment.create",
    entityType: "Payment",
    entityId: created.id,
    after: { orderId, amount: created.amount, method: created.method, status: created.status },
  });

  revalidatePath(`/admin/orders/${orderId}`);
}

export async function updatePaymentStatus(paymentId: string, orderId: string, formData: FormData) {
  const session = await requireAdmin();
  const actorEmail = session.user.email ?? "unknown";
  const status = z.enum(statuses).parse(formData.get("status"));

  const before = await prisma.payment.findUniqueOrThrow({ where: { id: paymentId } });

  await prisma.payment.update({
    where: { id: paymentId },
    data: { status, actorEmail },
  });

  await logAudit({
    actorEmail,
    action: "payment.status_update",
    entityType: "Payment",
    entityId: paymentId,
    before: { status: before.status },
    after: { status },
  });

  revalidatePath(`/admin/orders/${orderId}`);
}
