"use client";

import { useState } from "react";
import { useCart } from "@/store/cart";

export function AddToCart({
  productId,
  name,
  slug,
  price,
  image,
  weightLabel,
  inStock,
}: {
  productId: string;
  name: string;
  slug: string;
  price: number;
  image: string;
  weightLabel: string | null;
  inStock: boolean;
}) {
  const addItem = useCart((s) => s.addItem);
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
      <div className="flex w-fit items-center rounded-full border-2 border-ink">
        <button
          onClick={() => setQuantity((q) => Math.max(1, q - 1))}
          className="px-4 py-3 text-lg"
          aria-label="Decrease quantity"
        >
          −
        </button>
        <span className="min-w-8 text-center font-heading font-semibold">{quantity}</span>
        <button
          onClick={() => setQuantity((q) => q + 1)}
          className="px-4 py-3 text-lg"
          aria-label="Increase quantity"
        >
          +
        </button>
      </div>

      <button
        disabled={!inStock}
        onClick={() => {
          addItem({ type: "product", id: productId, name, slug, price, image, weightLabel }, quantity);
          setAdded(true);
          setTimeout(() => setAdded(false), 1800);
        }}
        className="btn-3d flex-1 rounded-full bg-chili py-3.5 font-heading font-semibold text-white transition-colors hover:bg-chili-dark disabled:cursor-not-allowed disabled:bg-ink/20 disabled:text-ink-soft"
      >
        {!inStock ? "Out of stock" : added ? "Added to cart ✓" : "Add to cart"}
      </button>
    </div>
  );
}
