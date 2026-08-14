import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { TicketMetaForm } from "@/components/admin/ticket-meta-form";
import { TicketThread } from "@/components/admin/ticket-thread";

export default async function TicketDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ticket = await prisma.supportTicket.findUnique({
    where: { id },
    include: {
      customer: true,
      order: { select: { id: true, orderNumber: true } },
      messages: { orderBy: { createdAt: "asc" } },
    },
  });
  if (!ticket) notFound();

  return (
    <div className="max-w-3xl">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-heading text-3xl font-extrabold">#{ticket.ticketNumber}</h1>
          <p className="mt-1 text-ink-soft">{ticket.subject}</p>
        </div>
        <TicketMetaForm
          ticketId={ticket.id}
          status={ticket.status}
          priority={ticket.priority}
          assignedTo={ticket.assignedTo}
        />
      </div>

      <div className="mt-6 grid gap-6 sm:grid-cols-2">
        <div className="rounded-3xl bg-white p-6 shadow-sm">
          <h2 className="font-heading font-bold">Customer</h2>
          {ticket.customer ? (
            <>
              <Link href={`/admin/customers/${ticket.customer.id}`} className="mt-3 block text-sm font-medium hover:text-chili">
                {ticket.customer.name}
              </Link>
              <p className="text-sm text-ink-soft">{ticket.customer.email}</p>
              <p className="text-sm text-ink-soft">{ticket.customer.phone}</p>
            </>
          ) : (
            <p className="mt-3 text-sm text-ink-soft">No customer linked.</p>
          )}
        </div>
        <div className="rounded-3xl bg-white p-6 shadow-sm">
          <h2 className="font-heading font-bold">Details</h2>
          <p className="mt-3 text-sm capitalize text-ink-soft">Category: {ticket.category}</p>
          {ticket.order ? (
            <p className="mt-1 text-sm">
              Order:{" "}
              <Link href={`/admin/orders/${ticket.order.id}`} className="font-medium hover:text-chili">
                #{ticket.order.orderNumber}
              </Link>
            </p>
          ) : (
            <p className="mt-1 text-sm text-ink-soft">No order linked.</p>
          )}
          <p className="mt-1 text-sm text-ink-soft">
            Opened {new Date(ticket.createdAt).toLocaleDateString("en-PK", { day: "numeric", month: "short", year: "numeric" })}
          </p>
        </div>
      </div>

      <div className="mt-6">
        <TicketThread ticketId={ticket.id} messages={ticket.messages} />
      </div>
    </div>
  );
}
