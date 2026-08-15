"use client";

import Link from "next/link";
import { ProductImage } from "@/components/product/product-image";
import { formatPrice } from "@/lib/format";
import { useCart } from "@/store/cart";
import type { ProductCard as ProductCardType } from "@/lib/types";

const badgeStyles: Record<string, string> = {
  Bestseller: "bg-saffron text-ink",
  New: "bg-basil text-white",
  Sale: "bg-chili text-white",
};

export function ProductCard({ product }: { product: ProductCardType }) {
  const addItem = useCart((s) => s.addItem);

  return (
    <div className="group flex flex-col">
      <Link
        href={`/products/${product.slug}`}
        className="relative block aspect-square overflow-hidden rounded-3xl bg-cream-dark p-6"
      >
        {product.badge && (
          <span
            className={`absolute left-3 top-3 z-10 rounded-full px-3 py-1 text-xs font-semibold font-heading ${
              badgeStyles[product.badge] ?? "bg-ink text-white"
            }`}
          >
            {product.badge}
          </span>
        )}
        <ProductImage
          emoji={product.images[0] ?? "🍽️"}
          seed={product.slug}
          className="h-full w-full transition-transform duration-300 group-hover:scale-105 group-hover:animate-blob-float"
        />
      </Link>

      <div className="mt-4 flex flex-1 flex-col">
        <p className="text-xs font-medium uppercase tracking-wide text-ink-soft">
          {product.categoryName}
        </p>
        <Link href={`/products/${product.slug}`} className="mt-1">
          <h3 className="font-heading text-base font-semibold leading-snug text-ink hover:text-chili">
            {product.name}
          </h3>
        </Link>
        {product.weightLabel && (
          <p className="mt-0.5 text-sm text-ink-soft">
            {product.weightLabel}
            {product.variantCount > 1 && ` · ${product.variantCount} sizes`}
          </p>
        )}

        <div className="mt-2 flex items-center gap-2">
          <span className="font-heading text-lg font-bold text-chili">
            {formatPrice(product.price)}
          </span>
          {product.compareAtPrice && (
            <span className="text-sm text-ink-soft line-through">
              {formatPrice(product.compareAtPrice)}
            </span>
          )}
        </div>

        <button
          onClick={() =>
            addItem({
              type: "product",
              id: product.id,
              name: product.name,
              slug: product.slug,
              price: product.price,
              image: product.images[0] ?? "🍽️",
              weightLabel: product.weightLabel,
            })
          }
          className="mt-3 w-full rounded-full border-2 border-ink bg-transparent py-2 text-sm font-semibold font-heading text-ink transition-colors hover:bg-ink hover:text-cream"
        >
          Add to cart
        </button>
      </div>
    </div>
  );
}
