"use client";

import { useRef, useTransition } from "react";
import type { TicketMessage } from "@prisma/client";
import { addTicketMessage } from "@/app/admin/(dashboard)/tickets/actions";

function authorLabel(m: TicketMessage) {
  if (m.authorType === "system") return "System";
  if (m.authorType === "customer") return "Customer";
  return m.authorEmail ?? "Staff";
}

export function TicketThread({ ticketId, messages }: { ticketId: string; messages: TicketMessage[] }) {
  const [isPending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);
  const action = addTicketMessage.bind(null, ticketId);

  return (
    <div className="rounded-3xl bg-white p-6 shadow-sm">
      <h2 className="font-heading font-bold">Conversation</h2>

      <div className="mt-4 flex flex-col gap-3">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`rounded-2xl p-4 text-sm ${
              m.authorType === "system"
                ? "bg-cream-dark/60 text-ink-soft italic"
                : m.internal
                  ? "border-2 border-dashed border-saffron bg-saffron/10"
                  : m.authorType === "customer"
                    ? "bg-cream-dark"
                    : "bg-plum/10"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wide text-ink-soft">
                {authorLabel(m)}
                {m.internal && " · internal note"}
              </span>
              <span className="text-xs text-ink-soft">
                {new Date(m.createdAt).toLocaleString("en-PK", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
              </span>
            </div>
            <p className="mt-1.5 whitespace-pre-wrap">{m.message}</p>
          </div>
        ))}
        {messages.length === 0 && <p className="text-sm text-ink-soft">No messages yet.</p>}
      </div>

      <form
        ref={formRef}
        action={(formData) =>
          startTransition(async () => {
            await action(formData);
            formRef.current?.reset();
          })
        }
        className="mt-5 flex flex-col gap-3 border-t border-ink/10 pt-4"
      >
        <textarea
          name="message"
          required
          rows={3}
          placeholder="Reply to the customer, or check 'internal note' for a staff-only comment…"
          className="w-full rounded-2xl border border-ink/20 bg-white px-4 py-3 text-sm focus:border-chili focus:outline-none"
        />
        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 text-sm text-ink-soft">
            <input type="checkbox" name="internal" className="h-4 w-4 rounded border-ink/30" />
            Internal note (not visible to customer)
          </label>
          <button
            type="submit"
            disabled={isPending}
            className="rounded-full bg-chili px-5 py-2 text-sm font-heading font-semibold text-white hover:bg-chili-dark disabled:opacity-60"
          >
            {isPending ? "Sending…" : "Send"}
          </button>
        </div>
      </form>
    </div>
  );
}
