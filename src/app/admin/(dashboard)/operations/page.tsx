import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/require-admin";
import { getSlaThresholds, ticketSlaSummary, orderSlaSummary, formatDueLabel, formatDuration, SLA_STATE_STYLES, SLA_STATE_LABELS } from "@/lib/sla";

const OPEN_TICKET_STATUSES = ["open", "pending", "in_progress", "waiting_on_customer"];
const OPEN_ORDER_STATUSES = ["pending", "processing"];
const LOOKBACK_DAYS = 30;

export default async function OperationsPage() {
  await requirePermission("reports.view");
  const now = new Date();
  const cutoff = new Date(now.getTime() - LOOKBACK_DAYS * 24 * 60 * 60 * 1000);

  const [thresholds, openTickets, respondedTickets, resolvedTickets, openOrders, recentlyShippedOrders] = await Promise.all([
    getSlaThresholds(),
    prisma.supportTicket.findMany({
      where: { status: { in: OPEN_TICKET_STATUSES } },
      select: { id: true, ticketNumber: true, subject: true, priority: true, status: true, createdAt: true, firstResponseAt: true, resolvedAt: true },
    }),
    prisma.supportTicket.findMany({
      where: { createdAt: { gte: cutoff }, firstResponseAt: { not: null } },
      select: { createdAt: true, firstResponseAt: true },
    }),
    prisma.supportTicket.findMany({
      where: { resolvedAt: { gte: cutoff } },
      select: { createdAt: true, resolvedAt: true },
    }),
    prisma.order.findMany({
      where: { status: { in: OPEN_ORDER_STATUSES } },
      select: { id: true, orderNumber: true, customerName: true, priority: true, status: true, createdAt: true },
    }),
    prisma.order.findMany({
      where: { status: { in: ["shipped", "delivered"] }, createdAt: { gte: cutoff } },
      select: { createdAt: true, statusEvents: { where: { status: "shipped" }, orderBy: { createdAt: "asc" }, take: 1 } },
    }),
  ]);

  const ticketSummaries = openTickets.map((t) => ({ ticket: t, sla: ticketSlaSummary(t, thresholds, now) }));
  const responseBreached = ticketSummaries.filter((t) => t.sla.responseState === "breached");
  const responseAtRisk = ticketSummaries.filter((t) => t.sla.responseState === "at_risk");
  const resolutionBreached = ticketSummaries.filter((t) => t.sla.resolutionState === "breached");

  const orderSummaries = openOrders.map((o) => ({ order: o, sla: orderSlaSummary(o, thresholds, now) }));
  const fulfillmentBreached = orderSummaries.filter((o) => o.sla.fulfillmentState === "breached");
  const fulfillmentAtRisk = orderSummaries.filter((o) => o.sla.fulfillmentState === "at_risk");

  const avgResponseMs =
    respondedTickets.length > 0
      ? respondedTickets.reduce((sum, t) => sum + (t.firstResponseAt!.getTime() - t.createdAt.getTime()), 0) / respondedTickets.length
      : null;
  const avgResolutionMs =
    resolvedTickets.length > 0
      ? resolvedTickets.reduce((sum, t) => sum + (t.resolvedAt!.getTime() - t.createdAt.getTime()), 0) / resolvedTickets.length
      : null;
  const shippedWithEvent = recentlyShippedOrders.filter((o) => o.statusEvents.length > 0);
  const avgFulfillmentMs =
    shippedWithEvent.length > 0
      ? shippedWithEvent.reduce((sum, o) => sum + (o.statusEvents[0].createdAt.getTime() - o.createdAt.getTime()), 0) / shippedWithEvent.length
      : null;

  const statCards = [
    { label: "Tickets breaching response SLA", value: responseBreached.length, icon: "📥", alert: responseBreached.length > 0 },
    { label: "Tickets at risk (response)", value: responseAtRisk.length, icon: "⏳", alert: false },
    { label: "Tickets breaching resolution SLA", value: resolutionBreached.length, icon: "🧵", alert: resolutionBreached.length > 0 },
    { label: "Orders breaching fulfillment SLA", value: fulfillmentBreached.length, icon: "📦", alert: fulfillmentBreached.length > 0 },
    { label: "Orders at risk (fulfillment)", value: fulfillmentAtRisk.length, icon: "🚚", alert: false },
  ];

  const kpiCards = [
    { label: "Avg first response", value: avgResponseMs !== null ? formatDuration(avgResponseMs) : "—", hint: `Last ${LOOKBACK_DAYS} days` },
    { label: "Avg ticket resolution", value: avgResolutionMs !== null ? formatDuration(avgResolutionMs) : "—", hint: `Last ${LOOKBACK_DAYS} days` },
    { label: "Avg time to ship", value: avgFulfillmentMs !== null ? formatDuration(avgFulfillmentMs) : "—", hint: `Last ${LOOKBACK_DAYS} days` },
  ];

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-3xl font-extrabold">Operations</h1>
          <p className="mt-1 text-ink-soft">Live SLA compliance across support tickets and order fulfillment.</p>
        </div>
        <Link href="/admin/settings" className="text-sm font-semibold text-chili hover:underline">
          Adjust SLA thresholds →
        </Link>
      </div>

      <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-5">
        {statCards.map((s) => (
          <div
            key={s.label}
            className={`rounded-3xl p-6 shadow-sm ${s.alert ? "border-2 border-chili/30 bg-chili/5" : "bg-white"}`}
          >
            <span className="text-2xl">{s.icon}</span>
            <p className={`mt-3 font-heading text-2xl font-bold ${s.alert ? "text-chili-dark" : ""}`}>{s.value}</p>
            <p className="text-sm text-ink-soft">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 grid gap-5 sm:grid-cols-3">
        {kpiCards.map((k) => (
          <div key={k.label} className="rounded-3xl bg-white p-6 shadow-sm">
            <p className="font-heading text-2xl font-bold">{k.value}</p>
            <p className="text-sm text-ink-soft">{k.label}</p>
            <p className="mt-1 text-xs text-ink-soft">{k.hint}</p>
          </div>
        ))}
      </div>

      <div className="mt-10 grid gap-6 lg:grid-cols-2">
        <div className="rounded-3xl bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="font-heading text-lg font-bold">Tickets needing attention</h2>
            <Link href="/admin/tickets" className="text-sm font-semibold text-chili hover:underline">
              View all →
            </Link>
          </div>
          {responseBreached.length === 0 && resolutionBreached.length === 0 ? (
            <p className="mt-4 text-sm text-ink-soft">No breached tickets right now — nice work.</p>
          ) : (
            <ul className="mt-4 flex flex-col gap-3">
              {[...new Map([...responseBreached, ...resolutionBreached].map((t) => [t.ticket.id, t])).values()].map(({ ticket, sla }) => (
                <li key={ticket.id} className="flex items-center justify-between gap-3 rounded-2xl bg-cream-dark/60 px-4 py-3">
                  <div className="min-w-0">
                    <Link href={`/admin/tickets/${ticket.id}`} className="font-medium hover:text-chili">
                      #{ticket.ticketNumber}
                    </Link>
                    <p className="truncate text-xs text-ink-soft">{ticket.subject}</p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    {sla.responseState === "breached" && (
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${SLA_STATE_STYLES.breached}`}>
                        Response {formatDueLabel(sla.responseDueAt, "breached", now)}
                      </span>
                    )}
                    {sla.resolutionState === "breached" && (
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${SLA_STATE_STYLES.breached}`}>
                        Resolution {formatDueLabel(sla.resolutionDueAt, "breached", now)}
                      </span>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-3xl bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="font-heading text-lg font-bold">Orders needing attention</h2>
            <Link href="/admin/orders" className="text-sm font-semibold text-chili hover:underline">
              View all →
            </Link>
          </div>
          {fulfillmentBreached.length === 0 ? (
            <p className="mt-4 text-sm text-ink-soft">No orders overdue for fulfillment.</p>
          ) : (
            <ul className="mt-4 flex flex-col gap-3">
              {fulfillmentBreached.map(({ order, sla }) => (
                <li key={order.id} className="flex items-center justify-between gap-3 rounded-2xl bg-cream-dark/60 px-4 py-3">
                  <div className="min-w-0">
                    <Link href={`/admin/orders/${order.id}`} className="font-medium hover:text-chili">
                      #{order.orderNumber}
                    </Link>
                    <p className="truncate text-xs text-ink-soft">{order.customerName}</p>
                  </div>
                  <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold ${SLA_STATE_STYLES.breached}`}>
                    {formatDueLabel(sla.fulfillmentDueAt, "breached", now)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <p className="mt-8 text-xs text-ink-soft">
        {SLA_STATE_LABELS.at_risk} = inside the last 20% of the SLA window. {SLA_STATE_LABELS.breached} = past the deadline.
      </p>
    </div>
  );
}
