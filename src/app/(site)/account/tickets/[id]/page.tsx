import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { requireCustomerRecord } from "@/lib/require-customer";
import { CustomerTicketThread } from "@/components/account/customer-ticket-thread";
import { AccountShell } from "@/components/account/account-shell";

export const metadata: Metadata = { title: "Ticket details" };

export default async function AccountTicketDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { customer } = await requireCustomerRecord();

  const ticket = await prisma.supportTicket.findUnique({
    where: { id },
    include: {
      order: { select: { id: true, orderNumber: true } },
      // Internal staff notes are never shown to the customer.
      messages: { where: { internal: false }, orderBy: { createdAt: "asc" } },
    },
  });
  if (!ticket || ticket.customerId !== customer.id) notFound();

  return (
    <AccountShell customerName={customer.name}>
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="font-heading text-2xl font-extrabold">#{ticket.ticketNumber}</h2>
          <p className="text-sm text-ink-soft">{ticket.subject}</p>
        </div>
        <span className="rounded-full bg-cream-dark px-3 py-1 text-xs font-semibold capitalize">
          {ticket.status.replace(/_/g, " ")}
        </span>
      </div>

      <div className="rounded-3xl bg-white p-6 shadow-sm text-sm text-ink-soft">
        <p className="capitalize">Category: {ticket.category}</p>
        {ticket.order && (
          <p className="mt-1">
            Order:{" "}
            <Link href={`/account/orders/${ticket.order.id}`} className="font-medium text-chili hover:underline">
              #{ticket.order.orderNumber}
            </Link>
          </p>
        )}
      </div>

      <CustomerTicketThread ticketId={ticket.id} messages={ticket.messages} />
    </div>
    </AccountShell>
  );
}
