"use client";

import { useState, useTransition } from "react";
import type { CustomerAddress } from "@prisma/client";
import { addCustomerAddress, deleteCustomerAddress } from "@/app/admin/(dashboard)/customers/actions";

export function CustomerAddresses({
  customerId,
  addresses,
}: {
  customerId: string;
  addresses: CustomerAddress[];
}) {
  const [isPending, startTransition] = useTransition();
  const [showForm, setShowForm] = useState(false);
  const add = addCustomerAddress.bind(null, customerId);

  return (
    <div className="rounded-3xl bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <h2 className="font-heading font-bold">Saved addresses</h2>
        <button onClick={() => setShowForm((s) => !s)} className="text-sm font-semibold text-chili hover:underline">
          {showForm ? "Cancel" : "+ Add"}
        </button>
      </div>

      {addresses.length === 0 && !showForm && <p className="mt-3 text-sm text-ink-soft">No saved addresses yet.</p>}

      {addresses.length > 0 && (
        <ul className="mt-3 flex flex-col gap-3">
          {addresses.map((a) => (
            <li key={a.id} className="flex items-start justify-between gap-3 rounded-2xl bg-cream-dark p-3 text-sm">
              <div>
                <p className="font-semibold">
                  {a.label} {a.isDefault && <span className="ml-1 text-xs text-basil-dark">(default)</span>}
                </p>
                <p className="text-ink-soft">
                  {a.address}, {a.city}
                  {a.postalCode ? `, ${a.postalCode}` : ""}
                </p>
              </div>
              <button
                onClick={() => startTransition(() => deleteCustomerAddress(customerId, a.id))}
                className="shrink-0 text-ink-soft hover:text-chili"
                aria-label="Delete address"
              >
                ✕
              </button>
            </li>
          ))}
        </ul>
      )}

      {showForm && (
        <form
          action={(fd) => {
            startTransition(() => add(fd));
            setShowForm(false);
          }}
          className="mt-4 flex flex-col gap-2"
        >
          <div className="grid grid-cols-2 gap-2">
            <input
              name="label"
              required
              placeholder="Label (e.g. Home)"
              className="rounded-xl border border-ink/20 px-3 py-2 text-sm focus:border-chili focus:outline-none"
            />
            <input
              name="city"
              required
              placeholder="City"
              className="rounded-xl border border-ink/20 px-3 py-2 text-sm focus:border-chili focus:outline-none"
            />
          </div>
          <input
            name="address"
            required
            placeholder="Street address"
            className="rounded-xl border border-ink/20 px-3 py-2 text-sm focus:border-chili focus:outline-none"
          />
          <div className="flex items-center gap-3">
            <input
              name="postalCode"
              placeholder="Postal code (optional)"
              className="flex-1 rounded-xl border border-ink/20 px-3 py-2 text-sm focus:border-chili focus:outline-none"
            />
            <label className="flex shrink-0 items-center gap-1.5 text-xs">
              <input type="checkbox" name="isDefault" /> Default
            </label>
          </div>
          <button
            type="submit"
            disabled={isPending}
            className="w-fit rounded-full bg-chili px-4 py-1.5 text-xs font-heading font-semibold text-white hover:bg-chili-dark disabled:opacity-60"
          >
            Save address
          </button>
        </form>
      )}
    </div>
  );
}
