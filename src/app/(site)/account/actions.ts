"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireCustomer, requireCustomerRecord } from "@/lib/require-customer";
import { logAudit } from "@/lib/audit";
import { createAdminNotification } from "@/lib/admin-notifications";
import { notifyOrderStatusChanged } from "@/lib/notifications";
import { generateTicketNumber } from "@/lib/format";

// Only orders that haven't started fulfillment yet can be self-cancelled -- once an order is
// packed, staff need to be involved (physical goods may already be boxed for a courier).
const CANCELLABLE_STATUSES = new Set(["pending", "processing"]);

async function ownedOrderOrThrow(orderId: string, customerId: string) {
  const order = await prisma.order.findUnique({ where: { id: orderId }, include: { items: true } });
  if (!order || order.customerId !== customerId) {
    throw new Error("Order not found.");
  }
  return order;
}

export async function cancelMyOrder(orderId: string, formData: FormData) {
  const { session } = await requireCustomerRecord();
  const customerId = session.user.customerId!;
  const order = await ownedOrderOrThrow(orderId, customerId);

  if (!CANCELLABLE_STATUSES.has(order.status)) {
    return { error: "This order has already started fulfillment and can no longer be cancelled here — contact support instead." };
  }

  const reason = z.string().trim().max(500).optional().parse(formData.get("reason") || undefined);
  const actorEmail = order.email;

  const updated = await prisma.order.update({
    where: { id: orderId },
    data: { status: "cancelled", cancellationReason: reason ?? "Cancelled by customer" },
    include: { items: true },
  });
  await prisma.orderStatusEvent.create({
    data: { orderId, status: "cancelled", note: reason ?? "Cancelled by customer", actorEmail },
  });
  await logAudit({
    actorEmail,
    action: "order.status_update",
    entityType: "Order",
    entityId: orderId,
    before: { status: order.status },
    after: { status: "cancelled", by: "customer" },
  });
  await createAdminNotification({
    type: "order_cancelled",
    message: `Order #${order.orderNumber} was cancelled by the customer${reason ? `: ${reason}` : ""}`,
    link: `/admin/orders/${orderId}`,
  });
  notifyOrderStatusChanged(updated).catch((err) => console.error("[cancelMyOrder] notification failed:", err));

  revalidatePath("/account/orders");
  revalidatePath(`/account/orders/${orderId}`);
  return {};
}

export async function requestMyReturn(orderId: string, formData: FormData) {
  const { session } = await requireCustomerRecord();
  const customerId = session.user.customerId!;
  const order = await ownedOrderOrThrow(orderId, customerId);

  if (order.status !== "delivered") {
    return { error: "Returns can only be requested once an order has been delivered." };
  }

  const reason = z.string().trim().min(3).max(500).parse(formData.get("reason"));

  const created = await prisma.return.create({
    data: { orderId, reason, actorEmail: order.email },
  });
  await logAudit({
    actorEmail: order.email,
    action: "return.create",
    entityType: "Return",
    entityId: created.id,
    after: { orderId, reason, by: "customer" },
  });
  await createAdminNotification({
    type: "return_requested",
    message: `Return requested for order #${order.orderNumber} — ${reason}`,
    link: `/admin/orders/${orderId}`,
  });

  revalidatePath(`/account/orders/${orderId}`);
  return {};
}

const ticketCategories = ["order", "payment", "delivery", "return", "refund", "product", "complaint", "general"] as const;

export async function createMyTicket(formData: FormData) {
  const { session, customer } = await requireCustomerRecord();

  const parsed = z
    .object({
      orderId: z.string().optional(),
      subject: z.string().min(3).max(200),
      category: z.enum(ticketCategories),
      message: z.string().min(3).max(3000),
    })
    .parse({
      orderId: formData.get("orderId") || undefined,
      subject: formData.get("subject"),
      category: formData.get("category"),
      message: formData.get("message"),
    });

  // Ownership check when a ticket is tied to a specific order.
  if (parsed.orderId) {
    await ownedOrderOrThrow(parsed.orderId, session.user.customerId!);
  }

  const ticket = await prisma.supportTicket.create({
    data: {
      ticketNumber: generateTicketNumber(),
      customerId: customer.id,
      orderId: parsed.orderId || null,
      subject: parsed.subject,
      category: parsed.category,
      messages: {
        create: { authorEmail: customer.email, authorType: "customer", message: parsed.message },
      },
    },
  });

  await createAdminNotification({
    type: "new_ticket",
    message: `New ticket #${ticket.ticketNumber}: ${parsed.subject}`,
    link: `/admin/tickets/${ticket.id}`,
  });

  revalidatePath("/account/tickets");
  return { ticketId: ticket.id };
}

export async function replyToMyTicket(ticketId: string, formData: FormData) {
  const { customer } = await requireCustomerRecord();
  const ticket = await prisma.supportTicket.findUnique({ where: { id: ticketId } });
  if (!ticket || ticket.customerId !== customer.id) {
    throw new Error("Ticket not found.");
  }

  const message = z.string().trim().min(1).max(3000).parse(formData.get("message"));

  await prisma.ticketMessage.create({
    data: { ticketId, authorEmail: customer.email, authorType: "customer", message },
  });
  // Replying re-opens a resolved/closed ticket and puts it back in front of staff.
  if (ticket.status === "resolved" || ticket.status === "closed") {
    await prisma.supportTicket.update({ where: { id: ticketId }, data: { status: "waiting_on_customer", resolvedAt: null } });
  } else {
    await prisma.supportTicket.update({ where: { id: ticketId }, data: { status: "open" } });
  }

  await createAdminNotification({
    type: "ticket_reply",
    message: `Customer replied on ticket #${ticket.ticketNumber}`,
    link: `/admin/tickets/${ticketId}`,
  });

  revalidatePath(`/account/tickets/${ticketId}`);
}

export async function updateMyProfile(formData: FormData) {
  const { customer } = await requireCustomerRecord();
  const phone = z.string().trim().min(5).max(20).parse(formData.get("phone"));
  const address = z.string().trim().max(300).optional().parse(formData.get("address") || undefined);
  const city = z.string().trim().max(100).optional().parse(formData.get("city") || undefined);

  await prisma.customer.update({
    where: { id: customer.id },
    data: { phone, address: address || null, city: city || null },
  });

  revalidatePath("/account");
}

// requireCustomer is re-exported for pages that only need the auth check, not the record.
export { requireCustomer };
