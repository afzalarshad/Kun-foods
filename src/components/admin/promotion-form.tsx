"use client";

import { useState } from "react";
import type { Promotion } from "@prisma/client";
import { SEGMENTS } from "@/lib/segments";

type PromoType = "percentage_off" | "fixed_off" | "bogo";
type PromoScope = "all" | "category" | "product";

export function PromotionForm({
  action,
  promotion,
  categories,
  products,
}: {
  action: (formData: FormData) => void;
  promotion?: Promotion;
  categories: { id: string; name: string }[];
  products: { id: string; name: string }[];
}) {
  const [type, setType] = useState<PromoType>((promotion?.type as PromoType) ?? "percentage_off");
  const [scope, setScope] = useState<PromoScope>((promotion?.scope as PromoScope) ?? "all");

  const effectiveScope: PromoScope = type === "bogo" ? "product" : scope;

  return (
    <form action={action} className="flex max-w-lg flex-col gap-5">
      <div>
        <label className="mb-1.5 block text-sm font-medium">Promotion name</label>
        <input
          name="name"
          required
          defaultValue={promotion?.name}
          placeholder="e.g. Spice Week Sale"
          className="w-full rounded-2xl border border-ink/20 bg-white px-4 py-3 focus:border-chili focus:outline-none"
        />
        <p className="mt-1 text-xs text-ink-soft">Shown to customers as the reason for their discount.</p>
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium">Type</label>
        <select
          name="type"
          value={type}
          onChange={(e) => setType(e.target.value as PromoType)}
          className="w-full rounded-2xl border border-ink/20 bg-white px-4 py-3 focus:border-chili focus:outline-none"
        >
          <option value="percentage_off">Percentage off</option>
          <option value="fixed_off">Fixed amount off (Rs.)</option>
          <option value="bogo">Buy X, get Y (BOGO)</option>
        </select>
      </div>

      {type !== "bogo" && (
        <div>
          <label className="mb-1.5 block text-sm font-medium">Applies to</label>
          <select
            name="scope"
            value={scope}
            onChange={(e) => setScope(e.target.value as PromoScope)}
            className="w-full rounded-2xl border border-ink/20 bg-white px-4 py-3 focus:border-chili focus:outline-none"
          >
            <option value="all">Entire order</option>
            <option value="category">One category</option>
            <option value="product">One product</option>
          </select>
        </div>
      )}

      {effectiveScope === "category" && (
        <div>
          <label className="mb-1.5 block text-sm font-medium">Category</label>
          <select
            name="categoryId"
            required
            defaultValue={promotion?.categoryId ?? ""}
            className="w-full rounded-2xl border border-ink/20 bg-white px-4 py-3 focus:border-chili focus:outline-none"
          >
            <option value="" disabled>
              Select a category…
            </option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {effectiveScope === "product" && (
        <div>
          <label className="mb-1.5 block text-sm font-medium">Product</label>
          <select
            name="productId"
            required
            defaultValue={promotion?.productId ?? ""}
            className="w-full rounded-2xl border border-ink/20 bg-white px-4 py-3 focus:border-chili focus:outline-none"
          >
            <option value="" disabled>
              Select a product…
            </option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {type !== "bogo" && (
        <div>
          <label className="mb-1.5 block text-sm font-medium">
            {type === "percentage_off" ? "Percentage (1-100)" : "Amount (Rs.)"}
          </label>
          <input
            type="number"
            name="value"
            required
            min={1}
            max={type === "percentage_off" ? 100 : undefined}
            step={type === "percentage_off" ? 1 : "0.01"}
            defaultValue={
              promotion
                ? promotion.type === "percentage_off"
                  ? (promotion.value ?? undefined)
                  : promotion.value
                    ? promotion.value / 100
                    : undefined
                : undefined
            }
            className="w-full rounded-2xl border border-ink/20 bg-white px-4 py-3 focus:border-chili focus:outline-none"
          />
        </div>
      )}

      {type === "bogo" && (
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="mb-1.5 block text-sm font-medium">Buy</label>
            <input
              type="number"
              name="buyQuantity"
              required
              min={1}
              defaultValue={promotion?.buyQuantity ?? 1}
              className="w-full rounded-2xl border border-ink/20 bg-white px-4 py-3 focus:border-chili focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium">Get</label>
            <input
              type="number"
              name="getQuantity"
              required
              min={1}
              defaultValue={promotion?.getQuantity ?? 1}
              className="w-full rounded-2xl border border-ink/20 bg-white px-4 py-3 focus:border-chili focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium">Off %</label>
            <input
              type="number"
              name="getDiscountPercent"
              required
              min={1}
              max={100}
              defaultValue={promotion?.getDiscountPercent ?? 100}
              className="w-full rounded-2xl border border-ink/20 bg-white px-4 py-3 focus:border-chili focus:outline-none"
            />
          </div>
          <p className="col-span-3 -mt-1 text-xs text-ink-soft">
            e.g. Buy 2, Get 1 at 100% off = classic &quot;buy 2 get 1 free&quot;. The customer must already have
            enough of the product in their cart to trigger it.
          </p>
        </div>
      )}

      <div>
        <label className="mb-1.5 block text-sm font-medium">Customer segment (optional)</label>
        <select
          name="segment"
          defaultValue={promotion?.segment ?? ""}
          className="w-full rounded-2xl border border-ink/20 bg-white px-4 py-3 focus:border-chili focus:outline-none"
        >
          <option value="">Everyone</option>
          {SEGMENTS.map((s) => (
            <option key={s.id} value={s.id}>
              {s.label}
            </option>
          ))}
        </select>
        <p className="mt-1 text-xs text-ink-soft">
          Restrict this promotion to customers who currently match a segment (e.g. only VIPs, or only
          inactive-90-day customers to win them back).
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="mb-1.5 block text-sm font-medium">Starts on (optional)</label>
          <input
            type="date"
            name="startsAt"
            defaultValue={promotion?.startsAt ? promotion.startsAt.toISOString().slice(0, 10) : undefined}
            className="w-full rounded-2xl border border-ink/20 bg-white px-4 py-3 focus:border-chili focus:outline-none"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium">Ends on (optional)</label>
          <input
            type="date"
            name="endsAt"
            defaultValue={promotion?.endsAt ? promotion.endsAt.toISOString().slice(0, 10) : undefined}
            className="w-full rounded-2xl border border-ink/20 bg-white px-4 py-3 focus:border-chili focus:outline-none"
          />
        </div>
      </div>

      <label className="flex items-center gap-2 text-sm font-medium">
        <input type="checkbox" name="active" defaultChecked={promotion?.active ?? true} />
        Active
      </label>

      <button
        type="submit"
        className="mt-2 w-fit rounded-full bg-chili px-7 py-3 font-heading font-semibold text-white hover:bg-chili-dark"
      >
        {promotion ? "Save changes" : "Create promotion"}
      </button>
    </form>
  );
}
