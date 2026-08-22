"use client";

import { useState, useTransition } from "react";
import { CityCombobox } from "@/components/city-combobox";
import { updateMyProfile } from "@/app/(site)/account/actions";

export function ProfileForm({
  phone,
  address,
  city,
}: {
  phone: string;
  address: string;
  city: string;
}) {
  const [cityValue, setCityValue] = useState(city);
  const [pending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);

  function submit(formData: FormData) {
    setSaved(false);
    formData.set("city", cityValue);
    startTransition(async () => {
      await updateMyProfile(formData);
      setSaved(true);
    });
  }

  return (
    <form action={submit} className="mt-4 flex max-w-md flex-col gap-4">
      <div>
        <label className="mb-1.5 block text-sm font-medium">Mobile number</label>
        <input
          name="phone"
          type="tel"
          required
          defaultValue={phone}
          inputMode="tel"
          pattern="(\+92|0092|92|0)?3\d{9}"
          title="Enter a valid Pakistani mobile number, e.g. 03001234567"
          className="w-full rounded-2xl border border-ink/20 bg-white px-4 py-3 focus:border-chili focus:outline-none"
        />
      </div>
      <div>
        <label className="mb-1.5 block text-sm font-medium">City</label>
        <CityCombobox value={cityValue} onSelect={(c) => setCityValue(c.name)} onClear={() => setCityValue("")} />
      </div>
      <div>
        <label className="mb-1.5 block text-sm font-medium">Address</label>
        <textarea
          name="address"
          defaultValue={address}
          rows={3}
          className="w-full rounded-2xl border border-ink/20 bg-white px-4 py-3 focus:border-chili focus:outline-none"
        />
      </div>

      {saved && <p className="text-sm font-medium text-basil">Saved.</p>}

      <button
        type="submit"
        disabled={pending}
        className="btn-3d self-start rounded-full bg-chili px-6 py-3 font-heading font-semibold text-white hover:bg-chili-dark disabled:opacity-60"
      >
        {pending ? "Saving…" : "Save changes"}
      </button>
    </form>
  );
}
