"use client";

import { useRef, useState, useTransition } from "react";
import { adjustStock } from "@/app/admin/(dashboard)/inventory/actions";

type ProductOption = { id: string; name: string; sku: string | null; stock: number };

export function AdjustStockForm({ products }: { products: ProductOption[] }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <form
      ref={formRef}
      action={(formData) =>
        startTransition(async () => {
          setError(null);
          const result = await adjustStock(formData);
          if (result.error) {
            setError(result.error);
          } else {
            formRef.current?.reset();
          }
        })
      }
      className="flex flex-wrap items-end gap-3"
    >
      <div className="flex flex-col gap-1">
        <label className="text-xs font-semibold text-ink-soft">Product</label>
        <select
          name="productId"
          required
          className="min-w-[220px] rounded-2xl border border-ink/20 bg-white px-4 py-2.5 text-sm focus:border-chili focus:outline-none"
        >
          {products.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name} {p.sku ? `(${p.sku})` : ""} — stock {p.stock}
            </option>
          ))}
        </select>
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-xs font-semibold text-ink-soft">Quantity (+ / -)</label>
        <input
          name="quantity"
          type="number"
          required
          placeholder="-5 or 20"
          className="w-32 rounded-2xl border border-ink/20 bg-white px-4 py-2.5 text-sm focus:border-chili focus:outline-none"
        />
      </div>
      <div className="flex flex-1 flex-col gap-1">
        <label className="text-xs font-semibold text-ink-soft">Reason</label>
        <input
          name="reason"
          required
          placeholder="e.g. Damaged in warehouse, physical recount, new stock received"
          className="w-full rounded-2xl border border-ink/20 bg-white px-4 py-2.5 text-sm focus:border-chili focus:outline-none"
        />
      </div>
      <button
        type="submit"
        disabled={isPending}
        className="shrink-0 rounded-2xl bg-chili px-5 py-2.5 text-sm font-heading font-semibold text-white hover:bg-chili-dark disabled:opacity-60"
      >
        {isPending ? "Saving…" : "Adjust stock"}
      </button>
      {error && <p className="w-full text-sm font-medium text-chili">{error}</p>}
    </form>
  );
}
