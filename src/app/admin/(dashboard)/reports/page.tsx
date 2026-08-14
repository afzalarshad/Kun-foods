import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";
import { formatPrice } from "@/lib/format";

const RANGES = [
  { label: "7 days", days: 7 },
  { label: "30 days", days: 30 },
  { label: "90 days", days: 90 },
];

const statusStyles: Record<string, string> = {
  pending: "bg-cream-dark text-ink-soft",
  processing: "bg-saffron/20 text-saffron-dark",
  shipped: "bg-plum/20 text-plum",
  delivered: "bg-basil/20 text-basil-dark",
  cancelled: "bg-chili/20 text-chili-dark",
};

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ days?: string }>;
}) {
  await requireAdmin();
  const { days: daysParam } = await searchParams;
  const days = [7, 30, 90].includes(Number(daysParam)) ? Number(daysParam) : 30;

  const since = new Date();
  since.setDate(since.getDate() - days);
  since.setHours(0, 0, 0, 0);

  const [orders, newCustomers] = await Promise.all([
    prisma.order.findMany({
      where: { createdAt: { gte: since } },
      include: { items: { include: { product: { include: { category: true } } } } },
      orderBy: { createdAt: "asc" },
    }),
    prisma.customer.count({ where: { createdAt: { gte: since } } }),
  ]);

  const nonCancelled = orders.filter((o) => o.status !== "cancelled");
  const totalRevenue = nonCancelled.reduce((sum, o) => sum + o.total, 0);
  const avgOrderValue = nonCancelled.length ? Math.round(totalRevenue / nonCancelled.length) : 0;

  // Sales by day
  const byDay = new Map<string, number>();
  for (const o of nonCancelled) {
    const key = o.createdAt.toISOString().slice(0, 10);
    byDay.set(key, (byDay.get(key) ?? 0) + o.total);
  }
  const dayKeys: string[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    dayKeys.push(d.toISOString().slice(0, 10));
  }
  const salesByDay = dayKeys.map((key) => ({ date: key, revenue: byDay.get(key) ?? 0 }));
  const maxDayRevenue = Math.max(1, ...salesByDay.map((d) => d.revenue));

  // Top products
  const productStats = new Map<string, { name: string; qty: number; revenue: number }>();
  for (const o of nonCancelled) {
    for (const item of o.items) {
      const key = item.productId ?? item.bundleId ?? item.name;
      const existing = productStats.get(key) ?? { name: item.name, qty: 0, revenue: 0 };
      existing.qty += item.quantity;
      existing.revenue += item.price * item.quantity;
      productStats.set(key, existing);
    }
  }
  const topProducts = [...productStats.values()].sort((a, b) => b.revenue - a.revenue).slice(0, 8);
  const maxProductRevenue = Math.max(1, ...topProducts.map((p) => p.revenue));

  // Revenue by category
  const categoryStats = new Map<string, number>();
  for (const o of nonCancelled) {
    for (const item of o.items) {
      const categoryName = item.product?.category?.name ?? "Bundles / other";
      categoryStats.set(categoryName, (categoryStats.get(categoryName) ?? 0) + item.price * item.quantity);
    }
  }
  const byCategory = [...categoryStats.entries()].sort((a, b) => b[1] - a[1]);
  const maxCategoryRevenue = Math.max(1, ...byCategory.map(([, v]) => v));

  // Order status breakdown
  const statusCounts = new Map<string, number>();
  for (const o of orders) {
    statusCounts.set(o.status, (statusCounts.get(o.status) ?? 0) + 1);
  }
  const byStatus = [...statusCounts.entries()].sort((a, b) => b[1] - a[1]);

  // Payment method breakdown
  const methodStats = new Map<string, { count: number; revenue: number }>();
  for (const o of nonCancelled) {
    const existing = methodStats.get(o.paymentMethod) ?? { count: 0, revenue: 0 };
    existing.count += 1;
    existing.revenue += o.total;
    methodStats.set(o.paymentMethod, existing);
  }
  const byMethod = [...methodStats.entries()].sort((a, b) => b[1].revenue - a[1].revenue);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-3xl font-extrabold">Reports</h1>
          <p className="mt-1 text-ink-soft">Sales, products, and customers — last {days} days.</p>
        </div>
        <div className="flex gap-1.5">
          {RANGES.map((r) => (
            <Link
              key={r.days}
              href={`/admin/reports?days=${r.days}`}
              className={`rounded-full px-3 py-1.5 text-sm font-medium ${days === r.days ? "bg-ink text-cream" : "bg-white hover:bg-cream-dark"}`}
            >
              {r.label}
            </Link>
          ))}
        </div>
      </div>

      <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-3xl bg-white p-6 shadow-sm">
          <p className="text-sm text-ink-soft">Revenue</p>
          <p className="mt-1 font-heading text-2xl font-bold">{formatPrice(totalRevenue)}</p>
        </div>
        <div className="rounded-3xl bg-white p-6 shadow-sm">
          <p className="text-sm text-ink-soft">Orders</p>
          <p className="mt-1 font-heading text-2xl font-bold">{nonCancelled.length}</p>
        </div>
        <div className="rounded-3xl bg-white p-6 shadow-sm">
          <p className="text-sm text-ink-soft">Avg. order value</p>
          <p className="mt-1 font-heading text-2xl font-bold">{formatPrice(avgOrderValue)}</p>
        </div>
        <div className="rounded-3xl bg-white p-6 shadow-sm">
          <p className="text-sm text-ink-soft">New customers</p>
          <p className="mt-1 font-heading text-2xl font-bold">{newCustomers}</p>
        </div>
      </div>

      <div className="mt-6 rounded-3xl bg-white p-6 shadow-sm">
        <h2 className="font-heading font-bold">Sales by day</h2>
        <div className="mt-6 flex h-40 items-end gap-1 overflow-x-auto">
          {salesByDay.map((d) => (
            <div key={d.date} className="group relative flex h-full flex-1 min-w-[6px] flex-col items-center justify-end">
              <div
                className="w-full rounded-t-sm bg-chili transition-colors group-hover:bg-chili-dark"
                style={{ height: `${Math.max(2, (d.revenue / maxDayRevenue) * 100)}%` }}
              />
              <div className="pointer-events-none absolute bottom-full mb-1 hidden whitespace-nowrap rounded-lg bg-ink px-2 py-1 text-xs text-cream group-hover:block">
                {new Date(d.date).toLocaleDateString("en-PK", { day: "numeric", month: "short" })} · {formatPrice(d.revenue)}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div className="rounded-3xl bg-white p-6 shadow-sm">
          <h2 className="font-heading font-bold">Top products</h2>
          <div className="mt-4 flex flex-col gap-3">
            {topProducts.length === 0 && <p className="text-sm text-ink-soft">No sales in this period.</p>}
            {topProducts.map((p) => (
              <div key={p.name}>
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">{p.name}</span>
                  <span className="text-ink-soft">
                    {p.qty} sold · {formatPrice(p.revenue)}
                  </span>
                </div>
                <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-cream-dark">
                  <div
                    className="h-full rounded-full bg-saffron"
                    style={{ width: `${Math.max(3, (p.revenue / maxProductRevenue) * 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-3xl bg-white p-6 shadow-sm">
          <h2 className="font-heading font-bold">Revenue by category</h2>
          <div className="mt-4 flex flex-col gap-3">
            {byCategory.length === 0 && <p className="text-sm text-ink-soft">No sales in this period.</p>}
            {byCategory.map(([name, revenue]) => (
              <div key={name}>
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">{name}</span>
                  <span className="text-ink-soft">{formatPrice(revenue)}</span>
                </div>
                <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-cream-dark">
                  <div
                    className="h-full rounded-full bg-basil"
                    style={{ width: `${Math.max(3, (revenue / maxCategoryRevenue) * 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div className="rounded-3xl bg-white p-6 shadow-sm">
          <h2 className="font-heading font-bold">Orders by status</h2>
          <div className="mt-4 flex flex-wrap gap-2">
            {byStatus.length === 0 && <p className="text-sm text-ink-soft">No orders in this period.</p>}
            {byStatus.map(([status, count]) => (
              <span
                key={status}
                className={`rounded-full px-3 py-1.5 text-sm font-semibold capitalize ${statusStyles[status] ?? "bg-cream-dark"}`}
              >
                {status}: {count}
              </span>
            ))}
          </div>
        </div>

        <div className="rounded-3xl bg-white p-6 shadow-sm">
          <h2 className="font-heading font-bold">Payment methods</h2>
          <div className="mt-4 flex flex-col gap-2">
            {byMethod.length === 0 && <p className="text-sm text-ink-soft">No orders in this period.</p>}
            {byMethod.map(([method, stat]) => (
              <div key={method} className="flex items-center justify-between text-sm">
                <span className="font-medium uppercase">{method}</span>
                <span className="text-ink-soft">
                  {stat.count} orders · {formatPrice(stat.revenue)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
