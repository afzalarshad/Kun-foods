"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useCart } from "@/store/cart";
import { formatPrice } from "@/lib/format";
import { getShippingForCity, type ShippingZonePreview } from "@/lib/shipping-preview";
import { PAKISTAN_PROVINCES, isKnownPakistanCity, type PakistanCity, type PakistanProvince } from "@/lib/pakistan-locations";
import { PERSON_NAME_HTML_PATTERN } from "@/lib/name";
import { CityCombobox } from "@/components/city-combobox";
import { ProductImage } from "@/components/product/product-image";
import { useHydrated } from "@/lib/use-hydrated";

type AppliedPromotion = { id: string; name: string; discount: number };

export function CheckoutForm({ zones }: { zones: ShippingZonePreview[] }) {
  const router = useRouter();
  const { items, subtotal, clear, couponCode, setCoupon } = useCart();
  const hydrated = useHydrated();
  const [paymentMethod, setPaymentMethod] = useState<"cod" | "card">("cod");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [province, setProvince] = useState<PakistanProvince | "">("");
  const [city, setCity] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [email, setEmail] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [houseAddress, setHouseAddress] = useState("");
  const [areaAddress, setAreaAddress] = useState("");

  // Billing address is only asked for on card payments (COD has no billing use for it) and is
  // "same as shipping" by default -- there's no real payment gateway wired in yet to consume it
  // (see the Payments section in README), so it isn't sent to the order API; it's captured here
  // ready for whichever gateway (Stripe, JazzCash, etc.) eventually gets plugged into handleSubmit.
  const [billingSameAsShipping, setBillingSameAsShipping] = useState(true);
  const [billingName, setBillingName] = useState("");
  const [billingAddress, setBillingAddress] = useState("");
  const [billingCity, setBillingCity] = useState("");

  function handleProvinceChange(newProvince: PakistanProvince | "") {
    setProvince(newProvince);
    // Picking a province narrows the city search — clear a city that no longer matches so the
    // two fields never disagree.
    setCity("");
    setPostalCode("");
  }

  function handleCitySelect(selected: PakistanCity) {
    setCity(selected.name);
    setProvince(selected.province);
    // Pre-fill the official postal code for the selected city — the customer can still edit it
    // if their exact address has a more specific one.
    setPostalCode(selected.postalCode);
  }

  const [couponInput, setCouponInput] = useState("");
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [applyingCoupon, setApplyingCoupon] = useState(false);

  const [appliedPromotions, setAppliedPromotions] = useState<AppliedPromotion[]>([]);
  const promoDiscount = appliedPromotions.reduce((sum, p) => sum + p.discount, 0);

  const shippingPreview = getShippingForCity(zones, city, subtotal() - couponDiscount - promoDiscount);
  const shipping = shippingPreview.rate;
  const cityExcluded = city.trim().length > 0 && shippingPreview.excluded;
  const total = subtotal() - couponDiscount - promoDiscount + shipping;

  // Promotions apply automatically (no code) — recompute whenever the cart or email changes.
  useEffect(() => {
    const handle = setTimeout(() => {
      if (!hydrated || items.length === 0) {
        setAppliedPromotions([]);
        return;
      }
      fetch("/api/promotions/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items.map((i) => ({ type: i.type, id: i.id, quantity: i.quantity })),
          email: email.includes("@") ? email : undefined,
        }),
      })
        .then((res) => res.json())
        .then((data) => setAppliedPromotions(data.applied ?? []))
        .catch(() => setAppliedPromotions([]));
    }, 350);
    return () => clearTimeout(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated, JSON.stringify(items.map((i) => [i.id, i.quantity])), email]);

  async function applyCouponCode(code: string, options?: { silent?: boolean }) {
    setApplyingCoupon(true);
    if (!options?.silent) setCouponError(null);
    try {
      const res = await fetch("/api/coupons/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, subtotal: subtotal(), email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Invalid coupon code");
      setCoupon(data.code);
      setCouponDiscount(data.discount);
    } catch (err) {
      // A silent (auto) revalidation leaves the code in place on failure -- it likely just needs
      // the email field filled in (first-order coupons require it) and will succeed once that
      // happens, rather than yanking away a discount the customer already unlocked.
      if (!options?.silent) {
        setCoupon(null);
        setCouponDiscount(0);
        setCouponError(err instanceof Error ? err.message : "Invalid coupon code");
      }
    } finally {
      setApplyingCoupon(false);
    }
  }

  function handleApplyCoupon() {
    if (!couponInput.trim()) return;
    applyCouponCode(couponInput);
  }

  // A coupon code can already be sitting in the persisted cart store (e.g. unlocked via the
  // first-order discount popup on an earlier page) -- revalidate it whenever the cart hydrates
  // or the email changes, so the discount shows up in the total as soon as it can (first-order
  // coupons need the email to check eligibility) instead of only applying at submit time.
  useEffect(() => {
    if (!hydrated || !couponCode || couponDiscount > 0) return;
    const handle = setTimeout(() => applyCouponCode(couponCode, { silent: true }), 350);
    return () => clearTimeout(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated, couponCode, email]);

  function handleRemoveCoupon() {
    setCoupon(null);
    setCouponDiscount(0);
    setCouponInput("");
    setCouponError(null);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    if (!isKnownPakistanCity(city)) {
      setError("Please select a valid city from the list.");
      return;
    }
    setSubmitting(true);

    const form = new FormData(e.currentTarget);
    const landmark = String(form.get("landmark") ?? "").trim();
    const address = [houseAddress, areaAddress, landmark ? `Near ${landmark}` : ""]
      .filter(Boolean)
      .join(", ");
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName,
          email,
          phone: form.get("phone"),
          address,
          city,
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
          className="btn-3d mt-2 rounded-full bg-chili px-7 py-3 font-heading font-semibold text-white hover:bg-chili-dark"
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
          <fieldset className="flex flex-col gap-4 rounded-3xl bg-white p-6 shadow-sm">
            <legend className="mb-1 flex items-center gap-2 px-1 font-heading text-lg font-bold">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-ink text-xs text-cream">1</span>
              Contact
            </legend>
            <input
              type="email"
              name="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email address"
              className="rounded-2xl border border-ink/20 bg-white px-4 py-3 focus:border-chili focus:outline-none"
            />
          </fieldset>

          <fieldset className="flex flex-col gap-4 rounded-3xl bg-white p-6 shadow-sm">
            <legend className="mb-1 flex items-center gap-2 px-1 font-heading text-lg font-bold">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-ink text-xs text-cream">2</span>
              Delivery
            </legend>
            <input
              name="customerName"
              required
              pattern={PERSON_NAME_HTML_PATTERN}
              title="Letters and spaces only — no numbers or symbols"
              placeholder="Full name"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              className="rounded-2xl border border-ink/20 bg-white px-4 py-3 focus:border-chili focus:outline-none"
            />
            <input
              type="tel"
              name="phone"
              required
              inputMode="tel"
              pattern="(\+92|0092|92|0)?3\d{9}"
              title="Enter a valid Pakistani mobile number, e.g. 03001234567"
              placeholder="Mobile number (03XXXXXXXXX)"
              className="rounded-2xl border border-ink/20 bg-white px-4 py-3 focus:border-chili focus:outline-none"
            />
            <input
              name="houseAddress"
              required
              placeholder="House / Flat #, Street"
              value={houseAddress}
              onChange={(e) => setHouseAddress(e.target.value)}
              className="rounded-2xl border border-ink/20 bg-white px-4 py-3 focus:border-chili focus:outline-none"
            />
            <input
              name="areaAddress"
              required
              placeholder="Area, Sector / Block, Society"
              value={areaAddress}
              onChange={(e) => setAreaAddress(e.target.value)}
              className="rounded-2xl border border-ink/20 bg-white px-4 py-3 focus:border-chili focus:outline-none"
            />
            <input
              name="landmark"
              placeholder="Nearby landmark (optional) — helps the rider find you"
              className="rounded-2xl border border-ink/20 bg-white px-4 py-3 focus:border-chili focus:outline-none"
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <select
                value={province}
                onChange={(e) => handleProvinceChange(e.target.value as PakistanProvince | "")}
                className="rounded-2xl border border-ink/20 bg-white px-4 py-3 focus:border-chili focus:outline-none"
              >
                <option value="">All provinces</option>
                {PAKISTAN_PROVINCES.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
              <CityCombobox
                value={city}
                onSelect={handleCitySelect}
                province={province || undefined}
                invalid={cityExcluded}
                placeholder="Type to search your city…"
              />
              <input
                name="postalCode"
                value={postalCode}
                onChange={(e) => setPostalCode(e.target.value)}
                placeholder="Postal code"
                className="rounded-2xl border border-ink/20 bg-white px-4 py-3 focus:border-chili focus:outline-none sm:col-span-2"
              />
            </div>
            {cityExcluded && (
              <p className="-mt-2 text-sm font-medium text-chili-dark">
                Sorry, we don&apos;t currently deliver to {city}. Please choose a different city.
              </p>
            )}
            <textarea
              name="notes"
              placeholder="Delivery notes (optional)"
              rows={2}
              className="rounded-2xl border border-ink/20 bg-white px-4 py-3 focus:border-chili focus:outline-none"
            />
          </fieldset>

          <fieldset className="rounded-3xl bg-white p-6 shadow-sm">
            <legend className="mb-3 flex items-center gap-2 px-1 font-heading text-lg font-bold">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-ink text-xs text-cream">3</span>
              Payment method
            </legend>
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

          {paymentMethod === "card" && (
            <fieldset className="flex flex-col gap-4 rounded-3xl bg-white p-6 shadow-sm">
              <legend className="mb-1 flex items-center gap-2 px-1 font-heading text-lg font-bold">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-ink text-xs text-cream">4</span>
                Billing address
              </legend>
              <label className="flex items-center gap-2 text-sm font-medium">
                <input
                  type="checkbox"
                  checked={billingSameAsShipping}
                  onChange={(e) => setBillingSameAsShipping(e.target.checked)}
                />
                Same as shipping address
              </label>

              {billingSameAsShipping ? (
                <p className="rounded-2xl bg-cream-dark px-4 py-3 text-sm text-ink-soft">
                  {customerName || "Your name"}
                  {houseAddress || areaAddress ? `, ${[houseAddress, areaAddress].filter(Boolean).join(", ")}` : ""}
                  {city ? `, ${city}` : ""}
                </p>
              ) : (
                <>
                  <input
                    placeholder="Full name on card"
                    value={billingName}
                    onChange={(e) => setBillingName(e.target.value)}
                    className="rounded-2xl border border-ink/20 bg-white px-4 py-3 focus:border-chili focus:outline-none"
                  />
                  <input
                    placeholder="Billing address"
                    value={billingAddress}
                    onChange={(e) => setBillingAddress(e.target.value)}
                    className="rounded-2xl border border-ink/20 bg-white px-4 py-3 focus:border-chili focus:outline-none"
                  />
                  <input
                    placeholder="City"
                    value={billingCity}
                    onChange={(e) => setBillingCity(e.target.value)}
                    className="rounded-2xl border border-ink/20 bg-white px-4 py-3 focus:border-chili focus:outline-none"
                  />
                </>
              )}
            </fieldset>
          )}

          {error && (
            <p className="rounded-xl bg-chili/10 px-4 py-3 text-sm font-medium text-chili-dark">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting || cityExcluded}
            className="btn-3d rounded-full bg-chili py-3.5 font-heading font-semibold text-white hover:bg-chili-dark disabled:opacity-60"
          >
            {submitting ? "Placing order…" : cityExcluded ? "Not deliverable to this city" : `Place order — ${formatPrice(total)}`}
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

          {appliedPromotions.length > 0 && (
            <div className="mt-3 flex flex-col gap-1 rounded-xl bg-saffron/10 px-3 py-2">
              {appliedPromotions.map((p) => (
                <div key={p.id} className="flex items-center justify-between text-xs">
                  <span className="font-medium text-saffron-dark">🎉 {p.name}</span>
                  <span className="text-saffron-dark">−{formatPrice(p.discount)}</span>
                </div>
              ))}
            </div>
          )}

          <div className="mt-4 flex justify-between text-sm text-ink-soft">
            <span>Subtotal</span>
            <span>{formatPrice(subtotal())}</span>
          </div>
          {couponDiscount > 0 && (
            <div className="mt-1 flex justify-between text-sm text-basil-dark">
              <span>Coupon discount</span>
              <span>−{formatPrice(couponDiscount)}</span>
            </div>
          )}
          {promoDiscount > 0 && (
            <div className="mt-1 flex justify-between text-sm text-saffron-dark">
              <span>Promotions</span>
              <span>−{formatPrice(promoDiscount)}</span>
            </div>
          )}
          <div className="mt-1 flex justify-between text-sm text-ink-soft">
            <span>Shipping{city ? ` (${city})` : ""}</span>
            <span className={cityExcluded ? "font-medium text-chili-dark" : ""}>
              {cityExcluded ? "Not deliverable" : shipping === 0 ? "Free" : formatPrice(shipping)}
            </span>
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
