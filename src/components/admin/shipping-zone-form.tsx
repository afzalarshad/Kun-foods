"use client";

import { useState } from "react";
import type { ShippingZone } from "@prisma/client";
import { PAKISTAN_PROVINCES, findPakistanCity, type PakistanCity } from "@/lib/pakistan-locations";
import { CityCombobox } from "@/components/city-combobox";

type Scope = "city" | "province";

export function ShippingZoneForm({
  action,
  zone,
}: {
  action: (formData: FormData) => void;
  zone?: ShippingZone;
}) {
  const [scope, setScope] = useState<Scope>((zone?.scope as Scope) ?? "city");
  const [city, setCity] = useState(zone?.city ?? "");
  const cityInfo = findPakistanCity(city);

  return (
    <form action={action} className="flex max-w-lg flex-col gap-5">
      <div>
        <label className="mb-1.5 block text-sm font-medium">Applies to</label>
        <select
          name="scope"
          value={scope}
          onChange={(e) => setScope(e.target.value as Scope)}
          className="w-full rounded-2xl border border-ink/20 bg-white px-4 py-3 focus:border-chili focus:outline-none"
        >
          <option value="city">One city</option>
          <option value="province">An entire province</option>
        </select>
        <p className="mt-1 text-xs text-ink-soft">
          A city-specific rate always wins over a province-wide one for that city — handy for
          excluding one town from an otherwise-served province, or vice versa.
        </p>
      </div>

      {scope === "city" ? (
        <div>
          <label className="mb-1.5 block text-sm font-medium">City</label>
          <input type="hidden" name="city" value={city} />
          <CityCombobox
            value={city}
            onSelect={(selected: PakistanCity) => setCity(selected.name)}
            onClear={() => setCity("")}
            placeholder="Type to search a city…"
          />
          {cityInfo && (
            <p className="mt-1 text-xs text-ink-soft">
              {cityInfo.province} · GPO postal code {cityInfo.postalCode}
            </p>
          )}
        </div>
      ) : (
        <div>
          <label className="mb-1.5 block text-sm font-medium">Province</label>
          <select
            name="province"
            required
            defaultValue={zone?.province ?? ""}
            className="w-full rounded-2xl border border-ink/20 bg-white px-4 py-3 focus:border-chili focus:outline-none"
          >
            <option value="" disabled>
              Select a province…
            </option>
            {PAKISTAN_PROVINCES.map((province) => (
              <option key={province} value={province}>
                {province}
              </option>
            ))}
          </select>
        </div>
      )}

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
        <input type="checkbox" name="excluded" defaultChecked={zone?.excluded ?? false} />
        Exclude — we don&apos;t deliver here (blocks checkout instead of charging a rate)
      </label>

      <label className="flex items-center gap-2 text-sm font-medium">
        <input type="checkbox" name="active" defaultChecked={zone?.active ?? true} />
        Active
      </label>

      <button
        type="submit"
        className="mt-2 w-fit rounded-full bg-chili px-7 py-3 font-heading font-semibold text-white hover:bg-chili-dark"
      >
        {zone ? "Save changes" : "Add rate"}
      </button>
    </form>
  );
}
