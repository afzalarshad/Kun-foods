import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { OrdersTable } from "@/components/admin/orders-table";
import { getSlaThresholds, orderSlaSummary } from "@/lib/sla";

const OPEN_ORDER_STATUSES = new Set(["pending", "processing", "packed"]);

const PAGE_SIZE = 50;

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; q?: string; status?: string }>;
}) {
  const { page: pageParam, q, status } = await searchParams;
  const page = Math.max(1, Number(pageParam) || 1);
  const query = q?.trim();

  const where = {
    ...(status ? { status } : {}),
    ...(query
      ? {
          OR: [
            { orderNumber: { contains: query, mode: "insensitive" as const } },
            { customerName: { contains: query, mode: "insensitive" as const } },
            { phone: { contains: query } },
            { email: { contains: query, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };

  const [orders, total, thresholds] = await Promise.all([
    prisma.order.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.order.count({ where }),
    getSlaThresholds(),
  ]);

  const slaByOrderId = Object.fromEntries(
    orders.filter((o) => OPEN_ORDER_STATUSES.has(o.status)).map((o) => [o.id, orderSlaSummary(o, thresholds)])
  );

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const baseQuery = (overrides: { page?: number; q?: string; status?: string }) => {
    const params = new URLSearchParams();
    const qVal = overrides.q !== undefined ? overrides.q : query;
    const statusVal = overrides.status !== undefined ? overrides.status : status;
    if (qVal) params.set("q", qVal);
    if (statusVal) params.set("status", statusVal);
    if (overrides.page) params.set("page", String(overrides.page));
    const qs = params.toString();
    return qs ? `?${qs}` : "";
  };

  const statuses = ["pending", "processing", "packed", "shipped", "delivered", "cancelled"];

  return (
    <div>
      <h1 className="font-heading text-3xl font-extrabold">Orders</h1>
      <p className="mt-1 text-ink-soft">{total} total</p>

      <form className="mt-6 flex flex-wrap gap-2" action="/admin/orders">
        <input
          type="text"
          name="q"
          defaultValue={query}
          placeholder="Search by order #, customer, phone, or email…"
          className="w-full max-w-sm rounded-full border border-ink/20 bg-white px-4 py-2.5 text-sm focus:border-chili focus:outline-none"
        />
        {status && <input type="hidden" name="status" value={status} />}
        <button type="submit" className="rounded-full border border-ink/20 px-4 py-2.5 text-sm font-semibold hover:bg-cream-dark">
          Search
        </button>
        {(query || status) && (
          <Link href="/admin/orders" className="rounded-full border border-ink/20 px-4 py-2.5 text-sm font-semibold hover:bg-cream-dark">
            Clear
          </Link>
        )}
      </form>

      <div className="mt-3 flex flex-wrap gap-1.5">
        <Link
          href={baseQuery({ status: undefined, page: undefined })}
          className={`rounded-full px-3 py-1.5 text-sm font-medium ${!status ? "bg-ink text-cream" : "bg-white hover:bg-cream-dark"}`}
        >
          All statuses
        </Link>
        {statuses.map((s) => (
          <Link
            key={s}
            href={baseQuery({ status: s, page: undefined })}
            className={`rounded-full px-3 py-1.5 text-sm font-medium capitalize ${status === s ? "bg-ink text-cream" : "bg-white hover:bg-cream-dark"}`}
          >
            {s}
          </Link>
        ))}
      </div>

      <div className="mt-6">
        <OrdersTable orders={orders} slaByOrderId={slaByOrderId} />
      </div>

      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-center gap-3 text-sm">
          {page > 1 && (
            <Link href={baseQuery({ page: page - 1 })} className="rounded-full border border-ink/20 px-4 py-1.5 hover:bg-cream-dark">
              ← Newer
            </Link>
          )}
          <span className="text-ink-soft">
            Page {page} of {totalPages}
          </span>
          {page < totalPages && (
            <Link href={baseQuery({ page: page + 1 })} className="rounded-full border border-ink/20 px-4 py-1.5 hover:bg-cream-dark">
              Older →
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
