"use client";

import { useCart } from "@/store/cart";
import { useHydrated } from "@/lib/use-hydrated";

export function CartButton() {
  const { open, itemCount } = useCart();
  const hydrated = useHydrated();
  const count = hydrated ? itemCount() : 0;

  return (
    <button
      onClick={open}
      className="relative flex h-10 w-10 items-center justify-center rounded-full hover:bg-cream-dark"
      aria-label="Open cart"
    >
      <span className="text-xl">🛒</span>
      {count > 0 && (
        <span className="absolute -right-0.5 -top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-chili text-[11px] font-bold text-white">
          {count}
        </span>
      )}
    </button>
  );
}
