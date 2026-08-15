"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/require-admin";
import { logAudit } from "@/lib/audit";
import { generateTicketNumber } from "@/lib/format";
import { createAdminNotification } from "@/lib/admin-notifications";
import { dispatchWebhookEvent } from "@/lib/webhooks";

const categories = ["order", "payment", "delivery", "return", "refund", "product", "complaint", "general"] as const;
const priorities = ["low", "normal", "high", "urgent"] as const;
const statuses = ["open", "pending", "in_progress", "waiting_on_customer", "resolved", "closed"] as const;

export async function createTicket(formData: FormData) {
  const session = await requirePermission("support.manage");
  const actorEmail = session.user.email ?? "unknown";

  const parsed = z
    .object({
      customerName: z.string().min(1).max(150),
      customerEmail: z.string().email(),
      customerPhone: z.string().min(3).max(30),
      orderId: z.string().optional(),
      subject: z.string().min(3).max(200),
      category: z.enum(categories),
      priority: z.enum(priorities),
      message: z.string().min(3).max(3000),
    })
    .parse({
      customerName: formData.get("customerName"),
      customerEmail: formData.get("customerEmail"),
      customerPhone: formData.get("customerPhone"),
      orderId: formData.get("orderId") || undefined,
      subject: formData.get("subject"),
      category: formData.get("category"),
      priority: formData.get("priority"),
      message: formData.get("message"),
    });

  const customer = await prisma.customer.upsert({
    where: { email: parsed.customerEmail },
    update: { name: parsed.customerName, phone: parsed.customerPhone },
    create: { name: parsed.customerName, email: parsed.customerEmail, phone: parsed.customerPhone },
  });

  const ticket = await prisma.supportTicket.create({
    data: {
      ticketNumber: generateTicketNumber(),
      customerId: customer.id,
      orderId: parsed.orderId || null,
      subject: parsed.subject,
      category: parsed.category,
      priority: parsed.priority,
      messages: {
        create: { authorEmail: actorEmail, authorType: "staff", message: parsed.message },
      },
    },
  });

  await logAudit({
    actorEmail,
    action: "ticket.create",
    entityType: "SupportTicket",
    entityId: ticket.id,
    after: { ticketNumber: ticket.ticketNumber, subject: ticket.subject, category: ticket.category },
  });

  await createAdminNotification({
    type: "new_ticket",
    message: `New ticket #${ticket.ticketNumber} — ${ticket.subject}`,
    link: `/admin/tickets/${ticket.id}`,
  });

  dispatchWebhookEvent("ticket.created", {
    id: ticket.id,
    ticketNumber: ticket.ticketNumber,
    subject: ticket.subject,
    category: ticket.category,
    priority: ticket.priority,
  }).catch((err) => console.error("[createTicket] webhook dispatch failed:", err));

  revalidatePath("/admin/tickets");
  redirect(`/admin/tickets/${ticket.id}`);
}

export async function addTicketMessage(ticketId: string, formData: FormData) {
  const session = await requirePermission("support.manage");
  const actorEmail = session.user.email ?? "unknown";
  const message = z.string().min(1).max(3000).parse(formData.get("message"));
  const internal = formData.get("internal") === "on";

  await prisma.ticketMessage.create({
    data: { ticketId, authorEmail: actorEmail, authorType: "staff", message, internal },
  });

  // The first follow-up reply after a ticket is opened counts as the SLA "first response"
  // (the initial ticket-creation message is the complaint being logged, not a reply to it).
  if (!internal) {
    const ticket = await prisma.supportTicket.findUnique({ where: { id: ticketId }, select: { firstResponseAt: true } });
    if (ticket && !ticket.firstResponseAt) {
      await prisma.supportTicket.update({ where: { id: ticketId }, data: { firstResponseAt: new Date() } });
    }
  }

  revalidatePath(`/admin/tickets/${ticketId}`);
  revalidatePath("/admin/tickets");
}

export async function updateTicketMeta(ticketId: string, formData: FormData) {
  const session = await requirePermission("support.manage");
  const actorEmail = session.user.email ?? "unknown";
  const status = z.enum(statuses).parse(formData.get("status"));
  const priority = z.enum(priorities).parse(formData.get("priority"));
  const assignedTo = (formData.get("assignedTo") as string | null)?.trim() || null;

  const before = await prisma.supportTicket.findUniqueOrThrow({ where: { id: ticketId } });

  const resolvedStatuses = new Set(["resolved", "closed"]);
  const nowResolved = resolvedStatuses.has(status);
  const wasResolved = resolvedStatuses.has(before.status);
  const resolvedAt = nowResolved && !wasResolved ? new Date() : !nowResolved && wasResolved ? null : before.resolvedAt;

  await prisma.supportTicket.update({ where: { id: ticketId }, data: { status, priority, assignedTo, resolvedAt } });

  if (status !== before.status) {
    await prisma.ticketMessage.create({
      data: {
        ticketId,
        authorEmail: actorEmail,
        authorType: "system",
        message: `Status changed to "${status.replace("_", " ")}"`,
      },
    });
  }

  await logAudit({
    actorEmail,
    action: "ticket.meta_update",
    entityType: "SupportTicket",
    entityId: ticketId,
    before: { status: before.status, priority: before.priority, assignedTo: before.assignedTo },
    after: { status, priority, assignedTo },
  });

  revalidatePath(`/admin/tickets/${ticketId}`);
  revalidatePath("/admin/tickets");
}
