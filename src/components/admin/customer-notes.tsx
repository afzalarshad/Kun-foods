"use client";

import { useTransition } from "react";
import type { CustomerNote } from "@prisma/client";
import { addCustomerNote } from "@/app/admin/(dashboard)/customers/actions";

export function CustomerNotes({ customerId, notes }: { customerId: string; notes: CustomerNote[] }) {
  const [isPending, startTransition] = useTransition();
  const add = addCustomerNote.bind(null, customerId);

  return (
    <div className="rounded-3xl bg-white p-6 shadow-sm">
      <h2 className="font-heading font-bold">Internal notes</h2>
      <p className="text-xs text-ink-soft">Never shown to the customer.</p>

      {notes.length > 0 && (
        <ul className="mt-3 flex flex-col gap-3">
          {notes.map((n) => (
            <li key={n.id} className="rounded-2xl bg-cream-dark p-3 text-sm">
              <p>{n.note}</p>
              <p className="mt-1 text-xs text-ink-soft">
                {n.authorEmail ?? "unknown"} ·{" "}
                {new Date(n.createdAt).toLocaleDateString("en-PK", { day: "numeric", month: "short", year: "numeric" })}
              </p>
            </li>
          ))}
        </ul>
      )}

      <form action={(fd) => startTransition(() => add(fd))} className="mt-3 flex gap-2">
        <input
          name="note"
          required
          placeholder="Add a note about this customer"
          className="flex-1 rounded-full border border-ink/20 bg-white px-3 py-1.5 text-sm focus:border-chili focus:outline-none"
        />
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
