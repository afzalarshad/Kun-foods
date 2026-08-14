"use client";

import { useTransition } from "react";
import { updateOrderMeta } from "@/app/admin/(dashboard)/orders/returns-actions";

const priorityStyles: Record<string, string> = {
  low: "bg-cream-dark text-ink-soft",
  normal: "bg-cream-dark text-ink",
  high: "bg-saffron/20 text-saffron-dark",
  urgent: "bg-chili/20 text-chili-dark",
};

export function OrderMetaForm({
  orderId,
  priority,
  assignedTo,
}: {
  orderId: string;
  priority: string;
  assignedTo: string | null;
}) {
  const [isPending, startTransition] = useTransition();
  const action = updateOrderMeta.bind(null, orderId);

  return (
    <form
      action={(formData) => startTransition(() => action(formData))}
      className="flex flex-wrap items-center gap-2"
    >
      <select
        name="priority"
        defaultValue={priority}
        className={`rounded-full border-0 px-3 py-1.5 text-xs font-semibold capitalize focus:outline-none ${priorityStyles[priority] ?? "bg-cream-dark"}`}
      >
        <option value="low">Low priority</option>
        <option value="normal">Normal priority</option>
        <option value="high">High priority</option>
        <option value="urgent">Urgent</option>
      </select>
      <input
        name="assignedTo"
        defaultValue={assignedTo ?? ""}
        placeholder="Assign to (staff email)"
        className="w-48 rounded-full border border-ink/20 bg-white px-3 py-1.5 text-xs focus:border-chili focus:outline-none"
      />
      <button
        type="submit"
        disabled={isPending}
        className="rounded-full border border-ink/20 px-3 py-1.5 text-xs font-semibold hover:bg-cream-dark disabled:opacity-60"
      >
        {isPending ? "Saving…" : "Save"}
      </button>
    </form>
  );
}
