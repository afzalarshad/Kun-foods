"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { formatPrice } from "@/lib/format";
import { getShippingForCity, type ShippingZonePreview } from "@/lib/shipping-preview";
import { createPosOrder } from "@/app/admin/(dashboard)/pos/actions";

type Sellable = { id: string; name: string; price: number; image: string; stock?: number };

type LineItem = { type: "product" | "bundle"; id: string; name: string; price: number; quantity: number };

export function PosClient({
  products,
  bundles,
  zones,
}: {
  products: Sellable[];
  bundles: Sellable[];
  zones: ShippingZonePreview[];
}) {
  const router = useRouter();
  const [cart, setCart] = useState<LineItem[]>([]);
  const [query, setQuery] = useState("");
  const [couponCode, setCouponCode] = useState("");
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [applyingCoupon, setApplyingCoupon] = useState(false);

  const [customerName, setCustomerName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "cod" | "card">("cash");
  const [status, setStatus] = useState<"pending" | "processing" | "delivered">("delivered");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(query.toLowerCase())
  );

  function addItem(type: "product" | "bundle", item: Sellable) {
    setCart((prev) => {
      const existing = prev.find((i) => i.type === type && i.id === item.id);
      if (existing) {
        return prev.map((i) =>
          i.type === type && i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [...prev, { type, id: item.id, name: item.name, price: item.price, quantity: 1 }];
    });
  }

  function setQty(type: "product" | "bundle", id: string, quantity: number) {
    setCart((prev) =>
      quantity <= 0
        ? prev.filter((i) => !(i.type === type && i.id === id))
        : prev.map((i) => (i.type === type && i.id === id ? { ...i, quantity } : i))
    );
  }

  const subtotal = cart.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const shipping = city.trim() ? getShippingForCity(zones, city, subtotal - couponDiscount) : 0;
  const total = subtotal - couponDiscount + shipping;

  async function handleApplyCoupon() {
    if (!couponCode.trim()) return;
    setApplyingCoupon(true);
    setCouponError(null);
    try {
      const res = await fetch("/api/coupons/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: couponCode, subtotal }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Invalid coupon");
      setCouponDiscount(data.discount);
    } catch (err) {
      setCouponDiscount(0);
      setCouponError(err instanceof Error ? err.message : "Invalid coupon");
    } finally {
      setApplyingCoupon(false);
    }
  }

  async function handleSubmit() {
    if (cart.length === 0) {
      setError("Add at least one item");
      return;
    }
    setSubmitting(true);
    setError(null);

    const result = await createPosOrder({
      customerName,
      email,
      phone,
      address: address || undefined,
      city: city || undefined,
      paymentMethod,
      status,
      couponCode: couponDiscount > 0 ? couponCode : undefined,
      items: cart.map((i) => ({ type: i.type, id: i.id, quantity: i.quantity })),
    });

    if ("error" in result) {
      setError(result.error!);
      setSubmitting(false);
      return;
    }

    router.push(`/admin/orders`);
    router.refresh();
  }

  return (
    <div className="grid gap-8 lg:grid-cols-3">
      <div className="lg:col-span-2">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search products…"
          className="w-full rounded-2xl border border-ink/20 bg-white px-4 py-3 focus:border-chili focus:outline-none"
        />

        <div className="mt-4 grid max-h-80 grid-cols-2 gap-3 overflow-y-auto sm:grid-cols-3">
          {filteredProducts.map((p) => (
            <button
              key={p.id}
              onClick={() => addItem("product", p)}
              disabled={p.stock === 0}
              className="flex flex-col items-center gap-1 rounded-2xl border border-ink/15 bg-white p-3 text-center hover:border-chili disabled:opacity-40"
            >
              <span className="text-2xl">{p.image}</span>
              <span className="text-xs font-medium leading-tight">{p.name}</span>
              <span className="text-xs text-chili">{formatPrice(p.price)}</span>
            </button>
          ))}
        </div>

        {bundles.length > 0 && (
          <>
            <p className="mt-6 mb-2 text-sm font-heading font-semibold">Bundles</p>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {bundles.map((b) => (
                <button
                  key={b.id}
                  onClick={() => addItem("bundle", b)}
                  className="flex flex-col items-center gap-1 rounded-2xl border border-ink/15 bg-white p-3 text-center hover:border-chili"
                >
                  <span className="text-2xl">{b.image}</span>
                  <span className="text-xs font-medium leading-tight">{b.name}</span>
                  <span className="text-xs text-chili">{formatPrice(b.price)}</span>
                </button>
              ))}
            </div>
          </>
        )}

        <div className="mt-8 rounded-3xl bg-white p-6 shadow-sm">
          <h2 className="font-heading font-bold">Customer details</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <input
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="Customer name"
              className="rounded-xl border border-ink/20 px-4 py-2.5 focus:border-chili focus:outline-none"
            />
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Phone number"
              className="rounded-xl border border-ink/20 px-4 py-2.5 focus:border-chili focus:outline-none"
            />
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              type="email"
              className="rounded-xl border border-ink/20 px-4 py-2.5 focus:border-chili focus:outline-none"
            />
            {zones.length > 0 ? (
              <select
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="rounded-xl border border-ink/20 px-4 py-2.5 focus:border-chili focus:outline-none"
              >
                <option value="">Walk-in / Pickup (no shipping)</option>
                {zones.map((z) => (
                  <option key={z.city} value={z.city}>
                    {z.city} delivery
                  </option>
                ))}
              </select>
            ) : (
              <input
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="City for delivery (leave blank for walk-in)"
                className="rounded-xl border border-ink/20 px-4 py-2.5 focus:border-chili focus:outline-none"
              />
            )}
            <input
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Address (optional for walk-in)"
              className="sm:col-span-2 rounded-xl border border-ink/20 px-4 py-2.5 focus:border-chili focus:outline-none"
            />
          </div>
        </div>
      </div>

      <div className="h-fit rounded-3xl bg-cream-dark p-6">
        <h2 className="font-heading text-lg font-bold">Order</h2>
        {cart.length === 0 ? (
          <p className="mt-4 text-sm text-ink-soft">No items yet — tap products to add.</p>
        ) : (
          <ul className="mt-4 flex flex-col gap-3">
            {cart.map((item) => (
              <li key={`${item.type}-${item.id}`} className="flex items-center gap-2">
                <div className="flex-1">
                  <p className="text-sm font-medium leading-snug">{item.name}</p>
                  <p className="text-xs text-ink-soft">{formatPrice(item.price)} each</p>
                </div>
                <div className="flex items-center rounded-full border border-ink/20">
                  <button
                    className="px-2 py-0.5 text-sm"
                    onClick={() => setQty(item.type, item.id, item.quantity - 1)}
                  >
                    −
                  </button>
                  <span className="min-w-5 text-center text-sm">{item.quantity}</span>
                  <button
                    className="px-2 py-0.5 text-sm"
                    onClick={() => setQty(item.type, item.id, item.quantity + 1)}
                  >
                    +
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}

        <div className="mt-4 flex gap-2 border-t border-ink/10 pt-4">
          <input
            value={couponCode}
            onChange={(e) => setCouponCode(e.target.value)}
            placeholder="Coupon"
            className="flex-1 rounded-xl border border-ink/20 bg-white px-3 py-2 text-sm uppercase focus:border-chili focus:outline-none"
          />
          <button
            onClick={handleApplyCoupon}
            disabled={applyingCoupon}
            className="rounded-xl border-2 border-ink px-3 py-2 text-sm font-heading font-semibold hover:bg-ink hover:text-cream"
          >
            Apply
          </button>
        </div>
        {couponError && <p className="mt-1 text-xs text-chili">{couponError}</p>}

        <div className="mt-4 flex justify-between text-sm text-ink-soft">
          <span>Subtotal</span>
          <span>{formatPrice(subtotal)}</span>
        </div>
        {couponDiscount > 0 && (
          <div className="mt-1 flex justify-between text-sm text-basil-dark">
            <span>Discount</span>
            <span>−{formatPrice(couponDiscount)}</span>
          </div>
        )}
        <div className="mt-1 flex justify-between text-sm text-ink-soft">
          <span>Shipping{city ? ` (${city})` : ""}</span>
          <span>{shipping === 0 ? "Free" : formatPrice(shipping)}</span>
        </div>
        <div className="mt-3 flex justify-between border-t border-ink/10 pt-3 font-heading text-lg font-bold">
          <span>Total</span>
          <span>{formatPrice(total)}</span>
        </div>

        <div className="mt-4">
          <label className="mb-1 block text-xs font-medium text-ink-soft">Payment</label>
          <select
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value as typeof paymentMethod)}
            className="w-full rounded-xl border border-ink/20 bg-white px-3 py-2 text-sm"
          >
            <option value="cash">Cash</option>
            <option value="card">Card</option>
            <option value="cod">Cash on delivery</option>
          </select>
        </div>
        <div className="mt-2">
          <label className="mb-1 block text-xs font-medium text-ink-soft">Order status</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as typeof status)}
            className="w-full rounded-xl border border-ink/20 bg-white px-3 py-2 text-sm"
          >
            <option value="delivered">Delivered (walk-in sale)</option>
            <option value="processing">Processing</option>
            <option value="pending">Pending</option>
          </select>
        </div>

        {error && <p className="mt-3 text-sm font-medium text-chili">{error}</p>}

        <button
          onClick={handleSubmit}
          disabled={submitting || cart.length === 0 || !customerName || !email || !phone}
          className="mt-4 w-full rounded-full bg-chili py-3 font-heading font-semibold text-white hover:bg-chili-dark disabled:opacity-50"
        >
          {submitting ? "Creating…" : `Create order — ${formatPrice(total)}`}
        </button>
      </div>
    </div>
  );
}
