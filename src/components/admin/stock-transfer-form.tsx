"use client";

import { useRef, useState, useTransition } from "react";
import { createStockTransfer } from "@/app/admin/(dashboard)/warehouses/actions";

type ProductOption = { id: string; name: string; sku: string | null };
type WarehouseOption = { id: string; name: string };

export function StockTransferForm({
  products,
  warehouses,
}: {
  products: ProductOption[];
  warehouses: WarehouseOption[];
}) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <form
      ref={formRef}
      action={(formData) =>
        startTransition(async () => {
          setError(null);
          const result = await createStockTransfer(formData);
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
          className="min-w-[200px] rounded-2xl border border-ink/20 bg-white px-4 py-2.5 text-sm focus:border-chili focus:outline-none"
        >
          {products.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name} {p.sku ? `(${p.sku})` : ""}
            </option>
          ))}
        </select>
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-xs font-semibold text-ink-soft">From</label>
        <select
          name="fromWarehouseId"
          required
          className="min-w-[160px] rounded-2xl border border-ink/20 bg-white px-4 py-2.5 text-sm focus:border-chili focus:outline-none"
        >
          {warehouses.map((w) => (
            <option key={w.id} value={w.id}>
              {w.name}
            </option>
          ))}
        </select>
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-xs font-semibold text-ink-soft">To</label>
        <select
          name="toWarehouseId"
          required
          defaultValue={warehouses[1]?.id}
          className="min-w-[160px] rounded-2xl border border-ink/20 bg-white px-4 py-2.5 text-sm focus:border-chili focus:outline-none"
        >
          {warehouses.map((w) => (
            <option key={w.id} value={w.id}>
              {w.name}
            </option>
          ))}
        </select>
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-xs font-semibold text-ink-soft">Quantity</label>
        <input
          name="quantity"
          type="number"
          min={1}
          required
          className="w-24 rounded-2xl border border-ink/20 bg-white px-4 py-2.5 text-sm focus:border-chili focus:outline-none"
        />
      </div>
      <div className="flex flex-1 flex-col gap-1">
        <label className="text-xs font-semibold text-ink-soft">Reason (optional)</label>
        <input
          name="reason"
          placeholder="e.g. Rebalancing ahead of Lahore demand"
          className="w-full rounded-2xl border border-ink/20 bg-white px-4 py-2.5 text-sm focus:border-chili focus:outline-none"
        />
      </div>
      <button
        type="submit"
        disabled={isPending}
        className="shrink-0 rounded-2xl bg-chili px-5 py-2.5 text-sm font-heading font-semibold text-white hover:bg-chili-dark disabled:opacity-60"
      >
        {isPending ? "Moving…" : "Transfer stock"}
      </button>
      {error && <p className="w-full text-sm font-medium text-chili">{error}</p>}
    </form>
  );
}
