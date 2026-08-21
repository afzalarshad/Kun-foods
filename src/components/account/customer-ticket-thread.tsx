"use client";

import { useRef, useTransition } from "react";
import type { TicketMessage } from "@prisma/client";
import { replyToMyTicket } from "@/app/(site)/account/actions";

function authorLabel(m: TicketMessage) {
  return m.authorType === "customer" ? "You" : "Kun Foods Support";
}

export function CustomerTicketThread({ ticketId, messages }: { ticketId: string; messages: TicketMessage[] }) {
  const [isPending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);
  const action = replyToMyTicket.bind(null, ticketId);

  return (
    <div className="rounded-3xl bg-white p-6 shadow-sm">
      <h3 className="font-heading font-bold">Conversation</h3>

      <div className="mt-4 flex flex-col gap-3">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`rounded-2xl p-4 text-sm ${m.authorType === "customer" ? "bg-chili/10" : "bg-cream-dark"}`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wide text-ink-soft">{authorLabel(m)}</span>
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
          placeholder="Write a reply…"
          className="w-full rounded-2xl border border-ink/20 bg-white px-4 py-3 text-sm focus:border-chili focus:outline-none"
        />
        <button
          type="submit"
          disabled={isPending}
          className="btn-3d self-start rounded-full bg-chili px-5 py-2 text-sm font-heading font-semibold text-white hover:bg-chili-dark disabled:opacity-60"
        >
          {isPending ? "Sending…" : "Send reply"}
        </button>
      </form>
    </div>
  );
}
