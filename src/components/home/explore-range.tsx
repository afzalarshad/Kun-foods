"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { ProductImage } from "@/components/product/product-image";
import { formatPrice } from "@/lib/format";
import { useCart } from "@/store/cart";
import type { ProductCard as ProductCardType } from "@/lib/types";

function RangeCard({ product }: { product: ProductCardType }) {
  const addItem = useCart((s) => s.addItem);
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

  function handleAdd() {
    addItem(
      {
        type: "product",
        id: product.id,
        name: product.name,
        slug: product.slug,
        price: product.price,
        image: product.images[0] ?? "🍽️",
        weightLabel: product.weightLabel,
      },
      quantity
    );
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  }

  return (
    <div className="flex w-64 shrink-0 snap-start flex-col rounded-3xl bg-white p-4 shadow-sm">
      <Link href={`/products/${product.slug}`} className="block aspect-square overflow-hidden rounded-2xl bg-cream-dark p-4">
        <ProductImage emoji={product.images[0] ?? "🍽️"} seed={product.slug} className="h-full w-full" />
      </Link>
      <Link href={`/products/${product.slug}`} className="mt-3">
        <h3 className="font-heading text-sm font-semibold leading-snug hover:text-chili">{product.name}</h3>
      </Link>
      <span className="mt-1 font-heading font-bold text-chili">{formatPrice(product.price)}</span>

      <div className="mt-3 flex items-center gap-2">
        <div className="flex items-center rounded-full border border-ink/15">
          <button
            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
            aria-label="Decrease quantity"
            className="flex h-9 w-9 items-center justify-center text-lg hover:bg-cream-dark"
          >
            −
          </button>
          <span className="w-6 text-center text-sm font-semibold">{quantity}</span>
          <button
            onClick={() => setQuantity((q) => Math.min(50, q + 1))}
            aria-label="Increase quantity"
            className="flex h-9 w-9 items-center justify-center text-lg hover:bg-cream-dark"
          >
            +
          </button>
        </div>
        <button
          onClick={handleAdd}
          className="btn-3d flex-1 rounded-full bg-chili py-2 text-sm font-heading font-semibold text-white hover:bg-chili-dark"
        >
          {added ? "Added ✓" : "Add to cart"}
        </button>
      </div>
    </div>
  );
}

export function ExploreRange({ products }: { products: ProductCardType[] }) {
  const scrollerRef = useRef<HTMLDivElement>(null);

  function scrollBy(amount: number) {
    scrollerRef.current?.scrollBy({ left: amount, behavior: "smooth" });
  }

  if (products.length === 0) return null;

  return (
    <section className="mx-auto max-w-7xl px-4 py-16 sm:py-20">
      <div className="mb-8 flex items-end justify-between gap-4">
        <div>
          <h2 className="font-heading text-3xl font-extrabold sm:text-4xl">Explore the range</h2>
          <p className="mt-2 text-ink-soft">Pick a quantity and add straight to your cart — no detour needed.</p>
        </div>
        <div className="hidden gap-2 sm:flex">
          <button
            onClick={() => scrollBy(-280)}
            aria-label="Scroll left"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-ink/15 hover:bg-cream-dark"
          >
            ←
          </button>
          <button
            onClick={() => scrollBy(280)}
            aria-label="Scroll right"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-ink/15 hover:bg-cream-dark"
          >
            →
          </button>
        </div>
      </div>

      <div ref={scrollerRef} className="flex snap-x snap-mandatory gap-5 overflow-x-auto pb-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {products.map((product) => (
          <RangeCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  );
}
