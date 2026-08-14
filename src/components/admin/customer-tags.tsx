"use client";

import { useTransition } from "react";
import type { CustomerTag } from "@prisma/client";
import { addCustomerTag, removeCustomerTag } from "@/app/admin/(dashboard)/customers/actions";

const SUGGESTED = ["VIP", "Wholesale", "Frequent Buyer", "COD Risk", "High Value", "Complaint"];

export function CustomerTags({ customerId, tags }: { customerId: string; tags: CustomerTag[] }) {
  const [isPending, startTransition] = useTransition();
  const add = addCustomerTag.bind(null, customerId);

  return (
    <div className="rounded-3xl bg-white p-6 shadow-sm">
      <h2 className="font-heading font-bold">Tags</h2>
      <div className="mt-3 flex flex-wrap gap-2">
        {tags.length === 0 && <p className="text-sm text-ink-soft">No tags yet.</p>}
        {tags.map((t) => (
          <span
            key={t.id}
            className="flex items-center gap-1.5 rounded-full bg-plum/10 px-3 py-1 text-xs font-semibold text-plum"
          >
            {t.tag}
            <button
              onClick={() => startTransition(() => removeCustomerTag(customerId, t.id))}
              className="text-plum/70 hover:text-plum"
              aria-label={`Remove tag ${t.tag}`}
            >
              ✕
            </button>
          </span>
        ))}
      </div>
      <form action={(fd) => startTransition(() => add(fd))} className="mt-3 flex gap-2">
        <input
          name="tag"
          list="tag-suggestions"
          placeholder="Add a tag"
          className="flex-1 rounded-full border border-ink/20 bg-white px-3 py-1.5 text-sm focus:border-chili focus:outline-none"
        />
        <datalist id="tag-suggestions">
          {SUGGESTED.map((s) => (
            <option key={s} value={s} />
          ))}
        </datalist>
        <button
          type="submit"
          disabled={isPending}
          className="rounded-full border-2 border-ink px-3 py-1.5 text-xs font-heading font-semibold hover:bg-ink hover:text-cream disabled:opacity-60"
        >
          Add
        </button>
      </form>
    </div>
  );
}
