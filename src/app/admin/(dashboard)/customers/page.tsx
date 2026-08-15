import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { CustomersTable } from "@/components/admin/customers-table";

const PAGE_SIZE = 50;

export default async function AdminCustomersPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; q?: string }>;
}) {
  const { page: pageParam, q } = await searchParams;
  const page = Math.max(1, Number(pageParam) || 1);
  const query = q?.trim();

  const where = query
    ? {
        OR: [
          { name: { contains: query, mode: "insensitive" as const } },
          { email: { contains: query, mode: "insensitive" as const } },
          { phone: { contains: query } },
        ],
      }
    : {};

  const [customers, total] = await Promise.all([
    prisma.customer.findMany({
      where,
      include: { orders: { select: { total: true } } },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.customer.count({ where }),
  ]);

  const rows = customers.map((c) => ({
    id: c.id,
    name: c.name,
    email: c.email,
    phone: c.phone,
    createdAt: c.createdAt,
    orderCount: c.orders.length,
    totalSpent: c.orders.reduce((sum, o) => sum + o.total, 0),
  }));

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const pageQuery = (n: number) => `?${query ? `q=${encodeURIComponent(query)}&` : ""}page=${n}`;

  return (
    <div>
      <h1 className="font-heading text-3xl font-extrabold">Customers</h1>
      <p className="mt-1 text-ink-soft">{total} total — saved automatically from orders.</p>

      <form className="mt-6 flex gap-2" action="/admin/customers">
        <input
          type="text"
          name="q"
          defaultValue={query}
          placeholder="Search by name, email, or phone…"
          className="w-full max-w-sm rounded-full border border-ink/20 bg-white px-4 py-2.5 text-sm focus:border-chili focus:outline-none"
        />
        <button type="submit" className="rounded-full border border-ink/20 px-4 py-2.5 text-sm font-semibold hover:bg-cream-dark">
          Search
        </button>
        {query && (
          <Link href="/admin/customers" className="rounded-full border border-ink/20 px-4 py-2.5 text-sm font-semibold hover:bg-cream-dark">
            Clear
          </Link>
        )}
      </form>

      <div className="mt-6">
        <CustomersTable customers={rows} />
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
