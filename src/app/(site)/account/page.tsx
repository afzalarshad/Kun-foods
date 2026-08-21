import Link from "next/link";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { requireCustomerRecord } from "@/lib/require-customer";
import { formatPrice } from "@/lib/format";
import { AccountShell } from "@/components/account/account-shell";

export const metadata: Metadata = { title: "My account" };

export default async function AccountDashboardPage() {
  const { customer } = await requireCustomerRecord();

  const [orders, openTickets] = await Promise.all([
    prisma.order.findMany({
      where: { customerId: customer.id },
      orderBy: { createdAt: "desc" },
      take: 3,
    }),
    prisma.supportTicket.count({
      where: { customerId: customer.id, status: { notIn: ["resolved", "closed"] } },
    }),
  ]);

  return (
    <AccountShell customerName={customer.name}>
    <div className="flex flex-col gap-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-3xl bg-cream-dark p-6">
          <p className="text-sm text-ink-soft">Open support tickets</p>
          <p className="mt-1 font-heading text-3xl font-extrabold">{openTickets}</p>
          <Link href="/account/tickets" className="mt-3 inline-block text-sm font-semibold text-chili hover:underline">
            View tickets →
          </Link>
        </div>
        <div className="rounded-3xl bg-cream-dark p-6">
          <p className="text-sm text-ink-soft">Account</p>
          <p className="mt-1 font-heading text-lg font-bold">{customer.email}</p>
          <p className="text-sm text-ink-soft">{customer.phone || "No phone on file yet"}</p>
          <Link href="/account/profile" className="mt-3 inline-block text-sm font-semibold text-chili hover:underline">
            Edit profile →
          </Link>
        </div>
      </div>

      <div className="rounded-3xl bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="font-heading text-lg font-bold">Recent orders</h2>
          <Link href="/account/orders" className="text-sm font-semibold text-chili hover:underline">
            View all →
          </Link>
        </div>

        {orders.length === 0 ? (
          <p className="mt-4 text-sm text-ink-soft">No orders yet — your first order will show up here.</p>
        ) : (
          <ul className="mt-4 flex flex-col divide-y divide-ink/10">
            {orders.map((order) => (
              <li key={order.id} className="py-3">
                <Link href={`/account/orders/${order.id}`} className="flex items-center justify-between gap-4 hover:text-chili">
                  <div>
                    <p className="font-medium">#{order.orderNumber}</p>
                    <p className="text-xs text-ink-soft">
                      {new Date(order.createdAt).toLocaleDateString("en-PK", { day: "numeric", month: "short", year: "numeric" })}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{formatPrice(order.total)}</p>
                    <p className="text-xs capitalize text-ink-soft">{order.status}</p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
    </AccountShell>
  );
}
