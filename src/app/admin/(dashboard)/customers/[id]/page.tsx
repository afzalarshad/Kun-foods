import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { formatPrice } from "@/lib/format";

export default async function AdminCustomerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const customer = await prisma.customer.findUnique({
    where: { id },
    include: { orders: { orderBy: { createdAt: "desc" } } },
  });

  if (!customer) notFound();

  const totalSpent = customer.orders.reduce((sum, o) => sum + o.total, 0);

  return (
    <div className="max-w-3xl">
      <h1 className="font-heading text-3xl font-extrabold">{customer.name}</h1>
      <p className="mt-1 text-ink-soft">
        {customer.email} · {customer.phone}
      </p>

      <div className="mt-8 grid gap-5 sm:grid-cols-3">
        <div className="rounded-3xl bg-white p-6 shadow-sm">
          <p className="text-sm text-ink-soft">Total orders</p>
          <p className="mt-1 font-heading text-2xl font-bold">{customer.orders.length}</p>
        </div>
        <div className="rounded-3xl bg-white p-6 shadow-sm">
          <p className="text-sm text-ink-soft">Total spent</p>
          <p className="mt-1 font-heading text-2xl font-bold">{formatPrice(totalSpent)}</p>
        </div>
        <div className="rounded-3xl bg-white p-6 shadow-sm">
          <p className="text-sm text-ink-soft">Customer since</p>
          <p className="mt-1 font-heading text-2xl font-bold">
            {new Date(customer.createdAt).toLocaleDateString("en-PK", {
              day: "numeric",
              month: "short",
              year: "numeric",
            })}
          </p>
        </div>
      </div>

      {(customer.address || customer.city) && (
        <div className="mt-6 rounded-3xl bg-white p-6 shadow-sm">
          <h2 className="font-heading font-bold">Last known address</h2>
          <p className="mt-2 text-sm text-ink-soft">
            {customer.address}
            {customer.city ? `, ${customer.city}` : ""}
          </p>
        </div>
      )}

      <div className="mt-6 rounded-3xl bg-white p-6 shadow-sm">
        <h2 className="font-heading font-bold">Order history</h2>
        <div className="mt-4 flex flex-col divide-y divide-ink/5">
          {customer.orders.map((o) => (
            <Link
              key={o.id}
              href={`/admin/orders/${o.id}`}
              className="flex items-center justify-between py-3 text-sm hover:text-chili"
            >
              <span>
                #{o.orderNumber}{" "}
                <span className="capitalize text-ink-soft">
                  · {o.status} · {o.source === "pos" ? "POS" : "Online"}
                </span>
              </span>
              <span className="font-medium">{formatPrice(o.total)}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
