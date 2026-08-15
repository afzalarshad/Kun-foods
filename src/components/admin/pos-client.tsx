"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { formatPrice } from "@/lib/format";
import { getShippingForCity, type ShippingZonePreview } from "@/lib/shipping-preview";
import { createPosOrder } from "@/app/admin/(dashboard)/pos/actions";
import { holdSale, resumeSale, discardHeldSale } from "@/app/admin/(dashboard)/pos/held-sales-actions";

type Sellable = { id: string; name: string; price: number; image: string; stock?: number; sku?: string | null; barcode?: string | null };

type LineItem = { type: "product" | "bundle"; id: string; name: string; price: number; quantity: number };

type PaymentMethod = "cash" | "card" | "cod" | "bank_transfer" | "other";
type SinglePaymentMethod = "cash" | "card" | "cod";
type PaymentLine = { method: PaymentMethod; amount: string };

type HeldSaleRow = { id: string; label: string | null; cart: string; customer: string; createdAt: string };

type SavedCustomer = {
  customerName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  status: "pending" | "processing" | "delivered";
};

export function PosClient({
  products,
  bundles,
  zones,
  heldSales,
}: {
  products: Sellable[];
  bundles: Sellable[];
  zones: ShippingZonePreview[];
  heldSales: HeldSaleRow[];
}) {
  const router = useRouter();
  const [cart, setCart] = useState<LineItem[]>([]);
  const [query, setQuery] = useState("");
  const [scanCode, setScanCode] = useState("");
  const [scanFeedback, setScanFeedback] = useState<{ ok: boolean; text: string } | null>(null);
  const scanInputRef = useRef<HTMLInputElement>(null);

  const [couponCode, setCouponCode] = useState("");
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [applyingCoupon, setApplyingCoupon] = useState(false);

  const [customerName, setCustomerName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<SinglePaymentMethod>("cash");
  const [status, setStatus] = useState<"pending" | "processing" | "delivered">("delivered");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [splitMode, setSplitMode] = useState(false);
  const [paymentLines, setPaymentLines] = useState<PaymentLine[]>([{ method: "cash", amount: "" }]);

  const [holding, setHolding] = useState(false);
  const [heldOpen, setHeldOpen] = useState(false);

  const [appliedPromotions, setAppliedPromotions] = useState<{ id: string; name: string; discount: number }[]>([]);
  const promoDiscount = appliedPromotions.reduce((sum, p) => sum + p.discount, 0);

  useEffect(() => {
    scanInputRef.current?.focus();
  }, []);

  // Promotions apply automatically (no code) — recompute whenever the cart or email changes.
  useEffect(() => {
    const handle = setTimeout(() => {
      if (cart.length === 0) {
        setAppliedPromotions([]);
        return;
      }
      fetch("/api/promotions/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: cart.map((i) => ({ type: i.type, id: i.id, quantity: i.quantity })),
          email: email.includes("@") ? email : undefined,
        }),
      })
        .then((res) => res.json())
        .then((data) => setAppliedPromotions(data.applied ?? []))
        .catch(() => setAppliedPromotions([]));
    }, 350);
    return () => clearTimeout(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(cart.map((i) => [i.id, i.quantity])), email]);

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

  function handleScan(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const code = scanCode.trim();
    setScanCode("");
    if (!code) return;
    const match = products.find((p) => p.barcode === code || p.sku === code);
    if (!match) {
      setScanFeedback({ ok: false, text: `No product matches "${code}"` });
      return;
    }
    if (match.stock === 0) {
      setScanFeedback({ ok: false, text: `${match.name} is out of stock` });
      return;
    }
    addItem("product", match);
    setScanFeedback({ ok: true, text: `✓ ${match.name}` });
    scanInputRef.current?.focus();
  }

  function setQty(type: "product" | "bundle", id: string, quantity: number) {
    setCart((prev) =>
      quantity <= 0
        ? prev.filter((i) => !(i.type === type && i.id === id))
        : prev.map((i) => (i.type === type && i.id === id ? { ...i, quantity } : i))
    );
  }

  const subtotal = cart.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const shipping = city.trim() ? getShippingForCity(zones, city, subtotal - couponDiscount - promoDiscount) : 0;
  const total = subtotal - couponDiscount - promoDiscount + shipping;

  const paymentLinesTotal = paymentLines.reduce((sum, l) => sum + (Number(l.amount) || 0) * 100, 0);
  const dueAfterSplit = total - paymentLinesTotal;

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

  function resetSale() {
    setCart([]);
    setCustomerName("");
    setEmail("");
    setPhone("");
    setAddress("");
    setCity("");
    setCouponCode("");
    setCouponDiscount(0);
    setSplitMode(false);
    setPaymentLines([{ method: "cash", amount: "" }]);
  }

  function serializeCurrentSale() {
    const cartJson = JSON.stringify(cart);
    const customerJson = JSON.stringify({ customerName, email, phone, address, city, status } satisfies SavedCustomer);
    return { cartJson, customerJson };
  }

  async function handleHold() {
    if (cart.length === 0) return;
    setHolding(true);
    const { cartJson, customerJson } = serializeCurrentSale();
    const label = customerName.trim() || undefined;
    const fd = new FormData();
    if (label) fd.set("label", label);
    fd.set("cart", cartJson);
    fd.set("customer", customerJson);
    await holdSale(fd);
    resetSale();
    setHolding(false);
    router.refresh();
  }

  async function handleResume(id: string) {
    const result = await resumeSale(id);
    if ("error" in result) {
      setError(result.error!);
      return;
    }
    const restoredCart = JSON.parse(result.cart!) as LineItem[];
    const restoredCustomer = JSON.parse(result.customer!) as SavedCustomer;
    setCart(restoredCart);
    setCustomerName(restoredCustomer.customerName);
    setEmail(restoredCustomer.email);
    setPhone(restoredCustomer.phone);
    setAddress(restoredCustomer.address);
    setCity(restoredCustomer.city);
    setStatus(restoredCustomer.status);
    setHeldOpen(false);
    router.refresh();
  }

  async function handleDiscard(id: string) {
    await discardHeldSale(id);
    router.refresh();
  }

  async function handleSubmit() {
    if (cart.length === 0) {
      setError("Add at least one item");
      return;
    }
    setSubmitting(true);
    setError(null);

    const payments = splitMode
      ? paymentLines
          .filter((l) => Number(l.amount) > 0)
          .map((l) => ({ method: l.method, amount: Math.round(Number(l.amount) * 100) }))
      : undefined;

    const result = await createPosOrder({
      customerName,
      email,
      phone,
      address: address || undefined,
      city: city || undefined,
      paymentMethod,
      payments,
      status,
      couponCode: couponDiscount > 0 ? couponCode : undefined,
      items: cart.map((i) => ({ type: i.type, id: i.id, quantity: i.quantity })),
    });

    if ("error" in result) {
      setError(result.error!);
      setSubmitting(false);
      return;
    }

    router.push(`/admin/pos/receipt/${result.orderId}`);
  }

  return (
    <div className="grid gap-8 lg:grid-cols-3">
      <div className="lg:col-span-2">
        <form onSubmit={handleScan} className="flex gap-2">
          <input
            ref={scanInputRef}
            value={scanCode}
            onChange={(e) => setScanCode(e.target.value)}
            autoComplete="off"
            placeholder="Scan or type barcode / SKU, then press Enter…"
            className="flex-1 rounded-2xl border-2 border-chili/30 bg-white px-4 py-3 focus:border-chili focus:outline-none"
          />
          <button
            type="submit"
            className="shrink-0 rounded-2xl bg-ink px-5 py-3 text-sm font-heading font-semibold text-cream hover:bg-ink/90"
          >
            Scan
          </button>
        </form>
        {scanFeedback && (
          <p className={`mt-1.5 text-sm font-semibold ${scanFeedback.ok ? "text-basil-dark" : "text-chili-dark"}`}>
            {scanFeedback.text}
          </p>
        )}

        <div className="mt-4 flex items-center justify-between">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Or search products by name…"
            className="w-full max-w-md rounded-2xl border border-ink/20 bg-white px-4 py-3 focus:border-chili focus:outline-none"
          />
          {heldSales.length > 0 && (
            <button
              onClick={() => setHeldOpen((v) => !v)}
              className="ml-3 shrink-0 rounded-full border-2 border-ink px-4 py-2 text-sm font-heading font-semibold hover:bg-ink hover:text-cream"
            >
              🕓 Held ({heldSales.length})
            </button>
          )}
        </div>

        {heldOpen && (
          <div className="mt-3 rounded-2xl border border-ink/10 bg-white p-3">
            {heldSales.length === 0 ? (
              <p className="p-2 text-sm text-ink-soft">No held sales.</p>
            ) : (
              <ul className="flex flex-col gap-2">
                {heldSales.map((h) => {
                  const items = JSON.parse(h.cart) as LineItem[];
                  return (
                    <li key={h.id} className="flex items-center justify-between rounded-xl bg-cream-dark/60 px-3 py-2 text-sm">
                      <div>
                        <p className="font-medium">{h.label || "Held sale"}</p>
                        <p className="text-xs text-ink-soft">
                          {items.length} item(s) · {new Date(h.createdAt).toLocaleTimeString("en-PK", { hour: "2-digit", minute: "2-digit" })}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleResume(h.id)}
                          className="rounded-full bg-chili px-3 py-1 text-xs font-heading font-semibold text-white hover:bg-chili-dark"
                        >
                          Resume
                        </button>
                        <button
                          onClick={() => handleDiscard(h.id)}
                          className="rounded-full border border-ink/20 px-3 py-1 text-xs font-semibold hover:bg-cream-dark"
                        >
                          Discard
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        )}

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
        <div className="flex items-center justify-between">
          <h2 className="font-heading text-lg font-bold">Order</h2>
          {cart.length > 0 && (
            <button
              onClick={handleHold}
              disabled={holding}
              className="rounded-full border border-ink/20 bg-white px-3 py-1 text-xs font-semibold hover:bg-cream-dark disabled:opacity-60"
            >
              {holding ? "Holding…" : "Hold sale"}
            </button>
          )}
        </div>
        {cart.length === 0 ? (
          <p className="mt-4 text-sm text-ink-soft">No items yet — scan, tap, or search to add.</p>
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
          <span>{formatPrice(subtotal)}</span>
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
          <span>{shipping === 0 ? "Free" : formatPrice(shipping)}</span>
        </div>
        <div className="mt-3 flex justify-between border-t border-ink/10 pt-3 font-heading text-lg font-bold">
          <span>Total</span>
          <span>{formatPrice(total)}</span>
        </div>

        <div className="mt-4">
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium text-ink-soft">Payment</label>
            <button
              onClick={() => setSplitMode((v) => !v)}
              className="text-xs font-semibold text-chili hover:underline"
            >
              {splitMode ? "Use single payment" : "Split payment"}
            </button>
          </div>

          {!splitMode ? (
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value as SinglePaymentMethod)}
              className="mt-1 w-full rounded-xl border border-ink/20 bg-white px-3 py-2 text-sm"
            >
              <option value="cash">Cash</option>
              <option value="card">Card</option>
              <option value="cod">Cash on delivery</option>
            </select>
          ) : (
            <div className="mt-1 flex flex-col gap-2">
              {paymentLines.map((line, i) => (
                <div key={i} className="flex gap-1.5">
                  <select
                    value={line.method}
                    onChange={(e) =>
                      setPaymentLines((prev) => prev.map((l, idx) => (idx === i ? { ...l, method: e.target.value as PaymentMethod } : l)))
                    }
                    className="flex-1 rounded-xl border border-ink/20 bg-white px-2 py-2 text-xs"
                  >
                    <option value="cash">Cash</option>
                    <option value="card">Card</option>
                    <option value="bank_transfer">Bank transfer</option>
                    <option value="cod">COD</option>
                    <option value="other">Other</option>
                  </select>
                  <input
                    type="number"
                    step="0.01"
                    value={line.amount}
                    onChange={(e) =>
                      setPaymentLines((prev) => prev.map((l, idx) => (idx === i ? { ...l, amount: e.target.value } : l)))
                    }
                    placeholder="Rs."
                    className="w-24 rounded-xl border border-ink/20 bg-white px-2 py-2 text-xs"
                  />
                  {paymentLines.length > 1 && (
                    <button
                      onClick={() => setPaymentLines((prev) => prev.filter((_, idx) => idx !== i))}
                      className="rounded-xl border border-ink/20 px-2 text-xs hover:bg-white"
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
              <button
                onClick={() => setPaymentLines((prev) => [...prev, { method: "cash", amount: "" }])}
                className="self-start text-xs font-semibold text-chili hover:underline"
              >
                + Add payment
              </button>
              <p className={`text-xs font-medium ${dueAfterSplit > 0 ? "text-chili-dark" : "text-basil-dark"}`}>
                {dueAfterSplit > 0 ? `${formatPrice(dueAfterSplit)} still due` : "Fully covered"}
              </p>
            </div>
          )}
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
