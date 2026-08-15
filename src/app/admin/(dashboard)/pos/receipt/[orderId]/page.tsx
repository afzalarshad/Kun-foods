import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/require-admin";
import { formatPrice } from "@/lib/format";
import { getSettings, SETTING_KEYS } from "@/lib/settings";
import { PrintButton } from "@/components/admin/print-button";

export default async function PosReceiptPage({ params }: { params: Promise<{ orderId: string }> }) {
  const session = await requirePermission("pos.operate");
  const { orderId } = await params;

  const [order, settings] = await Promise.all([
    prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true, payments: { orderBy: { createdAt: "asc" } } },
    }),
    getSettings(),
  ]);
  if (!order || order.source !== "pos") notFound();

  const paidTotal = order.payments.filter((p) => p.status === "paid").reduce((sum, p) => sum + p.amount, 0);
  const due = order.total - paidTotal;

  return (
    <div className="mx-auto max-w-md">
      <div className="mb-6 flex items-center justify-between print:hidden">
        <h1 className="font-heading text-2xl font-bold">Receipt — #{order.orderNumber}</h1>
        <div className="flex gap-2">
          <Link
            href="/admin/pos"
            className="rounded-full border-2 border-ink px-4 py-2 text-sm font-heading font-semibold hover:bg-ink hover:text-cream"
          >
            New sale
          </Link>
          <PrintButton />
        </div>
      </div>

      <div className="rounded-3xl border-2 border-ink bg-white p-6 font-mono text-sm print:rounded-none print:border-2">
        <div className="text-center">
          <p className="font-heading text-lg font-extrabold">{settings[SETTING_KEYS.storeName]}</p>
          <p className="text-xs text-ink-soft">{settings[SETTING_KEYS.storeAddress]}</p>
          {settings[SETTING_KEYS.storePhone] && <p className="text-xs text-ink-soft">{settings[SETTING_KEYS.storePhone]}</p>}
        </div>

        <div className="mt-4 border-t-2 border-dashed border-ink/20 pt-3">
          <p>Receipt #{order.orderNumber}</p>
          <p>{new Date(order.createdAt).toLocaleString("en-PK", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}</p>
          <p>Cashier: {session.user.email}</p>
          <p>Customer: {order.customerName}</p>
        </div>

        <div className="mt-3 border-t-2 border-dashed border-ink/20 pt-3">
          {order.items.map((item) => (
            <div key={item.id} className="flex justify-between">
              <span>
                {item.name} x{item.quantity}
              </span>
              <span>{formatPrice(item.price * item.quantity)}</span>
            </div>
          ))}
        </div>

        <div className="mt-3 border-t-2 border-dashed border-ink/20 pt-3">
          <div className="flex justify-between">
            <span>Subtotal</span>
            <span>{formatPrice(order.subtotal)}</span>
          </div>
          {order.discount > 0 && (
            <div className="flex justify-between">
              <span>Discount</span>
              <span>-{formatPrice(order.discount)}</span>
            </div>
          )}
          {order.shipping > 0 && (
            <div className="flex justify-between">
              <span>Shipping</span>
              <span>{formatPrice(order.shipping)}</span>
            </div>
          )}
          <div className="mt-1 flex justify-between font-heading text-base font-bold">
            <span>TOTAL</span>
            <span>{formatPrice(order.total)}</span>
          </div>
        </div>

        <div className="mt-3 border-t-2 border-dashed border-ink/20 pt-3">
          <p className="text-xs uppercase tracking-wide text-ink-soft">Payment</p>
          {order.payments.map((p) => (
            <div key={p.id} className="flex justify-between">
              <span className="uppercase">{p.method.replace("_", " ")}</span>
              <span>{formatPrice(p.amount)}</span>
            </div>
          ))}
          {due > 0 && (
            <div className="mt-1 flex justify-between font-bold">
              <span>DUE</span>
              <span>{formatPrice(due)}</span>
            </div>
          )}
        </div>

        <p className="mt-4 text-center text-xs text-ink-soft">Thank you for shopping with us!</p>
      </div>
    </div>
  );
}
