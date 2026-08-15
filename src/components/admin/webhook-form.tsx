"use client";

import type { Webhook } from "@prisma/client";
import { WEBHOOK_EVENTS } from "@/lib/webhooks";

const EVENT_LABELS: Record<(typeof WEBHOOK_EVENTS)[number], string> = {
  "order.created": "Order created",
  "order.status_changed": "Order status changed",
  "ticket.created": "Support ticket created",
};

export function WebhookForm({
  action,
  webhook,
}: {
  action: (formData: FormData) => void;
  webhook?: Webhook;
}) {
  const selectedEvents: string[] = webhook ? JSON.parse(webhook.events) : [];

  return (
    <form action={action} className="flex max-w-lg flex-col gap-5">
      <div>
        <label className="mb-1.5 block text-sm font-medium">Name</label>
        <input
          name="name"
          required
          defaultValue={webhook?.name}
          placeholder="e.g. Order sync to warehouse system"
          className="w-full rounded-2xl border border-ink/20 bg-white px-4 py-3 focus:border-chili focus:outline-none"
        />
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium">Endpoint URL</label>
        <input
          name="url"
          type="url"
          required
          defaultValue={webhook?.url}
          placeholder="https://example.com/webhooks/kun-foods"
          className="w-full rounded-2xl border border-ink/20 bg-white px-4 py-3 focus:border-chili focus:outline-none"
        />
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium">Events</label>
        <div className="flex flex-col gap-2 rounded-2xl border border-ink/20 bg-white p-4">
          {WEBHOOK_EVENTS.map((event) => (
            <label key={event} className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                name="events"
                value={event}
                defaultChecked={selectedEvents.includes(event)}
                className="h-4 w-4 rounded border-ink/30"
              />
              {EVENT_LABELS[event]}
            </label>
          ))}
        </div>
      </div>

      <label className="flex items-center gap-2 text-sm font-medium">
        <input type="checkbox" name="active" defaultChecked={webhook?.active ?? true} />
        Active
      </label>

      <button
        type="submit"
        className="mt-2 w-fit rounded-full bg-chili px-7 py-3 font-heading font-semibold text-white hover:bg-chili-dark"
      >
        {webhook ? "Save changes" : "Create webhook"}
      </button>
    </form>
  );
}
