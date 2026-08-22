"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { createMyTicket } from "@/app/(site)/account/actions";

const categories = ["order", "payment", "delivery", "return", "refund", "product", "complaint", "general"];

export function NewTicketForm({ orders }: { orders: { id: string; orderNumber: string }[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function submit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      try {
        const { ticketId } = await createMyTicket(formData);
        router.push(`/account/tickets/${ticketId}`);
      } catch {
        setError("Something went wrong — please try again.");
      }
    });
  }

  return (
    <form action={submit} className="mt-6 flex max-w-xl flex-col gap-5">
      {orders.length > 0 && (
        <div>
          <label className="mb-1.5 block text-sm font-medium">Related order (optional)</label>
          <select
            name="orderId"
            defaultValue=""
            className="w-full rounded-2xl border border-ink/20 bg-white px-4 py-3 focus:border-chili focus:outline-none"
          >
            <option value="">None</option>
            {orders.map((o) => (
              <option key={o.id} value={o.id}>
                #{o.orderNumber}
              </option>
            ))}
          </select>
        </div>
      )}

      <div>
        <label className="mb-1.5 block text-sm font-medium">Subject</label>
        <input
          name="subject"
          required
          minLength={3}
          placeholder="e.g. Order arrived damaged"
          className="w-full rounded-2xl border border-ink/20 bg-white px-4 py-3 focus:border-chili focus:outline-none"
        />
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium">Category</label>
        <select
          name="category"
          defaultValue="general"
          className="w-full rounded-2xl border border-ink/20 bg-white px-4 py-3 capitalize focus:border-chili focus:outline-none"
        >
          {categories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium">How can we help?</label>
        <textarea
          name="message"
          required
          minLength={3}
          rows={4}
          placeholder="Describe the issue…"
          className="w-full rounded-2xl border border-ink/20 bg-white px-4 py-3 focus:border-chili focus:outline-none"
        />
      </div>

      {error && <p className="text-sm font-medium text-chili">{error}</p>}

      <button
        type="submit"
        disabled={pending}
        className="btn-3d self-start rounded-full bg-chili px-6 py-3 font-heading font-semibold text-white hover:bg-chili-dark disabled:opacity-60"
      >
        {pending ? "Submitting…" : "Open ticket"}
      </button>
    </form>
  );
}
