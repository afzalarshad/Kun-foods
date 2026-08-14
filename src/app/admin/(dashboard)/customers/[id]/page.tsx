import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { formatPrice } from "@/lib/format";
import { CustomerTags } from "@/components/admin/customer-tags";
import { CustomerNotes } from "@/components/admin/customer-notes";
import { CustomerAddresses } from "@/components/admin/customer-addresses";

export default async function AdminCustomerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const customer = await prisma.customer.findUnique({
    where: { id },
    include: {
      orders: { orderBy: { createdAt: "desc" } },
      tags: { orderBy: { createdAt: "asc" } },
      notes: { orderBy: { createdAt: "desc" } },
      addresses: { orderBy: { createdAt: "desc" } },
    },
  });

  if (!customer) notFound();

  const totalSpent = customer.orders.reduce((sum, o) => sum + o.total, 0);
  const avgOrderValue = customer.orders.length ? Math.round(totalSpent / customer.orders.length) : 0;
  const cancelledCount = customer.orders.filter((o) => o.status === "cancelled").length;
  const lastOrder = customer.orders[0];
  const waLink = customer.phone
    ? `https://wa.me/${customer.phone.replace(/[^0-9]/g, "")}`
    : null;

  return (
    <div className="max-w-3xl">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-heading text-3xl font-extrabold">{customer.name}</h1>
          <p className="mt-1 text-ink-soft">
            {customer.email} · {customer.phone}
          </p>
        </div>
        <div className="flex gap-2">
          {waLink && (
            <a
              href={waLink}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full border-2 border-[#25D366] px-4 py-2 text-sm font-heading font-semibold text-[#128C7E] hover:bg-[#25D366]/10"
            >
              💬 WhatsApp
            </a>
          )}
          <Link
            href="/admin/pos"
            className="rounded-full bg-chili px-4 py-2 text-sm font-heading font-semibold text-white hover:bg-chili-dark"
          >
            + New order
          </Link>
        </div>
      </div>

      <div className="mt-8 grid gap-5 sm:grid-cols-4">
        <div className="rounded-3xl bg-white p-6 shadow-sm">
          <p className="text-sm text-ink-soft">Total orders</p>
          <p className="mt-1 font-heading text-2xl font-bold">{customer.orders.length}</p>
        </div>
        <div className="rounded-3xl bg-white p-6 shadow-sm">
          <p className="text-sm text-ink-soft">Lifetime value</p>
          <p className="mt-1 font-heading text-2xl font-bold">{formatPrice(totalSpent)}</p>
        </div>
        <div className="rounded-3xl bg-white p-6 shadow-sm">
          <p className="text-sm text-ink-soft">Avg. order value</p>
          <p className="mt-1 font-heading text-2xl font-bold">{formatPrice(avgOrderValue)}</p>
        </div>
        <div className="rounded-3xl bg-white p-6 shadow-sm">
          <p className="text-sm text-ink-soft">Cancelled orders</p>
          <p className="mt-1 font-heading text-2xl font-bold">{cancelledCount}</p>
        </div>
      </div>

      <p className="mt-3 text-sm text-ink-soft">
        Customer since{" "}
        {new Date(customer.createdAt).toLocaleDateString("en-PK", { day: "numeric", month: "short", year: "numeric" })}
        {lastOrder &&
          ` · Last order ${new Date(lastOrder.createdAt).toLocaleDateString("en-PK", { day: "numeric", month: "short", year: "numeric" })}`}
      </p>

      <div className="mt-6 grid gap-6 sm:grid-cols-2">
        <CustomerTags customerId={customer.id} tags={customer.tags} />
        <CustomerAddresses customerId={customer.id} addresses={customer.addresses} />
      </div>

      <div className="mt-6">
        <CustomerNotes customerId={customer.id} notes={customer.notes} />
      </div>

      <div className="mt-6 rounded-3xl bg-white p-6 shadow-sm">
        <h2 className="font-heading font-bold">Order history</h2>
        <div className="mt-4 flex flex-col divide-y divide-ink/5">
          {customer.orders.length === 0 && <p className="py-3 text-sm text-ink-soft">No orders yet.</p>}
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
