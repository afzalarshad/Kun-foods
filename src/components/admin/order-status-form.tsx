"use client";

import { useTransition } from "react";
import { updateOrderStatus } from "@/app/admin/(dashboard)/actions";

const statuses = ["pending", "processing", "shipped", "delivered", "cancelled"];

export function OrderStatusForm({
  orderId,
  currentStatus,
}: {
  orderId: string;
  currentStatus: string;
}) {
  const [isPending, startTransition] = useTransition();
  const updateWithId = updateOrderStatus.bind(null, orderId);

  return (
    <form
      action={(formData) => startTransition(() => updateWithId(formData))}
      className="flex flex-wrap items-center gap-2"
    >
      <select
        name="status"
        defaultValue={currentStatus}
        className="rounded-full border border-ink/20 bg-white px-4 py-2 text-sm font-medium capitalize focus:border-chili focus:outline-none"
      >
        {statuses.map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
      </select>
      <input
        name="note"
        placeholder="Note (optional)"
        className="w-40 rounded-full border border-ink/20 bg-white px-4 py-2 text-sm focus:border-chili focus:outline-none"
      />
      <button
        type="submit"
        disabled={isPending}
        className="rounded-full bg-ink px-4 py-2 text-sm font-heading font-semibold text-cream hover:bg-ink/90 disabled:opacity-60"
      >
        {isPending ? "Saving…" : "Update"}
      </button>
    </form>
  );
}
