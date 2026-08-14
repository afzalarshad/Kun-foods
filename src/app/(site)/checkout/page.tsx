"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useCart } from "@/store/cart";
import { formatPrice, calculateShipping } from "@/lib/format";
import { ProductImage } from "@/components/product/product-image";
import { useHydrated } from "@/lib/use-hydrated";

export default function CheckoutPage() {
  const router = useRouter();
  const { items, subtotal, clear, couponCode, setCoupon } = useCart();
  const hydrated = useHydrated();
  const [paymentMethod, setPaymentMethod] = useState<"cod" | "card">("cod");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [couponInput, setCouponInput] = useState("");
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [applyingCoupon, setApplyingCoupon] = useState(false);

  const shipping = calculateShipping(subtotal() - couponDiscount);
  const total = subtotal() - couponDiscount + shipping;

  async function handleApplyCoupon() {
    if (!couponInput.trim()) return;
    setApplyingCoupon(true);
    setCouponError(null);
    try {
      const res = await fetch("/api/coupons/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: couponInput, subtotal: subtotal() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Invalid coupon code");
      setCoupon(data.code);
      setCouponDiscount(data.discount);
    } catch (err) {
      setCoupon(null);
      setCouponDiscount(0);
      setCouponError(err instanceof Error ? err.message : "Invalid coupon code");
    } finally {
      setApplyingCoupon(false);
    }
  }

  function handleRemoveCoupon() {
    setCoupon(null);
    setCouponDiscount(0);
    setCouponInput("");
    setCouponError(null);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const form = new FormData(e.currentTarget);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName: form.get("customerName"),
          email: form.get("email"),
          phone: form.get("phone"),
          address: form.get("address"),
          city: form.get("city"),
          postalCode: form.get("postalCode") || undefined,
          notes: form.get("notes") || undefined,
          paymentMethod,
          couponCode: couponCode || undefined,
          items: items.map((i) => ({ type: i.type, id: i.id, quantity: i.quantity })),
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Something went wrong. Please try again.");
      }

      const { orderNumber } = await res.json();
      clear();
      router.push(`/order-confirmation/${orderNumber}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setSubmitting(false);
    }
  }

  if (!hydrated) return null;

  if (items.length === 0) {
    return (
      <div className="mx-auto flex max-w-xl flex-col items-center gap-4 px-4 py-24 text-center">
        <span className="text-6xl">🛒</span>
        <h1 className="font-heading text-2xl font-bold">Your cart is empty</h1>
        <Link
          href="/collections/all"
          className="mt-2 rounded-full bg-chili px-7 py-3 font-heading font-semibold text-white hover:bg-chili-dark"
        >
          Start shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:py-14">
      <h1 className="mb-8 font-heading text-3xl font-extrabold sm:text-4xl">Checkout</h1>

      <div className="grid gap-10 lg:grid-cols-3">
        <form onSubmit={handleSubmit} className="flex flex-col gap-6 lg:col-span-2">
          <fieldset className="flex flex-col gap-4">
            <legend className="mb-1 font-heading text-lg font-bold">Contact & delivery</legend>
            <input
              name="customerName"
              required
              placeholder="Full name"
              className="rounded-2xl border border-ink/20 bg-white px-4 py-3 focus:border-chili focus:outline-none"
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <input
                type="email"
                name="email"
                required
                placeholder="Email address"
                className="rounded-2xl border border-ink/20 bg-white px-4 py-3 focus:border-chili focus:outline-none"
              />
              <input
                type="tel"
                name="phone"
                required
                placeholder="Phone number"
                className="rounded-2xl border border-ink/20 bg-white px-4 py-3 focus:border-chili focus:outline-none"
              />
            </div>
            <input
              name="address"
              required
              placeholder="Street address"
              className="rounded-2xl border border-ink/20 bg-white px-4 py-3 focus:border-chili focus:outline-none"
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <input
                name="city"
                required
                placeholder="City"
                className="rounded-2xl border border-ink/20 bg-white px-4 py-3 focus:border-chili focus:outline-none"
              />
              <input
                name="postalCode"
                placeholder="Postal code (optional)"
                className="rounded-2xl border border-ink/20 bg-white px-4 py-3 focus:border-chili focus:outline-none"
              />
            </div>
            <textarea
              name="notes"
              placeholder="Delivery notes (optional)"
              rows={2}
              className="rounded-2xl border border-ink/20 bg-white px-4 py-3 focus:border-chili focus:outline-none"
            />
          </fieldset>

          <fieldset>
            <legend className="mb-3 font-heading text-lg font-bold">Payment method</legend>
            <div className="flex flex-col gap-3">
              <label
                className={`flex cursor-pointer items-center gap-3 rounded-2xl border-2 px-4 py-3 ${
                  paymentMethod === "cod" ? "border-chili bg-chili/5" : "border-ink/15"
                }`}
              >
                <input
                  type="radio"
                  name="payment"
                  checked={paymentMethod === "cod"}
                  onChange={() => setPaymentMethod("cod")}
                />
                <span className="text-xl">💵</span>
                <div>
                  <p className="font-heading font-semibold">Cash on delivery</p>
                  <p className="text-sm text-ink-soft">Pay when your order arrives</p>
                </div>
              </label>
              <label
                className={`flex cursor-pointer items-center gap-3 rounded-2xl border-2 px-4 py-3 ${
                  paymentMethod === "card" ? "border-chili bg-chili/5" : "border-ink/15"
                }`}
              >
                <input
                  type="radio"
                  name="payment"
                  checked={paymentMethod === "card"}
                  onChange={() => setPaymentMethod("card")}
                />
                <span className="text-xl">💳</span>
                <div>
                  <p className="font-heading font-semibold">Card / Online payment</p>
                  <p className="text-sm text-ink-soft">
                    Demo mode — no real charge is made. A payment gateway (e.g. Stripe, JazzCash)
                    can be plugged in here.
                  </p>
                </div>
              </label>
            </div>
          </fieldset>

          {error && (
            <p className="rounded-xl bg-chili/10 px-4 py-3 text-sm font-medium text-chili-dark">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="rounded-full bg-chili py-3.5 font-heading font-semibold text-white hover:bg-chili-dark disabled:opacity-60"
          >
            {submitting ? "Placing order…" : `Place order — ${formatPrice(total)}`}
          </button>
        </form>

        <div className="h-fit rounded-3xl bg-cream-dark p-6">
          <h2 className="font-heading text-lg font-bold">Order summary</h2>
          <ul className="mt-4 flex flex-col gap-3">
            {items.map((item) => (
              <li key={item.id} className="flex items-center gap-3">
                <ProductImage
                  emoji={item.image}
                  seed={item.id}
                  className="h-14 w-14 shrink-0"
                  size="text-2xl"
                />
                <div className="flex-1">
                  <p className="text-sm font-medium leading-snug">{item.name}</p>
                  <p className="text-xs text-ink-soft">Qty {item.quantity}</p>
                </div>
                <span className="text-sm font-semibold">
                  {formatPrice(item.price * item.quantity)}
                </span>
              </li>
            ))}
          </ul>

          <div className="mt-4 border-t border-ink/10 pt-4">
            {couponCode ? (
              <div className="flex items-center justify-between rounded-xl bg-basil/10 px-3 py-2 text-sm">
                <span className="font-medium text-basil-dark">🎟️ {couponCode} applied</span>
                <button
                  type="button"
                  onClick={handleRemoveCoupon}
                  className="text-basil-dark underline"
                >
                  Remove
                </button>
              </div>
            ) : (
              <div className="flex gap-2">
                <input
                  value={couponInput}
                  onChange={(e) => setCouponInput(e.target.value)}
                  placeholder="Coupon code"
                  className="flex-1 rounded-xl border border-ink/20 bg-white px-3 py-2 text-sm uppercase focus:border-chili focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleApplyCoupon}
                  disabled={applyingCoupon}
                  className="rounded-xl border-2 border-ink px-4 py-2 text-sm font-heading font-semibold hover:bg-ink hover:text-cream disabled:opacity-60"
                >
                  {applyingCoupon ? "…" : "Apply"}
                </button>
              </div>
            )}
            {couponError && <p className="mt-1.5 text-xs text-chili">{couponError}</p>}
          </div>

          <div className="mt-4 flex justify-between text-sm text-ink-soft">
            <span>Subtotal</span>
            <span>{formatPrice(subtotal())}</span>
          </div>
          {couponDiscount > 0 && (
            <div className="mt-1 flex justify-between text-sm text-basil-dark">
              <span>Discount</span>
              <span>−{formatPrice(couponDiscount)}</span>
            </div>
          )}
          <div className="mt-1 flex justify-between text-sm text-ink-soft">
            <span>Shipping</span>
            <span>{shipping === 0 ? "Free" : formatPrice(shipping)}</span>
          </div>
          <div className="mt-4 flex justify-between border-t border-ink/10 pt-4 font-heading text-lg font-bold">
            <span>Total</span>
            <span>{formatPrice(total)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
