import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { requireCustomerRecord } from "@/lib/require-customer";
import { formatPrice } from "@/lib/format";
import { OrderActions } from "@/components/account/order-actions";
import { AccountShell } from "@/components/account/account-shell";

export const metadata: Metadata = { title: "Order details" };

const statusSteps = ["pending", "processing", "packed", "shipped", "delivered"];

export default async function AccountOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { customer } = await requireCustomerRecord();

  const order = await prisma.order.findUnique({
    where: { id },
    include: { items: true, returns: { orderBy: { createdAt: "desc" } } },
  });
  if (!order || order.customerId !== customer.id) notFound();

  const currentIndex = statusSteps.indexOf(order.status);
  const cancelled = order.status === "cancelled";

  return (
    <AccountShell customerName={customer.name}>
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="font-heading text-2xl font-extrabold">Order #{order.orderNumber}</h2>
          <p className="text-sm text-ink-soft">
            Placed {new Date(order.createdAt).toLocaleDateString("en-PK", { day: "numeric", month: "short", year: "numeric" })}
          </p>
        </div>
        <span className="rounded-full bg-cream-dark px-3 py-1 text-xs font-semibold capitalize">{order.status}</span>
      </div>

      {cancelled ? (
        <div className="rounded-3xl bg-chili/10 p-5 text-sm text-chili-dark">
          This order was cancelled{order.cancellationReason ? `: ${order.cancellationReason}` : "."}
        </div>
      ) : (
        <div className="rounded-3xl bg-white p-6 shadow-sm">
          <div className="flex items-center">
            {statusSteps.map((step, i) => {
              const done = i <= currentIndex;
              return (
                <div key={step} className="flex flex-1 items-center last:flex-none">
                  <div className="flex flex-col items-center gap-1">
                    <span
                      className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
                        done ? "bg-basil text-white" : "bg-cream-dark text-ink-soft"
                      }`}
                    >
                      {done ? "✓" : i + 1}
                    </span>
                    <span className="text-[11px] capitalize text-ink-soft">{step}</span>
                  </div>
                  {i < statusSteps.length - 1 && (
                    <div className={`mx-1 h-0.5 flex-1 ${done ? "bg-basil" : "bg-cream-dark"}`} />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="rounded-3xl bg-white p-6 shadow-sm">
        <h3 className="font-heading font-bold">Items</h3>
        <ul className="mt-3 flex flex-col divide-y divide-ink/10">
          {order.items.map((item) => (
            <li key={item.id} className="flex justify-between py-2 text-sm">
              <span>
                {item.name} × {item.quantity}
              </span>
              <span className="font-medium">{formatPrice(item.price * item.quantity)}</span>
            </li>
          ))}
        </ul>
        <div className="mt-3 flex flex-col gap-1 border-t border-ink/10 pt-3 text-sm">
          <div className="flex justify-between text-ink-soft">
            <span>Subtotal</span>
            <span>{formatPrice(order.subtotal)}</span>
          </div>
          {order.discount > 0 && (
            <div className="flex justify-between text-ink-soft">
              <span>Discount</span>
              <span>-{formatPrice(order.discount)}</span>
            </div>
          )}
          <div className="flex justify-between text-ink-soft">
            <span>Shipping</span>
            <span>{formatPrice(order.shipping)}</span>
          </div>
          <div className="flex justify-between font-heading font-bold">
            <span>Total</span>
            <span>{formatPrice(order.total)}</span>
          </div>
        </div>
      </div>

      <div className="rounded-3xl bg-white p-6 shadow-sm">
        <h3 className="font-heading font-bold">Delivery address</h3>
        <p className="mt-2 text-sm text-ink-soft">
          {order.address}
          <br />
          {order.city}
          {order.postalCode ? ` — ${order.postalCode}` : ""}
        </p>
      </div>

      {order.returns.length > 0 && (
        <div className="rounded-3xl bg-white p-6 shadow-sm">
          <h3 className="font-heading font-bold">Return requests</h3>
          <ul className="mt-3 flex flex-col gap-3">
            {order.returns.map((r) => (
              <li key={r.id} className="rounded-2xl bg-cream-dark p-4 text-sm">
                <div className="flex items-center justify-between">
                  <span className="font-semibold capitalize">{r.status}</span>
                  <span className="text-xs text-ink-soft">
                    {new Date(r.createdAt).toLocaleDateString("en-PK", { day: "numeric", month: "short", year: "numeric" })}
                  </span>
                </div>
                <p className="mt-1 text-ink-soft">{r.reason}</p>
              </li>
            ))}
          </ul>
        </div>
      )}

      <OrderActions
        orderId={order.id}
        status={order.status}
        hasReturn={order.returns.length > 0}
      />
    </div>
    </AccountShell>
  );
}
