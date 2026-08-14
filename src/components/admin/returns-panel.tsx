"use client";

import { useTransition } from "react";
import type { Return } from "@prisma/client";
import { createReturn, updateReturnStatus } from "@/app/admin/(dashboard)/orders/returns-actions";

const statusStyles: Record<string, string> = {
  requested: "bg-saffron/20 text-saffron-dark",
  approved: "bg-plum/20 text-plum",
  rejected: "bg-chili/20 text-chili-dark",
  received: "bg-basil/20 text-basil-dark",
  refunded: "bg-basil text-white",
};

const statuses = ["requested", "approved", "rejected", "received", "refunded"];

function ReturnRow({ ret, orderId }: { ret: Return; orderId: string }) {
  const [isPending, startTransition] = useTransition();
  const action = updateReturnStatus.bind(null, ret.id, orderId);

  return (
    <li className="rounded-2xl border border-ink/10 p-4">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm">{ret.reason}</p>
        <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${statusStyles[ret.status] ?? "bg-cream-dark"}`}>
          {ret.status}
        </span>
      </div>
      <p className="mt-1 text-xs text-ink-soft">
        {new Date(ret.createdAt).toLocaleDateString("en-PK", { day: "numeric", month: "short", year: "numeric" })}
      </p>
      <form
        action={(formData) => startTransition(() => action(formData))}
        className="mt-3 flex items-center gap-2"
      >
        <select
          name="status"
          defaultValue={ret.status}
          className="rounded-full border border-ink/20 bg-white px-3 py-1 text-xs capitalize focus:border-chili focus:outline-none"
        >
          {statuses.map((s) => (
            <option key={s} value={s}>{s}</option>
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

export function ReturnsPanel({ orderId, returns }: { orderId: string; returns: Return[] }) {
  const [isPending, startTransition] = useTransition();
  const create = createReturn.bind(null, orderId);

  return (
    <div className="rounded-3xl bg-white p-6 shadow-sm">
      <h2 className="font-heading font-bold">Returns &amp; refunds</h2>

      {returns.length > 0 && (
        <ul className="mt-4 flex flex-col gap-3">
          {returns.map((r) => (
            <ReturnRow key={r.id} ret={r} orderId={orderId} />
          ))}
        </ul>
      )}

      <form
        action={(formData) => startTransition(() => create(formData))}
        className="mt-4 flex gap-2"
      >
        <input
          name="reason"
          required
          placeholder="Reason for return (e.g. damaged item)"
          className="flex-1 rounded-2xl border border-ink/20 bg-white px-4 py-2.5 text-sm focus:border-chili focus:outline-none"
        />
        <button
          type="submit"
          disabled={isPending}
          className="shrink-0 rounded-2xl border-2 border-ink px-4 py-2.5 text-sm font-heading font-semibold hover:bg-ink hover:text-cream disabled:opacity-60"
        >
          {isPending ? "…" : "Log return"}
        </button>
      </form>
    </div>
  );
}
