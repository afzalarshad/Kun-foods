import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatPrice } from "@/lib/format";
import { requireAdmin } from "@/lib/require-admin";
import { hasPermission } from "@/lib/permissions";

export default async function AdminDashboardPage() {
  const session = await requireAdmin();
  const canViewRevenue = hasPermission(session.user.role ?? "staff", "reports.financial");

  const [orderCount, productCount, revenueAgg, recentOrders, lowStockProducts] = await Promise.all([
    prisma.order.count(),
    prisma.product.count(),
    canViewRevenue ? prisma.order.aggregate({ _sum: { total: true } }) : Promise.resolve(null),
    prisma.order.findMany({ orderBy: { createdAt: "desc" }, take: 5 }),
    prisma.product.findMany({
      where: { reorderLevel: { not: null } },
      select: { id: true, name: true, stock: true, reorderLevel: true },
    }),
  ]);

  const lowStockAlerts = lowStockProducts.filter((p) => p.reorderLevel !== null && p.stock <= p.reorderLevel);

  const stats = [
    { label: "Total orders", value: orderCount, icon: "📦" },
    ...(canViewRevenue ? [{ label: "Total revenue", value: formatPrice(revenueAgg?._sum.total ?? 0), icon: "💰" }] : []),
    { label: "Products", value: productCount, icon: "🌶️" },
    { label: "Low stock alerts", value: lowStockAlerts.length, icon: "⚠️" },
  ];

  return (
    <div>
      <h1 className="font-heading text-3xl font-extrabold">Dashboard</h1>
      <p className="mt-1 text-ink-soft">Welcome back to the Kun Foods admin panel.</p>

      <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="rounded-3xl bg-white p-6 shadow-sm">
            <span className="text-2xl">{s.icon}</span>
            <p className="mt-3 font-heading text-2xl font-bold">{s.value}</p>
            <p className="text-sm text-ink-soft">{s.label}</p>
          </div>
        ))}
      </div>

      {lowStockAlerts.length > 0 && (
        <div className="mt-10 rounded-3xl border-2 border-chili/30 bg-chili/5 p-6">
          <div className="flex items-center justify-between">
            <h2 className="font-heading font-bold text-chili-dark">⚠️ Low stock</h2>
            <Link href="/admin/inventory" className="text-sm font-semibold text-chili hover:underline">
              Manage inventory →
            </Link>
          </div>
          <ul className="mt-3 flex flex-wrap gap-2">
            {lowStockAlerts.map((p) => (
              <li key={p.id}>
                <Link
                  href={`/admin/inventory?product=${p.id}`}
                  className="rounded-full bg-white px-3 py-1.5 text-sm font-medium shadow-sm hover:text-chili"
                >
                  {p.name} — {p.stock} left
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-10 rounded-3xl bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="font-heading text-lg font-bold">Recent orders</h2>
          <Link href="/admin/orders" className="text-sm font-semibold text-chili hover:underline">
            View all →
          </Link>
        </div>

        {recentOrders.length === 0 ? (
          <p className="mt-6 text-sm text-ink-soft">No orders yet.</p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-ink/10 text-ink-soft">
                  <th className="py-2 pr-4 font-medium">Order</th>
                  <th className="py-2 pr-4 font-medium">Customer</th>
                  <th className="py-2 pr-4 font-medium">Status</th>
                  <th className="py-2 pr-4 font-medium">Total</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((order) => (
                  <tr key={order.id} className="border-b border-ink/5 last:border-0">
                    <td className="py-3 pr-4">
                      <Link href={`/admin/orders/${order.id}`} className="font-medium hover:text-chili">
                        #{order.orderNumber}
                      </Link>
                    </td>
                    <td className="py-3 pr-4">{order.customerName}</td>
                    <td className="py-3 pr-4 capitalize">{order.status}</td>
                    <td className="py-3 pr-4 font-medium">{formatPrice(order.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
