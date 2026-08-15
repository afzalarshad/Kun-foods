import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { TicketMetaForm } from "@/components/admin/ticket-meta-form";
import { TicketThread } from "@/components/admin/ticket-thread";
import { getSlaThresholds, ticketSlaSummary, formatDueLabel, SLA_STATE_STYLES, SLA_STATE_LABELS } from "@/lib/sla";

const OPEN_STATUSES = new Set(["open", "pending", "in_progress", "waiting_on_customer"]);

export default async function TicketDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [ticket, thresholds] = await Promise.all([
    prisma.supportTicket.findUnique({
      where: { id },
      include: {
        customer: true,
        order: { select: { id: true, orderNumber: true } },
        messages: { orderBy: { createdAt: "asc" } },
      },
    }),
    getSlaThresholds(),
  ]);
  if (!ticket) notFound();
  const isOpen = OPEN_STATUSES.has(ticket.status);
  const sla = ticketSlaSummary(ticket, thresholds);

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
          {isOpen ? (
            <div className="mt-3 flex flex-wrap gap-1.5">
              <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${SLA_STATE_STYLES[sla.responseState]}`}>
                Response: {formatDueLabel(sla.responseDueAt, sla.responseState)}
              </span>
              <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${SLA_STATE_STYLES[sla.resolutionState]}`}>
                Resolution: {formatDueLabel(sla.resolutionDueAt, sla.resolutionState)}
              </span>
            </div>
          ) : (
            <div className="mt-3 flex flex-wrap gap-1.5">
              <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${SLA_STATE_STYLES[sla.responseState]}`}>
                Response {SLA_STATE_LABELS[sla.responseState]}
              </span>
              <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${SLA_STATE_STYLES[sla.resolutionState]}`}>
                Resolution {SLA_STATE_LABELS[sla.resolutionState]}
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="mt-6">
        <TicketThread ticketId={ticket.id} messages={ticket.messages} />
      </div>
    </div>
  );
}
