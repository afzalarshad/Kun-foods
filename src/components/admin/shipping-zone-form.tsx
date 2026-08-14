"use client";

import type { ShippingZone } from "@prisma/client";

export function ShippingZoneForm({
  action,
  zone,
}: {
  action: (formData: FormData) => void;
  zone?: ShippingZone;
}) {
  return (
    <form action={action} className="flex max-w-lg flex-col gap-5">
      <div>
        <label className="mb-1.5 block text-sm font-medium">City</label>
        <input
          name="city"
          required
          defaultValue={zone?.city}
          placeholder="e.g. Karachi"
          className="w-full rounded-2xl border border-ink/20 bg-white px-4 py-3 focus:border-chili focus:outline-none"
        />
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium">Shipping rate (Rs.)</label>
        <input
          type="number"
          name="rate"
          required
          min={0}
          step="0.01"
          defaultValue={zone ? zone.rate / 100 : undefined}
          className="w-full rounded-2xl border border-ink/20 bg-white px-4 py-3 focus:border-chili focus:outline-none"
        />
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium">Free shipping above (Rs., optional)</label>
        <input
          type="number"
          name="freeAbove"
          min={0}
          step="0.01"
          defaultValue={zone?.freeAbove ? zone.freeAbove / 100 : undefined}
          placeholder="Leave blank to never auto-waive shipping"
          className="w-full rounded-2xl border border-ink/20 bg-white px-4 py-3 focus:border-chili focus:outline-none"
        />
      </div>

      <label className="flex items-center gap-2 text-sm font-medium">
        <input type="checkbox" name="active" defaultChecked={zone?.active ?? true} />
        Active (deliverable at checkout)
      </label>

      <button
        type="submit"
        className="mt-2 w-fit rounded-full bg-chili px-7 py-3 font-heading font-semibold text-white hover:bg-chili-dark"
      >
        {zone ? "Save changes" : "Add city"}
      </button>
    </form>
  );
}
