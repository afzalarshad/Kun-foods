"use client";

import { useTransition } from "react";
import type { Payment } from "@prisma/client";
import { formatPrice } from "@/lib/format";
import { createPayment, updatePaymentStatus } from "@/app/admin/(dashboard)/orders/payments-actions";

const statusStyles: Record<string, string> = {
  pending: "bg-saffron/20 text-saffron-dark",
  paid: "bg-basil/20 text-basil-dark",
  refunded: "bg-chili/20 text-chili-dark",
  partially_refunded: "bg-plum/20 text-plum",
};

const statuses = ["pending", "paid", "refunded", "partially_refunded"];
const methods = ["cod", "cash", "card", "bank_transfer", "other"];

function PaymentRow({ payment, orderId }: { payment: Payment; orderId: string }) {
  const [isPending, startTransition] = useTransition();
  const action = updatePaymentStatus.bind(null, payment.id, orderId);

  return (
    <li className="rounded-2xl border border-ink/10 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-heading font-bold">{formatPrice(payment.amount)}</p>
          <p className="text-xs uppercase tracking-wide text-ink-soft">{payment.method.replace("_", " ")}</p>
        </div>
        <span
          className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${
            statusStyles[payment.status] ?? "bg-cream-dark"
          }`}
        >
          {payment.status.replace("_", " ")}
        </span>
      </div>
      {payment.transactionRef && (
        <p className="mt-1 text-xs text-ink-soft">Ref: {payment.transactionRef}</p>
      )}
      {payment.notes && <p className="mt-1 text-sm">{payment.notes}</p>}
      <p className="mt-1 text-xs text-ink-soft">
        {new Date(payment.createdAt).toLocaleDateString("en-PK", { day: "numeric", month: "short", year: "numeric" })}
      </p>
      <form
        action={(formData) => startTransition(() => action(formData))}
        className="mt-3 flex items-center gap-2"
      >
        <select
          name="status"
          defaultValue={payment.status}
          className="rounded-full border border-ink/20 bg-white px-3 py-1 text-xs capitalize focus:border-chili focus:outline-none"
        >
          {statuses.map((s) => (
            <option key={s} value={s}>
              {s.replace("_", " ")}
            </option>
          ))}
        </select>
        <button
          type="submit"
          disabled={isPending}
          className="rounded-full bg-ink px-3 py-1 text-xs font-semibold text-cream hover:bg-ink/90 disabled:opacity-60"
        >
          {isPending ? "…" : "Update"}
        </button>
      </form>
    </li>
  );
}

export function PaymentsPanel({
  orderId,
  orderTotal,
  payments,
}: {
  orderId: string;
  orderTotal: number;
  payments: Payment[];
}) {
  const [isPending, startTransition] = useTransition();
  const create = createPayment.bind(null, orderId);

  const paidTotal = payments
    .filter((p) => p.status === "paid")
    .reduce((sum, p) => sum + p.amount, 0);
  const balance = orderTotal - paidTotal;

  return (
    <div className="rounded-3xl bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <h2 className="font-heading font-bold">Payments</h2>
        <p className={`text-sm font-semibold ${balance > 0 ? "text-chili-dark" : "text-basil-dark"}`}>
          {balance > 0 ? `${formatPrice(balance)} due` : "Fully paid"}
        </p>
      </div>

      {payments.length > 0 && (
        <ul className="mt-4 flex flex-col gap-3">
          {payments.map((p) => (
            <PaymentRow key={p.id} payment={p} orderId={orderId} />
          ))}
        </ul>
      )}

      <form
        action={(formData) => startTransition(() => create(formData))}
        className="mt-4 flex flex-wrap items-end gap-2"
      >
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-ink-soft">Amount (Rs.)</label>
          <input
            name="amount"
            type="number"
            step="0.01"
            required
            defaultValue={(balance / 100).toFixed(0)}
            className="w-28 rounded-2xl border border-ink/20 bg-white px-3 py-2 text-sm focus:border-chili focus:outline-none"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-ink-soft">Method</label>
          <select
            name="method"
            className="rounded-2xl border border-ink/20 bg-white px-3 py-2 text-sm capitalize focus:border-chili focus:outline-none"
          >
            {methods.map((m) => (
              <option key={m} value={m}>
                {m.replace("_", " ")}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-ink-soft">Status</label>
          <select
            name="status"
            defaultValue="paid"
            className="rounded-2xl border border-ink/20 bg-white px-3 py-2 text-sm capitalize focus:border-chili focus:outline-none"
          >
            {statuses.map((s) => (
              <option key={s} value={s}>
                {s.replace("_", " ")}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-1 flex-col gap-1">
          <label className="text-xs font-semibold text-ink-soft">Reference</label>
          <input
            name="transactionRef"
            placeholder="Transaction ID, receipt #, etc. (optional)"
            className="w-full rounded-2xl border border-ink/20 bg-white px-3 py-2 text-sm focus:border-chili focus:outline-none"
          />
        </div>
        <button
          type="submit"
          disabled={isPending}
          className="shrink-0 rounded-2xl border-2 border-ink px-4 py-2 text-sm font-heading font-semibold hover:bg-ink hover:text-cream disabled:opacity-60"
        >
          {isPending ? "…" : "Record payment"}
        </button>
      </form>
    </div>
  );
}
