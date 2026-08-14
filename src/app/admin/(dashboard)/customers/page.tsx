import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatPrice } from "@/lib/format";

export default async function AdminCustomersPage() {
  const customers = await prisma.customer.findMany({
    include: { orders: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <h1 className="font-heading text-3xl font-extrabold">Customers</h1>
      <p className="mt-1 text-ink-soft">{customers.length} total — saved automatically from orders.</p>

      <div className="mt-8 overflow-x-auto rounded-3xl bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-ink/10 text-ink-soft">
              <th className="px-6 py-3 font-medium">Name</th>
              <th className="px-6 py-3 font-medium">Contact</th>
              <th className="px-6 py-3 font-medium">Orders</th>
              <th className="px-6 py-3 font-medium">Total spent</th>
              <th className="px-6 py-3 font-medium">Customer since</th>
            </tr>
          </thead>
          <tbody>
            {customers.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-ink-soft">
                  No customers yet — they&apos;ll appear here automatically after the first order.
                </td>
              </tr>
            )}
            {customers.map((c) => {
              const totalSpent = c.orders.reduce((sum, o) => sum + o.total, 0);
              return (
                <tr key={c.id} className="border-b border-ink/5 last:border-0">
                  <td className="px-6 py-3">
                    <Link href={`/admin/customers/${c.id}`} className="font-medium hover:text-chili">
                      {c.name}
                    </Link>
                  </td>
                  <td className="px-6 py-3 text-ink-soft">
                    {c.email}
                    <br />
                    {c.phone}
                  </td>
                  <td className="px-6 py-3">{c.orders.length}</td>
                  <td className="px-6 py-3 font-medium">{formatPrice(totalSpent)}</td>
                  <td className="px-6 py-3 text-ink-soft">
                    {new Date(c.createdAt).toLocaleDateString("en-PK", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
