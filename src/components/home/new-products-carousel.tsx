"use client";

import { useRef } from "react";
import Link from "next/link";
import { ProductImage } from "@/components/product/product-image";
import { formatPrice } from "@/lib/format";
import type { ProductCard as ProductCardType } from "@/lib/types";

export function NewProductsCarousel({ products }: { products: ProductCardType[] }) {
  const scrollerRef = useRef<HTMLDivElement>(null);

  function scrollBy(amount: number) {
    scrollerRef.current?.scrollBy({ left: amount, behavior: "smooth" });
  }

  if (products.length === 0) return null;

  return (
    <section className="bg-cream-dark/50 py-16 sm:py-20">
      <div className="mx-auto max-w-7xl px-4">
        <div className="mb-8 flex items-end justify-between gap-4">
          <h2 className="font-heading text-3xl font-extrabold sm:text-4xl">Try our new products</h2>
          <div className="hidden gap-2 sm:flex">
            <button
              onClick={() => scrollBy(-260)}
              aria-label="Scroll left"
              className="flex h-10 w-10 items-center justify-center rounded-full border border-ink/15 bg-white hover:bg-cream"
            >
              ←
            </button>
            <button
              onClick={() => scrollBy(260)}
              aria-label="Scroll right"
              className="flex h-10 w-10 items-center justify-center rounded-full border border-ink/15 bg-white hover:bg-cream"
            >
              →
            </button>
          </div>
        </div>

        <div ref={scrollerRef} className="flex snap-x snap-mandatory gap-5 overflow-x-auto pb-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {products.map((product) => (
            <Link
              key={product.id}
              href={`/products/${product.slug}`}
              className="group flex w-48 shrink-0 snap-start flex-col"
            >
              <div className="relative aspect-square overflow-hidden rounded-3xl bg-white p-5 shadow-sm transition-shadow group-hover:shadow-xl">
                {product.badge && (
                  <span className="absolute left-3 top-3 z-10 rounded-full bg-basil px-2.5 py-1 text-xs font-semibold font-heading text-white">
                    {product.badge}
                  </span>
                )}
                <ProductImage emoji={product.images[0] ?? "🍽️"} seed={product.slug} className="h-full w-full" />
              </div>
              <h3 className="mt-3 font-heading text-sm font-semibold leading-snug group-hover:text-chili">{product.name}</h3>
              <span className="mt-1 font-heading font-bold text-chili">{formatPrice(product.price)}</span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
