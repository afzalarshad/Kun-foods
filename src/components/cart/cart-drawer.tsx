"use client";

import Link from "next/link";
import { useCart } from "@/store/cart";
import { formatPrice } from "@/lib/format";
import { ProductImage } from "@/components/product/product-image";
import { useHydrated } from "@/lib/use-hydrated";

export function CartDrawer() {
  const { items, isOpen, close, setQuantity, removeItem, subtotal } = useCart();
  const hydrated = useHydrated();

  if (!hydrated) return null;

  return (
    <>
      <div
        className={`fixed inset-0 z-40 bg-ink/40 transition-opacity ${
          isOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={close}
        aria-hidden
      />
      <aside
        className={`fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col bg-cream shadow-2xl transition-transform duration-300 ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
        aria-label="Shopping cart"
      >
        <div className="flex items-center justify-between border-b border-ink/10 px-6 py-5">
          <h2 className="font-heading text-xl font-bold">Your Cart</h2>
          <button
            onClick={close}
            className="rounded-full p-2 text-ink hover:bg-cream-dark"
            aria-label="Close cart"
          >
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          {items.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
              <span className="text-5xl">🛒</span>
              <p className="text-ink-soft">Your cart is empty.</p>
              <Link
                href="/collections/all"
                onClick={close}
                className="mt-2 rounded-full bg-chili px-5 py-2 font-heading font-semibold text-white hover:bg-chili-dark"
              >
                Start shopping
              </Link>
            </div>
          ) : (
            <ul className="flex flex-col gap-4">
              {items.map((item) => (
                <li key={item.productId} className="flex gap-3">
                  <ProductImage
                    emoji={item.image}
                    seed={item.productId}
                    className="h-20 w-20 shrink-0"
                    size="text-3xl"
                  />
                  <div className="flex flex-1 flex-col">
                    <div className="flex items-start justify-between gap-2">
                      <Link
                        href={`/products/${item.slug}`}
                        onClick={close}
                        className="font-heading text-sm font-semibold leading-snug hover:text-chili"
                      >
                        {item.name}
                      </Link>
                      <button
                        onClick={() => removeItem(item.productId)}
                        className="shrink-0 text-ink-soft hover:text-chili"
                        aria-label={`Remove ${item.name}`}
                      >
                        ✕
                      </button>
                    </div>
                    {item.weightLabel && (
                      <p className="text-xs text-ink-soft">{item.weightLabel}</p>
                    )}
                    <div className="mt-auto flex items-center justify-between pt-2">
                      <div className="flex items-center rounded-full border border-ink/20">
                        <button
                          className="px-3 py-1 text-sm"
                          onClick={() => setQuantity(item.productId, item.quantity - 1)}
                          aria-label="Decrease quantity"
                        >
                          −
                        </button>
                        <span className="min-w-6 text-center text-sm font-medium">
                          {item.quantity}
                        </span>
                        <button
                          className="px-3 py-1 text-sm"
                          onClick={() => setQuantity(item.productId, item.quantity + 1)}
                          aria-label="Increase quantity"
                        >
                          +
                        </button>
                      </div>
                      <span className="font-heading text-sm font-bold text-chili">
                        {formatPrice(item.price * item.quantity)}
                      </span>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {items.length > 0 && (
          <div className="border-t border-ink/10 px-6 py-5">
            <div className="mb-4 flex items-center justify-between font-heading text-lg font-bold">
              <span>Subtotal</span>
              <span>{formatPrice(subtotal())}</span>
            </div>
            <Link
              href="/checkout"
              onClick={close}
              className="block w-full rounded-full bg-chili py-3 text-center font-heading font-semibold text-white hover:bg-chili-dark"
            >
              Checkout
            </Link>
            <Link
              href="/cart"
              onClick={close}
              className="mt-2 block w-full rounded-full border-2 border-ink py-3 text-center font-heading font-semibold text-ink hover:bg-ink hover:text-cream"
            >
              View cart
            </Link>
          </div>
        )}
      </aside>
    </>
  );
}
