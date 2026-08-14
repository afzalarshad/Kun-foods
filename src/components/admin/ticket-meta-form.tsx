"use client";

import { useTransition } from "react";
import { updateTicketMeta } from "@/app/admin/(dashboard)/tickets/actions";

const statuses = ["open", "pending", "in_progress", "waiting_on_customer", "resolved", "closed"];
const priorities = ["low", "normal", "high", "urgent"];

const statusStyles: Record<string, string> = {
  open: "bg-chili/20 text-chili-dark",
  pending: "bg-saffron/20 text-saffron-dark",
  in_progress: "bg-plum/20 text-plum",
  waiting_on_customer: "bg-plum/20 text-plum",
  resolved: "bg-basil/20 text-basil-dark",
  closed: "bg-cream-dark text-ink-soft",
};

export function TicketMetaForm({
  ticketId,
  status,
  priority,
  assignedTo,
}: {
  ticketId: string;
  status: string;
  priority: string;
  assignedTo: string | null;
}) {
  const [isPending, startTransition] = useTransition();
  const action = updateTicketMeta.bind(null, ticketId);

  return (
    <form
      action={(formData) => startTransition(() => action(formData))}
      className="flex flex-wrap items-center gap-2"
    >
      <select
        name="status"
        defaultValue={status}
        className={`rounded-full border-0 px-3 py-1.5 text-xs font-semibold capitalize focus:outline-none ${statusStyles[status] ?? "bg-cream-dark"}`}
      >
        {statuses.map((s) => (
          <option key={s} value={s}>
            {s.replace("_", " ")}
          </option>
        ))}
      </select>
      <select
        name="priority"
        defaultValue={priority}
        className="rounded-full border border-ink/20 bg-white px-3 py-1.5 text-xs font-semibold capitalize focus:border-chili focus:outline-none"
      >
        {priorities.map((p) => (
          <option key={p} value={p}>
            {p}
          </option>
        ))}
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
