"use client";

import { useEffect, useState } from "react";
import { useCart } from "@/store/cart";
import { FIRST_ORDER_COUPON_CODE } from "@/lib/promo-constants";

const DISMISSED_KEY = "kf_first_order_popup_dismissed";

export function FirstOrderPopup({ percent }: { percent: number }) {
  const setCoupon = useCart((state) => state.setCoupon);
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [unlocked, setUnlocked] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (percent <= 0) return;
    let dismissed = false;
    try {
      dismissed = localStorage.getItem(DISMISSED_KEY) === "true";
    } catch {
      // localStorage unavailable (private mode etc.) -- just don't persist the dismissal.
    }
    if (dismissed) return;
    const timer = setTimeout(() => setOpen(true), 1500);
    return () => clearTimeout(timer);
  }, [percent]);

  function dismiss() {
    setOpen(false);
    try {
      localStorage.setItem(DISMISSED_KEY, "true");
    } catch {
      // ignore
    }
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!email.includes("@")) {
      setError("Enter a valid email address.");
      return;
    }
    setCoupon(FIRST_ORDER_COUPON_CODE);
    setUnlocked(true);
    try {
      localStorage.setItem(DISMISSED_KEY, "true");
    } catch {
      // ignore
    }
  }

  if (!open || percent <= 0) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50 p-4" role="dialog" aria-modal="true">
      <div className="relative w-full max-w-sm rounded-3xl bg-cream p-7 text-center shadow-2xl">
        <button
          onClick={dismiss}
          aria-label="Close"
          className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full hover:bg-cream-dark"
        >
          ✕
        </button>

        {unlocked ? (
          <>
            <span className="text-4xl" aria-hidden>
              🎉
            </span>
            <h2 className="mt-3 font-heading text-2xl font-extrabold">{percent}% off unlocked!</h2>
            <p className="mt-2 text-sm text-ink-soft">
              Code <span className="font-semibold text-chili">{FIRST_ORDER_COUPON_CODE}</span> has
              been applied — it&apos;ll show up automatically at checkout.
            </p>
            <button
              onClick={dismiss}
              className="btn-3d mt-6 w-full rounded-full bg-chili py-3 font-heading font-semibold text-white hover:bg-chili-dark"
            >
              Start shopping
            </button>
          </>
        ) : (
          <>
            <span className="text-4xl" aria-hidden>
              🌶️
            </span>
            <h2 className="mt-3 font-heading text-2xl font-extrabold">Get {percent}% off your first order</h2>
            <p className="mt-2 text-sm text-ink-soft">
              Enter your email below to unlock {percent}% off — no strings attached.
            </p>
            <form onSubmit={handleSubmit} className="mt-5 flex flex-col gap-3">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="rounded-2xl border border-ink/20 bg-white px-4 py-3 text-center focus:border-chili focus:outline-none"
              />
              {error && <p className="text-sm font-medium text-chili">{error}</p>}
              <button
                type="submit"
                className="btn-3d w-full rounded-full bg-chili py-3 font-heading font-semibold text-white hover:bg-chili-dark"
              >
                Unlock {percent}% discount
              </button>
            </form>
            <button onClick={dismiss} className="mt-3 text-xs text-ink-soft hover:underline">
              No thanks
            </button>
          </>
        )}
      </div>
    </div>
  );
}
