import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatPrice } from "@/lib/format";

const statusStyles: Record<string, string> = {
  pending: "bg-saffron/20 text-saffron-dark",
  processing: "bg-plum/20 text-plum",
  shipped: "bg-basil/20 text-basil-dark",
  delivered: "bg-basil text-white",
  cancelled: "bg-chili/20 text-chili-dark",
};

const priorityDot: Record<string, string> = {
  low: "bg-ink/20",
  normal: "",
  high: "bg-saffron",
  urgent: "bg-chili",
};

export default async function AdminOrdersPage() {
  const orders = await prisma.order.findMany({ orderBy: { createdAt: "desc" } });

  return (
    <div>
      <h1 className="font-heading text-3xl font-extrabold">Orders</h1>
      <p className="mt-1 text-ink-soft">{orders.length} total</p>

      <div className="mt-8 overflow-x-auto rounded-3xl bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-ink/10 text-ink-soft">
              <th className="px-6 py-3 font-medium">Order</th>
              <th className="px-6 py-3 font-medium">Customer</th>
              <th className="px-6 py-3 font-medium">Source</th>
              <th className="px-6 py-3 font-medium">Payment</th>
              <th className="px-6 py-3 font-medium">Status</th>
              <th className="px-6 py-3 font-medium">Total</th>
              <th className="px-6 py-3 font-medium">Date</th>
            </tr>
          </thead>
          <tbody>
            {orders.length === 0 && (
              <tr>
                <td colSpan={7} className="px-6 py-8 text-center text-ink-soft">
                  No orders yet.
                </td>
              </tr>
            )}
            {orders.map((order) => (
              <tr key={order.id} className="border-b border-ink/5 last:border-0">
                <td className="px-6 py-3">
                  <Link href={`/admin/orders/${order.id}`} className="flex items-center gap-2 font-medium hover:text-chili">
                    {priorityDot[order.priority] && (
                      <span
                        className={`h-2 w-2 shrink-0 rounded-full ${priorityDot[order.priority]}`}
                        title={`${order.priority} priority`}
                      />
                    )}
                    #{order.orderNumber}
                  </Link>
                </td>
                <td className="px-6 py-3">{order.customerName}</td>
                <td className="px-6 py-3">
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                      order.source === "pos" ? "bg-plum/20 text-plum" : "bg-cream-dark"
                    }`}
                  >
                    {order.source === "pos" ? "POS" : "Online"}
                  </span>
                </td>
                <td className="px-6 py-3 uppercase text-ink-soft">{order.paymentMethod}</td>
                <td className="px-6 py-3">
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${
                      statusStyles[order.status] ?? "bg-cream-dark"
                    }`}
                  >
                    {order.status}
                  </span>
                </td>
                <td className="px-6 py-3 font-medium">{formatPrice(order.total)}</td>
                <td className="px-6 py-3 text-ink-soft">
                  {new Date(order.createdAt).toLocaleDateString("en-PK", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
