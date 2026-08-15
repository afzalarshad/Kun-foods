"use client";

import type { Warehouse } from "@prisma/client";

export function WarehouseForm({
  action,
  warehouse,
}: {
  action: (formData: FormData) => void;
  warehouse?: Warehouse;
}) {
  return (
    <form action={action} className="flex max-w-lg flex-col gap-5">
      <div>
        <label className="mb-1.5 block text-sm font-medium">Name</label>
        <input
          name="name"
          required
          placeholder="e.g. Lahore Branch Warehouse"
          defaultValue={warehouse?.name ?? ""}
          className="w-full rounded-2xl border border-ink/20 bg-white px-4 py-3 focus:border-chili focus:outline-none"
        />
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium">Short code</label>
        <input
          name="code"
          required
          placeholder="e.g. LHR"
          defaultValue={warehouse?.code ?? ""}
          className="w-full rounded-2xl border border-ink/20 bg-white px-4 py-3 uppercase focus:border-chili focus:outline-none"
        />
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium">City</label>
        <input
          name="city"
          required
          placeholder="e.g. Lahore"
          defaultValue={warehouse?.city ?? ""}
          className="w-full rounded-2xl border border-ink/20 bg-white px-4 py-3 focus:border-chili focus:outline-none"
        />
        <p className="mt-1 text-xs text-ink-soft">
          Orders delivering to this city are preferred to this warehouse when it has full stock for them.
        </p>
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium">Address (optional)</label>
        <input
          name="address"
          defaultValue={warehouse?.address ?? ""}
          className="w-full rounded-2xl border border-ink/20 bg-white px-4 py-3 focus:border-chili focus:outline-none"
        />
      </div>

      <label className="flex items-center gap-2 text-sm font-medium">
        <input type="checkbox" name="isDefault" defaultChecked={warehouse?.isDefault ?? false} />
        Default warehouse — fallback fulfillment location when no city match wins
      </label>

      <label className="flex items-center gap-2 text-sm font-medium">
        <input type="checkbox" name="active" defaultChecked={warehouse?.active ?? true} />
        Active
      </label>

      <button
        type="submit"
        className="mt-2 w-fit rounded-full bg-chili px-7 py-3 font-heading font-semibold text-white hover:bg-chili-dark"
      >
        {warehouse ? "Save changes" : "Add warehouse"}
      </button>
    </form>
  );
}
