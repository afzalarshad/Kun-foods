"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { scanPickItem, adjustPickedQuantity, markOrderPacked } from "@/app/admin/(dashboard)/warehouse/actions";

type Item = {
  id: string;
  name: string;
  sku: string | null;
  barcode: string | null;
  quantity: number;
  pickedQuantity: number;
};

export function WarehousePickScanner({ orderId, items }: { orderId: string; items: Item[] }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [isScanning, startScan] = useTransition();
  const [isPacking, startPack] = useTransition();
  const [isAdjusting, startAdjust] = useTransition();
  const [feedback, setFeedback] = useState<{ ok: boolean; text: string } | null>(null);
  const [packError, setPackError] = useState<string | null>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const allPicked = items.every((i) => i.pickedQuantity >= i.quantity);

  function handleScan(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const code = new FormData(form).get("code");
    if (!code) return;
    startScan(async () => {
      const result = await scanPickItem(orderId, new FormData(form));
      form.reset();
      inputRef.current?.focus();
      if (result.error) {
        setFeedback({ ok: false, text: `✗ ${result.error}` });
      } else {
        setFeedback({ ok: true, text: `✓ ${result.matchedItemName} — ${result.pickedQuantity}/${result.quantity}` });
      }
      router.refresh();
    });
  }

  function handleAdjust(itemId: string, delta: "1" | "-1") {
    const fd = new FormData();
    fd.set("delta", delta);
    startAdjust(async () => {
      await adjustPickedQuantity(orderId, itemId, fd);
      router.refresh();
    });
  }

  function handleMarkPacked() {
    setPackError(null);
    startPack(async () => {
      const result = await markOrderPacked(orderId);
      if (result.error) {
        setPackError(result.error);
      } else {
        router.push("/admin/warehouse");
      }
    });
  }

  return (
    <div className="rounded-3xl bg-white p-6 shadow-sm">
      <form onSubmit={handleScan} className="flex gap-2">
        <input
          ref={inputRef}
          name="code"
          autoComplete="off"
          placeholder="Scan or type barcode / SKU, then press Enter…"
          disabled={isScanning}
          className="flex-1 rounded-2xl border-2 border-ink/20 bg-white px-4 py-3 text-base focus:border-chili focus:outline-none"
        />
        <button
          type="submit"
          disabled={isScanning}
          className="shrink-0 rounded-2xl bg-ink px-5 py-3 text-sm font-heading font-semibold text-cream hover:bg-ink/90 disabled:opacity-60"
        >
          Scan
        </button>
      </form>

      {feedback && (
        <p className={`mt-3 text-sm font-semibold ${feedback.ok ? "text-basil-dark" : "text-chili-dark"}`}>{feedback.text}</p>
      )}

      <ul className="mt-5 flex flex-col gap-2 border-t border-ink/10 pt-4">
        {items.map((item) => {
          const done = item.pickedQuantity >= item.quantity;
          return (
            <li
              key={item.id}
              className={`flex items-center justify-between rounded-2xl px-4 py-3 ${done ? "bg-basil/10" : "bg-cream-dark/60"}`}
            >
              <div>
                <p className="text-sm font-medium">
                  {done && "✓ "}
                  {item.name}
                </p>
                <p className="text-xs text-ink-soft">
                  {item.barcode ?? item.sku ?? "no barcode/SKU on file — use the buttons"}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleAdjust(item.id, "-1")}
                  disabled={isAdjusting || item.pickedQuantity === 0}
                  className="h-7 w-7 rounded-full border border-ink/20 text-sm font-bold hover:bg-white disabled:opacity-40"
                >
                  −
                </button>
                <span className="w-12 text-center text-sm font-semibold">
                  {item.pickedQuantity}/{item.quantity}
                </span>
                <button
                  type="button"
                  onClick={() => handleAdjust(item.id, "1")}
                  disabled={isAdjusting || item.pickedQuantity >= item.quantity}
                  className="h-7 w-7 rounded-full border border-ink/20 text-sm font-bold hover:bg-white disabled:opacity-40"
                >
                  +
                </button>
              </div>
            </li>
          );
        })}
      </ul>

      <button
        onClick={handleMarkPacked}
        disabled={!allPicked || isPacking}
        className="mt-5 w-full rounded-2xl bg-chili px-5 py-3 text-sm font-heading font-semibold text-white hover:bg-chili-dark disabled:cursor-not-allowed disabled:opacity-40"
      >
        {isPacking ? "Marking packed…" : allPicked ? "✓ Mark packed & ready to ship" : "Scan all items to continue"}
      </button>
      {packError && <p className="mt-2 text-sm font-medium text-chili">{packError}</p>}
    </div>
  );
}
