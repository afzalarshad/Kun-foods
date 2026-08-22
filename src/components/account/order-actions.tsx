"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { cancelMyOrder, requestMyReturn } from "@/app/(site)/account/actions";

const CANCELLABLE = new Set(["pending", "processing"]);

export function OrderActions({ orderId, status, hasReturn }: { orderId: string; status: string; hasReturn: boolean }) {
  const router = useRouter();
  const [mode, setMode] = useState<"none" | "cancel" | "return">("none");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const canCancel = CANCELLABLE.has(status);
  const canReturn = status === "delivered" && !hasReturn;

  if (!canCancel && !canReturn) return null;

  function submit(action: "cancel" | "return", formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = action === "cancel" ? await cancelMyOrder(orderId, formData) : await requestMyReturn(orderId, formData);
      if (result?.error) {
        setError(result.error);
        return;
      }
      setMode("none");
      router.refresh();
    });
  }

  return (
    <div className="rounded-3xl bg-white p-6 shadow-sm">
      {mode === "none" && (
        <div className="flex flex-wrap gap-3">
          {canCancel && (
            <button
              onClick={() => setMode("cancel")}
              className="btn-3d btn-3d-ink rounded-full border-2 border-ink/15 bg-white px-5 py-2.5 font-heading text-sm font-semibold"
            >
              Cancel order
            </button>
          )}
          {canReturn && (
            <button
              onClick={() => setMode("return")}
              className="btn-3d btn-3d-ink rounded-full border-2 border-ink/15 bg-white px-5 py-2.5 font-heading text-sm font-semibold"
            >
              Request a return
            </button>
          )}
        </div>
      )}

      {mode !== "none" && (
        <form
          action={(formData) => submit(mode, formData)}
          className="flex flex-col gap-3"
        >
          <label className="text-sm font-semibold">
            {mode === "cancel" ? "Reason for cancelling (optional)" : "Why are you returning this order?"}
          </label>
          <textarea
            name="reason"
            required={mode === "return"}
            rows={3}
            className="rounded-2xl border border-ink/20 bg-white px-4 py-3 text-sm focus:border-chili focus:outline-none"
            placeholder={mode === "cancel" ? "Optional…" : "e.g. Item arrived damaged"}
          />
          {error && <p className="text-sm font-medium text-chili">{error}</p>}
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={pending}
              className="btn-3d rounded-full bg-chili px-5 py-2.5 font-heading text-sm font-semibold text-white hover:bg-chili-dark disabled:opacity-60"
            >
              {pending ? "Submitting…" : mode === "cancel" ? "Confirm cancellation" : "Submit return request"}
            </button>
            <button
              type="button"
              onClick={() => {
                setMode("none");
                setError(null);
              }}
              className="rounded-full px-5 py-2.5 text-sm font-semibold text-ink-soft hover:bg-cream-dark"
            >
              Never mind
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
