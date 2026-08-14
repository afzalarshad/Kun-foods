"use client";

import { useState } from "react";
import type { Bundle, BundleItem, Product } from "@prisma/client";

const EMOJI_OPTIONS = ["🎁", "🧺", "🎉", "💰", "🛍️", "⭐", "🔥", "✨"];

export function BundleForm({
  action,
  products,
  bundle,
  bundleItems,
}: {
  action: (formData: FormData) => void;
  products: Product[];
  bundle?: Bundle;
  bundleItems?: BundleItem[];
}) {
  const [selectedEmoji, setSelectedEmoji] = useState(bundle?.image ?? EMOJI_OPTIONS[0]);
  const includedIds = new Set(bundleItems?.map((i) => i.productId));
  const qtyMap = new Map(bundleItems?.map((i) => [i.productId, i.quantity]));

  return (
    <form action={action} className="flex max-w-2xl flex-col gap-5">
      <div>
        <label className="mb-1.5 block text-sm font-medium">Bundle name</label>
        <input
          name="name"
          required
          defaultValue={bundle?.name}
          placeholder="e.g. Spice Starter Pack"
          className="w-full rounded-2xl border border-ink/20 bg-white px-4 py-3 focus:border-chili focus:outline-none"
        />
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium">Description</label>
        <textarea
          name="description"
          required
          rows={3}
          defaultValue={bundle?.description}
          className="w-full rounded-2xl border border-ink/20 bg-white px-4 py-3 focus:border-chili focus:outline-none"
        />
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium">Bundle price (Rs.)</label>
        <input
          type="number"
          name="price"
          required
          min={1}
          step="0.01"
          defaultValue={bundle ? bundle.price / 100 : undefined}
          className="w-full max-w-xs rounded-2xl border border-ink/20 bg-white px-4 py-3 focus:border-chili focus:outline-none"
        />
        <p className="mt-1 text-xs text-ink-soft">
          Set this lower than the sum of the individual product prices so it reads as a deal.
        </p>
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium">Icon</label>
        <input type="hidden" name="image" value={selectedEmoji} />
        <div className="flex flex-wrap gap-2">
          {EMOJI_OPTIONS.map((emoji) => (
            <button
              type="button"
              key={emoji}
              onClick={() => setSelectedEmoji(emoji)}
              className={`flex h-11 w-11 items-center justify-center rounded-xl border-2 text-xl ${
                selectedEmoji === emoji ? "border-chili bg-chili/10" : "border-ink/15"
              }`}
            >
              {emoji}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium">Products in this bundle</label>
        <div className="flex flex-col divide-y divide-ink/10 rounded-2xl border border-ink/15">
          {products.map((p) => (
            <label key={p.id} className="flex items-center gap-3 px-4 py-3">
              <input
                type="checkbox"
                name={`include_${p.id}`}
                defaultChecked={includedIds.has(p.id)}
              />
              <span className="flex-1 text-sm">{p.name}</span>
              <span className="text-xs text-ink-soft">Qty</span>
              <input
                type="number"
                name={`qty_${p.id}`}
                min={1}
                defaultValue={qtyMap.get(p.id) ?? 1}
                className="w-16 rounded-lg border border-ink/20 px-2 py-1 text-sm"
              />
            </label>
          ))}
        </div>
      </div>

      <label className="flex items-center gap-2 text-sm font-medium">
        <input type="checkbox" name="active" defaultChecked={bundle?.active ?? true} />
        Active (visible on storefront)
      </label>

      <button
        type="submit"
        className="mt-2 w-fit rounded-full bg-chili px-7 py-3 font-heading font-semibold text-white hover:bg-chili-dark"
      >
        {bundle ? "Save changes" : "Create bundle"}
      </button>
    </form>
  );
}
