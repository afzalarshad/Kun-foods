import Link from "next/link";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { requireCustomerRecord } from "@/lib/require-customer";
import { formatPrice } from "@/lib/format";
import { AccountShell } from "@/components/account/account-shell";

export const metadata: Metadata = { title: "My orders" };

export default async function AccountOrdersPage() {
  const { customer } = await requireCustomerRecord();

  const orders = await prisma.order.findMany({
    where: { customerId: customer.id },
    orderBy: { createdAt: "desc" },
    include: { items: true },
  });

  return (
    <AccountShell customerName={customer.name}>
    <div>
      <h2 className="font-heading text-lg font-bold">My orders</h2>

      {orders.length === 0 ? (
        <div className="mt-4 rounded-3xl bg-white p-6 text-sm text-ink-soft shadow-sm">
          You haven&apos;t placed an order yet.{" "}
          <Link href="/collections/all" className="font-semibold text-chili hover:underline">
            Start shopping →
          </Link>
        </div>
      ) : (
        <ul className="mt-4 flex flex-col gap-3">
          {orders.map((order) => (
            <li key={order.id}>
              <Link
                href={`/account/orders/${order.id}`}
                className="flex flex-col gap-2 rounded-3xl bg-white p-5 shadow-sm hover:shadow-md sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="font-heading font-bold">#{order.orderNumber}</p>
                  <p className="text-xs text-ink-soft">
                    {new Date(order.createdAt).toLocaleDateString("en-PK", { day: "numeric", month: "short", year: "numeric" })} ·{" "}
                    {order.items.length} item{order.items.length === 1 ? "" : "s"}
                  </p>
                </div>
                <div className="flex items-center gap-3 sm:flex-col sm:items-end sm:gap-1">
                  <span className="rounded-full bg-cream-dark px-3 py-1 text-xs font-semibold capitalize">{order.status}</span>
                  <span className="font-medium">{formatPrice(order.total)}</span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
    </AccountShell>
  );
}
