import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { formatPrice } from "@/lib/format";
import { OrderStatusForm } from "@/components/admin/order-status-form";

export default async function AdminOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const order = await prisma.order.findUnique({ where: { id }, include: { items: true } });
  if (!order) notFound();

  return (
    <div className="max-w-3xl">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-3xl font-extrabold">Order #{order.orderNumber}</h1>
          <p className="mt-1 text-ink-soft">
            Placed{" "}
            {new Date(order.createdAt).toLocaleDateString("en-PK", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}{" "}
            ·{" "}
            <span
              className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                order.source === "pos" ? "bg-plum/20 text-plum" : "bg-cream-dark"
              }`}
            >
              {order.source === "pos" ? "POS" : "Online"}
            </span>
          </p>
        </div>
        <OrderStatusForm orderId={order.id} currentStatus={order.status} />
      </div>

      <div className="mt-8 grid gap-6 sm:grid-cols-2">
        <div className="rounded-3xl bg-white p-6 shadow-sm">
          <h2 className="font-heading font-bold">Customer</h2>
          <p className="mt-3 text-sm">{order.customerName}</p>
          <p className="text-sm text-ink-soft">{order.email}</p>
          <p className="text-sm text-ink-soft">{order.phone}</p>
        </div>
        <div className="rounded-3xl bg-white p-6 shadow-sm">
          <h2 className="font-heading font-bold">Delivery address</h2>
          <p className="mt-3 text-sm">{order.address}</p>
          <p className="text-sm text-ink-soft">
            {order.city}
            {order.postalCode ? `, ${order.postalCode}` : ""}
          </p>
          {order.notes && <p className="mt-2 text-sm italic text-ink-soft">&ldquo;{order.notes}&rdquo;</p>}
        </div>
      </div>

      <div className="mt-6 rounded-3xl bg-white p-6 shadow-sm">
        <h2 className="font-heading font-bold">Items</h2>
        <ul className="mt-4 flex flex-col gap-3">
          {order.items.map((item) => (
            <li key={item.id} className="flex justify-between text-sm">
              <span>
                {item.name} <span className="text-ink-soft">× {item.quantity}</span>
              </span>
              <span className="font-medium">{formatPrice(item.price * item.quantity)}</span>
            </li>
          ))}
        </ul>
        <div className="mt-4 flex justify-between border-t border-ink/10 pt-4 text-sm text-ink-soft">
          <span>Subtotal</span>
          <span>{formatPrice(order.subtotal)}</span>
        </div>
        {order.discount > 0 && (
          <div className="mt-1 flex justify-between text-sm text-basil-dark">
            <span>Discount</span>
            <span>−{formatPrice(order.discount)}</span>
          </div>
        )}
        <div className="mt-1 flex justify-between text-sm text-ink-soft">
          <span>Shipping</span>
          <span>{order.shipping === 0 ? "Free" : formatPrice(order.shipping)}</span>
        </div>
        <div className="mt-3 flex justify-between border-t border-ink/10 pt-3 font-heading text-lg font-bold">
          <span>Total</span>
          <span>{formatPrice(order.total)}</span>
        </div>
        <p className="mt-3 text-sm text-ink-soft">
          Payment method: <span className="uppercase">{order.paymentMethod}</span>
        </p>
      </div>
    </div>
  );
}
