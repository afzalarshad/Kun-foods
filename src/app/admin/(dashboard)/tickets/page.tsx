import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/require-admin";
import { TicketsTable } from "@/components/admin/tickets-table";

const statuses = ["open", "pending", "in_progress", "waiting_on_customer", "resolved", "closed"] as const;
const PAGE_SIZE = 50;

export default async function TicketsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; page?: string }>;
}) {
  await requirePermission("support.manage");
  const { status, page: pageParam } = await searchParams;
  const page = Math.max(1, Number(pageParam) || 1);

  const openStatuses = ["open", "pending", "in_progress", "waiting_on_customer"];
  const where = status ? { status } : { status: { in: openStatuses } };

  const [tickets, total] = await Promise.all([
    prisma.supportTicket.findMany({
      where,
      include: { customer: true, order: { select: { orderNumber: true } } },
      orderBy: [{ priority: "desc" }, { updatedAt: "desc" }],
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.supportTicket.count({ where }),
  ]);

  const rows = tickets.map((t) => ({
    id: t.id,
    ticketNumber: t.ticketNumber,
    subject: t.subject,
    category: t.category,
    priority: t.priority,
    status: t.status,
    customerName: t.customer?.name ?? null,
    orderNumber: t.order?.orderNumber ?? null,
    updatedAt: t.updatedAt,
  }));

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const pageQuery = (n: number) => `?${status ? `status=${status}&` : ""}page=${n}`;

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-3xl font-extrabold">Support tickets</h1>
          <p className="mt-1 text-ink-soft">{total} ticket(s)</p>
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

      <div className="mt-6">
        <TicketsTable tickets={rows} />
      </div>

      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-center gap-3 text-sm">
          {page > 1 && (
            <Link href={pageQuery(page - 1)} className="rounded-full border border-ink/20 px-4 py-1.5 hover:bg-cream-dark">
              ← Newer
            </Link>
          )}
          <span className="text-ink-soft">
            Page {page} of {totalPages}
          </span>
          {page < totalPages && (
            <Link href={pageQuery(page + 1)} className="rounded-full border border-ink/20 px-4 py-1.5 hover:bg-cream-dark">
              Older →
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
