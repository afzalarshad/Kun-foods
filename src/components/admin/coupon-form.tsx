"use client";

import { useState } from "react";
import type { Coupon } from "@prisma/client";

export function CouponForm({
  action,
  coupon,
}: {
  action: (formData: FormData) => void;
  coupon?: Coupon;
}) {
  const [type, setType] = useState<"percentage" | "fixed">(
    (coupon?.type as "percentage" | "fixed") ?? "percentage"
  );

  return (
    <form action={action} className="flex max-w-lg flex-col gap-5">
      <div>
        <label className="mb-1.5 block text-sm font-medium">Coupon code</label>
        <input
          name="code"
          required
          defaultValue={coupon?.code}
          placeholder="e.g. WELCOME10"
          className="w-full rounded-2xl border border-ink/20 bg-white px-4 py-3 uppercase focus:border-chili focus:outline-none"
        />
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium">Discount type</label>
        <select
          name="type"
          value={type}
          onChange={(e) => setType(e.target.value as "percentage" | "fixed")}
          className="w-full rounded-2xl border border-ink/20 bg-white px-4 py-3 focus:border-chili focus:outline-none"
        >
          <option value="percentage">Percentage off</option>
          <option value="fixed">Fixed amount off (Rs.)</option>
        </select>
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium">
          {type === "percentage" ? "Percentage (1-100)" : "Amount (Rs.)"}
        </label>
        <input
          type="number"
          name="value"
          required
          min={1}
          max={type === "percentage" ? 100 : undefined}
          defaultValue={
            coupon ? (coupon.type === "percentage" ? coupon.value : coupon.value / 100) : undefined
          }
          className="w-full rounded-2xl border border-ink/20 bg-white px-4 py-3 focus:border-chili focus:outline-none"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="mb-1.5 block text-sm font-medium">Min. order (Rs., optional)</label>
          <input
            type="number"
            name="minSubtotal"
            min={0}
            defaultValue={coupon?.minSubtotal ? coupon.minSubtotal / 100 : undefined}
            className="w-full rounded-2xl border border-ink/20 bg-white px-4 py-3 focus:border-chili focus:outline-none"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium">Usage limit (optional)</label>
          <input
            type="number"
            name="usageLimit"
            min={1}
            defaultValue={coupon?.usageLimit ?? undefined}
            className="w-full rounded-2xl border border-ink/20 bg-white px-4 py-3 focus:border-chili focus:outline-none"
          />
        </div>
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium">Expires on (optional)</label>
        <input
          type="date"
          name="expiresAt"
          defaultValue={coupon?.expiresAt ? coupon.expiresAt.toISOString().slice(0, 10) : undefined}
          className="w-full rounded-2xl border border-ink/20 bg-white px-4 py-3 focus:border-chili focus:outline-none"
        />
      </div>

      <label className="flex items-center gap-2 text-sm font-medium">
        <input type="checkbox" name="active" defaultChecked={coupon?.active ?? true} />
        Active
      </label>

      <button
        type="submit"
        className="mt-2 w-fit rounded-full bg-chili px-7 py-3 font-heading font-semibold text-white hover:bg-chili-dark"
      >
        {coupon ? "Save changes" : "Create coupon"}
      </button>
    </form>
  );
}
