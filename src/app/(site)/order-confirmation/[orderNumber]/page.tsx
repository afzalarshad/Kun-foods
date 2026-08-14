import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { formatPrice } from "@/lib/format";

export default async function OrderConfirmationPage({
  params,
}: {
  params: Promise<{ orderNumber: string }>;
}) {
  const { orderNumber } = await params;
  const order = await prisma.order.findUnique({
    where: { orderNumber },
    include: { items: true },
  });

  if (!order) notFound();

  return (
    <div className="mx-auto max-w-2xl px-4 py-14 sm:py-20">
      <div className="text-center">
        <span className="text-6xl">🎉</span>
        <h1 className="mt-4 font-heading text-3xl font-extrabold sm:text-4xl">
          Thank you, {order.customerName.split(" ")[0]}!
        </h1>
        <p className="mt-2 text-ink-soft">
          Your order has been placed. We&apos;ll send updates to {order.email}.
        </p>
        <p className="mt-4 inline-block rounded-full bg-cream-dark px-5 py-2 font-heading font-semibold">
          Order #{order.orderNumber}
        </p>
      </div>

      <div className="mt-10 rounded-3xl bg-cream-dark p-6">
        <h2 className="font-heading font-bold">Order details</h2>
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
        <div className="mt-1 flex justify-between text-sm text-ink-soft">
          <span>Shipping</span>
          <span>{order.shipping === 0 ? "Free" : formatPrice(order.shipping)}</span>
        </div>
        <div className="mt-3 flex justify-between border-t border-ink/10 pt-3 font-heading text-lg font-bold">
          <span>Total</span>
          <span>{formatPrice(order.total)}</span>
        </div>
      </div>

      <div className="mt-6 rounded-3xl border border-ink/10 p-6 text-sm text-ink-soft">
        <p>
          <span className="font-heading font-semibold text-ink">Delivering to:</span>{" "}
          {order.address}, {order.city}
          {order.postalCode ? `, ${order.postalCode}` : ""}
        </p>
        <p className="mt-1">
          <span className="font-heading font-semibold text-ink">Payment:</span>{" "}
          {order.paymentMethod === "cod" ? "Cash on delivery" : "Card / online payment"}
        </p>
      </div>

      <div className="mt-8 flex justify-center gap-3">
        <Link
          href="/collections/all"
          className="rounded-full bg-chili px-6 py-3 font-heading font-semibold text-white hover:bg-chili-dark"
        >
          Continue shopping
        </Link>
      </div>
    </div>
  );
}
