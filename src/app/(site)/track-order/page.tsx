"use client";

import { useState } from "react";
import { formatPrice } from "@/lib/format";

type OrderResult = {
  orderNumber: string;
  status: string;
  total: number;
  createdAt: string;
  items: { id: string; name: string; quantity: number; price: number }[];
};

const statusSteps = ["pending", "processing", "packed", "shipped", "delivered"];

export default function TrackOrderPage() {
  const [order, setOrder] = useState<OrderResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setOrder(null);

    const form = new FormData(e.currentTarget);
    const params = new URLSearchParams({
      orderNumber: String(form.get("orderNumber")),
      email: String(form.get("email")),
    });

    const res = await fetch(`/api/orders/track?${params}`);
    const data = await res.json();

    if (!res.ok) {
      setError(data.error ?? "Something went wrong.");
    } else {
      setOrder(data.order);
    }
    setLoading(false);
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-14 sm:py-20">
      <h1 className="font-heading text-4xl font-extrabold">Track your order</h1>
      <p className="mt-3 text-ink-soft">
        Enter your order number and the email you used at checkout.
      </p>

      <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-4 sm:flex-row">
        <input
          name="orderNumber"
          required
          placeholder="Order number (e.g. KF2608-1234)"
          className="flex-1 rounded-2xl border border-ink/20 bg-white px-4 py-3 focus:border-chili focus:outline-none"
        />
        <input
          type="email"
          name="email"
          required
          placeholder="Email"
          className="flex-1 rounded-2xl border border-ink/20 bg-white px-4 py-3 focus:border-chili focus:outline-none"
        />
        <button
          type="submit"
          disabled={loading}
          className="rounded-full bg-chili px-6 py-3 font-heading font-semibold text-white hover:bg-chili-dark disabled:opacity-60"
        >
          {loading ? "Searching…" : "Track"}
        </button>
      </form>

      {error && (
        <p className="mt-6 rounded-xl bg-chili/10 px-4 py-3 text-sm font-medium text-chili-dark">
          {error}
        </p>
      )}

      {order && (
        <div className="mt-8 rounded-3xl bg-cream-dark p-6">
          <div className="flex items-center justify-between">
            <h2 className="font-heading font-bold">Order #{order.orderNumber}</h2>
            <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold capitalize">
              {order.status}
            </span>
          </div>

          {statusSteps.includes(order.status) && (
            <div className="mt-5 flex items-center">
              {statusSteps.map((step, i) => {
                const currentIndex = statusSteps.indexOf(order.status);
                const done = i <= currentIndex;
                return (
                  <div key={step} className="flex flex-1 items-center last:flex-none">
                    <div className="flex flex-col items-center gap-1">
                      <span
                        className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
                          done ? "bg-basil text-white" : "bg-white text-ink-soft"
                        }`}
                      >
                        {done ? "✓" : i + 1}
                      </span>
                      <span className="text-[11px] capitalize text-ink-soft">{step}</span>
                    </div>
                    {i < statusSteps.length - 1 && (
                      <div className={`mx-1 h-0.5 flex-1 ${done ? "bg-basil" : "bg-white"}`} />
                    )}
                  </div>
                );
              })}
            </div>
          )}

          <ul className="mt-6 flex flex-col gap-2 border-t border-ink/10 pt-4">
            {order.items.map((item) => (
              <li key={item.id} className="flex justify-between text-sm">
                <span>
                  {item.name} × {item.quantity}
                </span>
                <span className="font-medium">{formatPrice(item.price * item.quantity)}</span>
              </li>
            ))}
          </ul>
          <div className="mt-3 flex justify-between border-t border-ink/10 pt-3 font-heading font-bold">
            <span>Total</span>
            <span>{formatPrice(order.total)}</span>
          </div>
        </div>
      )}
    </div>
  );
}
