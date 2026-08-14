"use client";

import Link from "next/link";
import { useCart } from "@/store/cart";
import { formatPrice } from "@/lib/format";
import { ProductImage } from "@/components/product/product-image";
import { useHydrated } from "@/lib/use-hydrated";

export default function CartPage() {
  const { items, setQuantity, removeItem, subtotal } = useCart();
  const hydrated = useHydrated();

  if (!hydrated) return null;

  if (items.length === 0) {
    return (
      <div className="mx-auto flex max-w-xl flex-col items-center gap-4 px-4 py-24 text-center">
        <span className="text-6xl">🛒</span>
        <h1 className="font-heading text-2xl font-bold">Your cart is empty</h1>
        <p className="text-ink-soft">Looks like you haven&apos;t added anything yet.</p>
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
      <h1 className="mb-8 font-heading text-3xl font-extrabold sm:text-4xl">Your Cart</h1>

      <div className="grid gap-10 lg:grid-cols-3">
        <ul className="flex flex-col gap-6 lg:col-span-2">
          {items.map((item) => (
            <li key={item.id} className="flex gap-4 border-b border-ink/10 pb-6">
              <ProductImage
                emoji={item.image}
                seed={item.id}
                className="h-24 w-24 shrink-0"
                size="text-4xl"
              />
              <div className="flex flex-1 flex-col">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    {item.slug ? (
                      <Link
                        href={`/products/${item.slug}`}
                        className="font-heading font-semibold hover:text-chili"
                      >
                        {item.name}
                      </Link>
                    ) : (
                      <span className="font-heading font-semibold">{item.name}</span>
                    )}
                    {item.weightLabel && (
                      <p className="text-sm text-ink-soft">{item.weightLabel}</p>
                    )}
                  </div>
                  <button
                    onClick={() => removeItem(item.id)}
                    className="text-sm text-ink-soft hover:text-chili"
                  >
                    Remove
                  </button>
                </div>
                <div className="mt-auto flex items-center justify-between pt-3">
                  <div className="flex items-center rounded-full border border-ink/20">
                    <button
                      className="px-3 py-1.5"
                      onClick={() => setQuantity(item.id, item.quantity - 1)}
                      aria-label="Decrease quantity"
                    >
                      −
                    </button>
                    <span className="min-w-6 text-center text-sm font-medium">
                      {item.quantity}
                    </span>
                    <button
                      className="px-3 py-1.5"
                      onClick={() => setQuantity(item.id, item.quantity + 1)}
                      aria-label="Increase quantity"
                    >
                      +
                    </button>
                  </div>
                  <span className="font-heading font-bold text-chili">
                    {formatPrice(item.price * item.quantity)}
                  </span>
                </div>
              </div>
            </li>
          ))}
        </ul>

        <div className="h-fit rounded-3xl bg-cream-dark p-6">
          <h2 className="font-heading text-lg font-bold">Order summary</h2>
          <div className="mt-4 flex justify-between text-sm text-ink-soft">
            <span>Subtotal</span>
            <span>{formatPrice(subtotal())}</span>
          </div>
          <div className="mt-2 flex justify-between text-sm text-ink-soft">
            <span>Shipping</span>
            <span>Calculated at checkout</span>
          </div>
          <div className="mt-4 flex justify-between border-t border-ink/10 pt-4 font-heading text-lg font-bold">
            <span>Total</span>
            <span>{formatPrice(subtotal())}</span>
          </div>
          <Link
            href="/checkout"
            className="mt-6 block w-full rounded-full bg-chili py-3.5 text-center font-heading font-semibold text-white hover:bg-chili-dark"
          >
            Proceed to checkout
          </Link>
        </div>
      </div>
    </div>
  );
}
