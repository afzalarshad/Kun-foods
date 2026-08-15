import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { CustomersTable } from "@/components/admin/customers-table";
import { SEGMENTS, matchesSegment, type SegmentId } from "@/lib/segments";

const PAGE_SIZE = 50;

export default async function AdminCustomersPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; q?: string; segment?: string }>;
}) {
  const { page: pageParam, q, segment } = await searchParams;
  const page = Math.max(1, Number(pageParam) || 1);
  const query = q?.trim();
  const activeSegment = SEGMENTS.find((s) => s.id === segment)?.id as SegmentId | undefined;

  const where = query
    ? {
        OR: [
          { name: { contains: query, mode: "insensitive" as const } },
          { email: { contains: query, mode: "insensitive" as const } },
          { phone: { contains: query } },
        ],
      }
    : {};

  const allMatching = await prisma.customer.findMany({
    where,
    include: {
      tags: true,
      orders: {
        select: { total: true, status: true, createdAt: true, couponId: true, paymentMethod: true, returns: { select: { id: true } } },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const filtered = activeSegment ? allMatching.filter((c) => matchesSegment(c, activeSegment)) : allMatching;
  const total = filtered.length;
  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const rows = pageItems.map((c) => ({
    id: c.id,
    name: c.name,
    email: c.email,
    phone: c.phone,
    createdAt: c.createdAt,
    orderCount: c.orders.filter((o) => o.status !== "cancelled").length,
    totalSpent: c.orders.filter((o) => o.status !== "cancelled").reduce((sum, o) => sum + o.total, 0),
  }));

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const pageQuery = (overrides: { page?: number; segment?: string }) => {
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    const seg = "segment" in overrides ? overrides.segment : activeSegment;
    if (seg) params.set("segment", seg);
    if (overrides.page) params.set("page", String(overrides.page));
    const qs = params.toString();
    return qs ? `?${qs}` : "";
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-3xl font-extrabold">Customers</h1>
          <p className="mt-1 text-ink-soft">{total} total — saved automatically from orders.</p>
        </div>
        <a
          href={`/api/admin/export/customers${activeSegment ? `?segment=${activeSegment}` : ""}`}
          className="rounded-full border-2 border-ink px-5 py-2.5 text-sm font-heading font-semibold hover:bg-ink hover:text-cream"
        >
          ⬇ Export {activeSegment ? "this segment" : "all"}
        </a>
      </div>

      <form className="mt-6 flex gap-2" action="/admin/customers">
        <input
          type="text"
          name="q"
          defaultValue={query}
          placeholder="Search by name, email, or phone…"
          className="w-full max-w-sm rounded-full border border-ink/20 bg-white px-4 py-2.5 text-sm focus:border-chili focus:outline-none"
        />
        {activeSegment && <input type="hidden" name="segment" value={activeSegment} />}
        <button type="submit" className="rounded-full border border-ink/20 px-4 py-2.5 text-sm font-semibold hover:bg-cream-dark">
          Search
        </button>
        {(query || activeSegment) && (
          <Link href="/admin/customers" className="rounded-full border border-ink/20 px-4 py-2.5 text-sm font-semibold hover:bg-cream-dark">
            Clear
          </Link>
        )}
      </form>

      <div className="mt-3 flex flex-wrap gap-1.5">
        <Link
          href={pageQuery({ segment: undefined, page: undefined })}
          className={`rounded-full px-3 py-1.5 text-sm font-medium ${!activeSegment ? "bg-ink text-cream" : "bg-white hover:bg-cream-dark"}`}
        >
          All customers
        </Link>
        {SEGMENTS.map((s) => (
          <Link
            key={s.id}
            href={pageQuery({ segment: s.id, page: undefined })}
            className={`rounded-full px-3 py-1.5 text-sm font-medium ${activeSegment === s.id ? "bg-ink text-cream" : "bg-white hover:bg-cream-dark"}`}
          >
            {s.label}
          </Link>
        ))}
      </div>

      <div className="mt-6">
        <CustomersTable customers={rows} />
      </div>

      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-center gap-3 text-sm">
          {page > 1 && (
            <Link href={pageQuery({ page: page - 1 })} className="rounded-full border border-ink/20 px-4 py-1.5 hover:bg-cream-dark">
              ← Newer
            </Link>
          )}
          <span className="text-ink-soft">
            Page {page} of {totalPages}
          </span>
          {page < totalPages && (
            <Link href={pageQuery({ page: page + 1 })} className="rounded-full border border-ink/20 px-4 py-1.5 hover:bg-cream-dark">
              Older →
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
