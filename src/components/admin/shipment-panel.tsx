"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import type { Shipment } from "@prisma/client";
import { formatPrice } from "@/lib/format";
import { saveShipment, updateShipmentStatus, generateLabel } from "@/app/admin/(dashboard)/orders/shipment-actions";

const couriers: { value: string; label: string }[] = [
  { value: "leopards", label: "Leopards Courier" },
  { value: "tcs", label: "TCS" },
  { value: "postex", label: "PostEx" },
  { value: "manual", label: "Manual / own rider" },
];

const statuses = ["pending", "booked", "picked_up", "in_transit", "delivered", "returned"];

const statusStyles: Record<string, string> = {
  pending: "bg-cream-dark text-ink-soft",
  booked: "bg-saffron/20 text-saffron-dark",
  picked_up: "bg-plum/20 text-plum",
  in_transit: "bg-plum/20 text-plum",
  delivered: "bg-basil/20 text-basil-dark",
  returned: "bg-chili/20 text-chili-dark",
};

export function ShipmentPanel({
  orderId,
  shipment,
  suggestedCod,
}: {
  orderId: string;
  shipment: Shipment | null;
  suggestedCod: number;
}) {
  const [isPending, startTransition] = useTransition();
  const [isGenerating, startGenerating] = useTransition();
  const [labelError, setLabelError] = useState<string | null>(null);
  const save = saveShipment.bind(null, orderId);
  const updateStatus = updateShipmentStatus.bind(null, orderId);

  return (
    <div className="rounded-3xl bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <h2 className="font-heading font-bold">Shipment</h2>
        {shipment && (
          <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${statusStyles[shipment.status] ?? "bg-cream-dark"}`}>
            {shipment.status.replace("_", " ")}
          </span>
        )}
      </div>

      <form
        action={(formData) => startTransition(() => save(formData))}
        className="mt-4 flex flex-wrap items-end gap-3"
      >
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-ink-soft">Courier</label>
          <select
            name="courier"
            defaultValue={shipment?.courier ?? "leopards"}
            className="min-w-[180px] rounded-2xl border border-ink/20 bg-white px-3 py-2 text-sm focus:border-chili focus:outline-none"
          >
            {couriers.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-ink-soft">Tracking / booking #</label>
          <input
            name="trackingNumber"
            defaultValue={shipment?.trackingNumber ?? ""}
            placeholder="e.g. LCS123456789"
            className="w-44 rounded-2xl border border-ink/20 bg-white px-3 py-2 text-sm focus:border-chili focus:outline-none"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-ink-soft">Weight (g)</label>
          <input
            name="weightGrams"
            type="number"
            defaultValue={shipment?.weightGrams ?? ""}
            placeholder="500"
            className="w-24 rounded-2xl border border-ink/20 bg-white px-3 py-2 text-sm focus:border-chili focus:outline-none"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-ink-soft">COD amount (Rs.)</label>
          <input
            name="codAmount"
            type="number"
            step="0.01"
            defaultValue={shipment?.codAmount !== undefined && shipment?.codAmount !== null ? shipment.codAmount / 100 : (suggestedCod / 100).toFixed(0)}
            className="w-28 rounded-2xl border border-ink/20 bg-white px-3 py-2 text-sm focus:border-chili focus:outline-none"
          />
        </div>
        <button
          type="submit"
          disabled={isPending}
          className="shrink-0 rounded-2xl bg-ink px-4 py-2 text-sm font-heading font-semibold text-cream hover:bg-ink/90 disabled:opacity-60"
        >
          {isPending ? "Saving…" : shipment ? "Update booking" : "Book courier"}
        </button>
      </form>

      {shipment && (
        <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-ink/10 pt-4">
          <form
            action={(formData) => startTransition(() => updateStatus(formData))}
            className="flex items-center gap-2"
          >
            <select
              name="status"
              defaultValue={shipment.status}
              className="rounded-full border border-ink/20 bg-white px-3 py-1.5 text-xs capitalize focus:border-chili focus:outline-none"
            >
              {statuses.map((s) => (
                <option key={s} value={s}>
                  {s.replace("_", " ")}
                </option>
              ))}
            </select>
            <button
              type="submit"
              disabled={isPending}
              className="rounded-full border border-ink/20 px-3 py-1.5 text-xs font-semibold hover:bg-cream-dark disabled:opacity-60"
            >
              Update status
            </button>
          </form>

          <div className="ml-auto flex items-center gap-2">
            {shipment.codAmount !== null && (
              <span className="text-xs text-ink-soft">COD: {formatPrice(shipment.codAmount)}</span>
            )}
            <button
              onClick={() =>
                startGenerating(async () => {
                  setLabelError(null);
                  const result = await generateLabel(orderId);
                  if (result.error) setLabelError(result.error);
                })
              }
              disabled={isGenerating}
              className="rounded-full border-2 border-ink px-3 py-1.5 text-xs font-heading font-semibold hover:bg-ink hover:text-cream disabled:opacity-60"
            >
              {isGenerating ? "…" : shipment.labelGeneratedAt ? "Regenerate label" : "Generate label"}
            </button>
            {shipment.labelGeneratedAt && (
              <Link
                href={`/admin/orders/${orderId}/label`}
                target="_blank"
                className="rounded-full bg-chili px-3 py-1.5 text-xs font-heading font-semibold text-white hover:bg-chili-dark"
              >
                View / print label
              </Link>
            )}
          </div>
        </div>
      )}
      {labelError && <p className="mt-2 text-sm font-medium text-chili">{labelError}</p>}
    </div>
  );
}
