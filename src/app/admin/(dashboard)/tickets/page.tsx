import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";

const statuses = ["open", "pending", "in_progress", "waiting_on_customer", "resolved", "closed"] as const;

const statusStyles: Record<string, string> = {
  open: "bg-chili/20 text-chili-dark",
  pending: "bg-saffron/20 text-saffron-dark",
  in_progress: "bg-plum/20 text-plum",
  waiting_on_customer: "bg-plum/20 text-plum",
  resolved: "bg-basil/20 text-basil-dark",
  closed: "bg-cream-dark text-ink-soft",
};

const priorityStyles: Record<string, string> = {
  low: "text-ink-soft",
  normal: "text-ink",
  high: "text-saffron-dark",
  urgent: "text-chili-dark",
};

export default async function TicketsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  await requireAdmin();
  const { status } = await searchParams;

  const openStatuses = ["open", "pending", "in_progress", "waiting_on_customer"];
  const where = status ? { status } : { status: { in: openStatuses } };

  const tickets = await prisma.supportTicket.findMany({
    where,
    include: { customer: true, order: { select: { orderNumber: true } } },
    orderBy: [{ priority: "desc" }, { updatedAt: "desc" }],
  });

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-3xl font-extrabold">Support tickets</h1>
          <p className="mt-1 text-ink-soft">{tickets.length} ticket(s)</p>
        </div>
        <Link
          href="/admin/tickets/new"
          className="rounded-full bg-chili px-5 py-2.5 font-heading font-semibold text-white hover:bg-chili-dark"
        >
          + New ticket
        </Link>
      </div>

      <div className="mt-6 flex flex-wrap gap-1.5">
        <Link
          href="/admin/tickets"
          className={`rounded-full px-3 py-1.5 text-sm font-medium ${!status ? "bg-ink text-cream" : "bg-white hover:bg-cream-dark"}`}
        >
          Open queue
        </Link>
        {statuses.map((s) => (
          <Link
            key={s}
            href={`/admin/tickets?status=${s}`}
            className={`rounded-full px-3 py-1.5 text-sm font-medium capitalize ${status === s ? "bg-ink text-cream" : "bg-white hover:bg-cream-dark"}`}
          >
            {s.replace("_", " ")}
          </Link>
        ))}
      </div>

      <div className="mt-6 overflow-x-auto rounded-3xl bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-ink/10 text-ink-soft">
              <th className="px-6 py-3 font-medium">Ticket</th>
              <th className="px-6 py-3 font-medium">Customer</th>
              <th className="px-6 py-3 font-medium">Category</th>
              <th className="px-6 py-3 font-medium">Priority</th>
              <th className="px-6 py-3 font-medium">Status</th>
              <th className="px-6 py-3 font-medium">Updated</th>
            </tr>
          </thead>
          <tbody>
            {tickets.length === 0 && (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-ink-soft">
                  Nothing here — nice and quiet.
                </td>
              </tr>
            )}
            {tickets.map((t) => (
              <tr key={t.id} className="border-b border-ink/5 last:border-0">
                <td className="px-6 py-3">
                  <Link href={`/admin/tickets/${t.id}`} className="font-medium hover:text-chili">
                    #{t.ticketNumber}
                  </Link>
                  <p className="text-xs text-ink-soft">{t.subject}</p>
                  {t.order && <p className="text-xs text-ink-soft">Order #{t.order.orderNumber}</p>}
                </td>
                <td className="px-6 py-3">{t.customer?.name ?? "—"}</td>
                <td className="px-6 py-3 capitalize text-ink-soft">{t.category}</td>
                <td className={`px-6 py-3 font-medium capitalize ${priorityStyles[t.priority] ?? ""}`}>{t.priority}</td>
                <td className="px-6 py-3">
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${statusStyles[t.status] ?? "bg-cream-dark"}`}>
                    {t.status.replace("_", " ")}
                  </span>
                </td>
                <td className="px-6 py-3 whitespace-nowrap text-ink-soft">
                  {new Date(t.updatedAt).toLocaleDateString("en-PK", { day: "numeric", month: "short" })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
