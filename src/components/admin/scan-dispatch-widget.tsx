"use client";

import { useRef, useState, useTransition } from "react";
import { scanUpdateShipmentStatus } from "@/app/admin/(dashboard)/orders/shipment-actions";

const actions = [
  { status: "picked_up" as const, label: "Mark picked up" },
  { status: "in_transit" as const, label: "Mark in transit" },
  { status: "delivered" as const, label: "Mark delivered" },
];

export function ScanDispatchWidget() {
  const [code, setCode] = useState("");
  const [feedback, setFeedback] = useState<{ ok: boolean; text: string } | null>(null);
  const [isPending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  function run(status: (typeof actions)[number]["status"]) {
    if (!code.trim()) return;
    startTransition(async () => {
      const result = await scanUpdateShipmentStatus(code, status);
      if (result.error) {
        setFeedback({ ok: false, text: result.error });
      } else {
        setFeedback({ ok: true, text: `#${result.orderNumber} → ${status.replace("_", " ")}` });
        setCode("");
        inputRef.current?.focus();
      }
    });
  }

  return (
    <div className="rounded-3xl bg-white p-6 shadow-sm print:hidden">
      <h2 className="font-heading font-bold">Scan to update</h2>
      <p className="mt-1 text-sm text-ink-soft">
        Scan the QR code on a shipping label (or paste its value), then pick what happened.
      </p>
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <input
          ref={inputRef}
          value={code}
          onChange={(e) => setCode(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") run("picked_up");
          }}
          placeholder="Scan or paste code…"
          className="min-w-[220px] flex-1 rounded-2xl border border-ink/20 bg-white px-3 py-2 text-sm font-mono focus:border-chili focus:outline-none"
        />
        {actions.map((a) => (
          <button
            key={a.status}
            onClick={() => run(a.status)}
            disabled={isPending || !code.trim()}
            className="rounded-full border border-ink/20 px-3 py-1.5 text-xs font-semibold hover:bg-cream-dark disabled:opacity-50"
          >
            {a.label}
          </button>
        ))}
      </div>
      {feedback && (
        <p className={`mt-3 text-sm font-medium ${feedback.ok ? "text-basil-dark" : "text-chili-dark"}`}>
          {feedback.ok ? "✓ " : "⚠ "}
          {feedback.text}
        </p>
      )}
    </div>
  );
}
