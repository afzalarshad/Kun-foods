"use client";

import { useState } from "react";
import type { Category, Product } from "@prisma/client";

const EMOJI_OPTIONS = [
  "🌶️", "🫙", "🥭", "🌾", "🍚", "🥨", "🍮", "🥤", "✨", "🍛",
  "🥕", "🍯", "🥜", "💎", "🌹", "🍵", "🍽️",
];

export function ProductForm({
  action,
  categories,
  product,
}: {
  action: (formData: FormData) => void;
  categories: Category[];
  product?: Product;
}) {
  const [selectedEmoji, setSelectedEmoji] = useState(
    product ? (JSON.parse(product.images)[0] as string) : EMOJI_OPTIONS[0]
  );

  return (
    <form action={action} className="flex max-w-2xl flex-col gap-5">
      <div>
        <label className="mb-1.5 block text-sm font-medium">Product name</label>
        <input
          name="name"
          required
          defaultValue={product?.name}
          className="w-full rounded-2xl border border-ink/20 bg-white px-4 py-3 focus:border-chili focus:outline-none"
        />
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium">Category</label>
        <select
          name="categoryId"
          required
          defaultValue={product?.categoryId}
          className="w-full rounded-2xl border border-ink/20 bg-white px-4 py-3 focus:border-chili focus:outline-none"
        >
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium">Description</label>
        <textarea
          name="description"
          required
          rows={4}
          defaultValue={product?.description}
          className="w-full rounded-2xl border border-ink/20 bg-white px-4 py-3 focus:border-chili focus:outline-none"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="mb-1.5 block text-sm font-medium">Price (Rs.)</label>
          <input
            type="number"
            name="price"
            required
            min={1}
            step="0.01"
            defaultValue={product ? product.price / 100 : undefined}
            className="w-full rounded-2xl border border-ink/20 bg-white px-4 py-3 focus:border-chili focus:outline-none"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium">Compare-at price (optional)</label>
          <input
            type="number"
            name="compareAtPrice"
            min={0}
            step="0.01"
            defaultValue={product?.compareAtPrice ? product.compareAtPrice / 100 : undefined}
            className="w-full rounded-2xl border border-ink/20 bg-white px-4 py-3 focus:border-chili focus:outline-none"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="mb-1.5 block text-sm font-medium">Weight / size</label>
          <input
            name="weightLabel"
            placeholder="e.g. 500g"
            defaultValue={product?.weightLabel ?? ""}
            className="w-full rounded-2xl border border-ink/20 bg-white px-4 py-3 focus:border-chili focus:outline-none"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium">Stock quantity</label>
          <input
            type="number"
            name="stock"
            required
            min={0}
            defaultValue={product?.stock ?? 100}
            className="w-full rounded-2xl border border-ink/20 bg-white px-4 py-3 focus:border-chili focus:outline-none"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="mb-1.5 block text-sm font-medium">SKU (optional)</label>
          <input
            name="sku"
            defaultValue={product?.sku ?? ""}
            className="w-full rounded-2xl border border-ink/20 bg-white px-4 py-3 focus:border-chili focus:outline-none"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium">Barcode (optional)</label>
          <input
            name="barcode"
            defaultValue={product?.barcode ?? ""}
            className="w-full rounded-2xl border border-ink/20 bg-white px-4 py-3 focus:border-chili focus:outline-none"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="mb-1.5 block text-sm font-medium">Cost price (Rs., optional)</label>
          <input
            type="number"
            name="costPrice"
            min={0}
            step="0.01"
            defaultValue={product?.costPrice ? product.costPrice / 100 : undefined}
            className="w-full rounded-2xl border border-ink/20 bg-white px-4 py-3 focus:border-chili focus:outline-none"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium">Reorder level (optional)</label>
          <input
            type="number"
            name="reorderLevel"
            min={0}
            defaultValue={product?.reorderLevel ?? undefined}
            placeholder="Alert when stock falls to/below this"
            className="w-full rounded-2xl border border-ink/20 bg-white px-4 py-3 focus:border-chili focus:outline-none"
          />
        </div>
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium">Supplier (optional)</label>
        <input
          name="supplier"
          defaultValue={product?.supplier ?? ""}
          className="w-full rounded-2xl border border-ink/20 bg-white px-4 py-3 focus:border-chili focus:outline-none"
        />
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium">Badge (optional)</label>
        <select
          name="badge"
          defaultValue={product?.badge ?? ""}
          className="w-full rounded-2xl border border-ink/20 bg-white px-4 py-3 focus:border-chili focus:outline-none"
        >
          <option value="">None</option>
          <option value="Bestseller">Bestseller</option>
          <option value="New">New</option>
          <option value="Sale">Sale</option>
        </select>
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium">Product icon</label>
        <input type="hidden" name="image" value={selectedEmoji} />
        <div className="flex flex-wrap gap-2">
          {EMOJI_OPTIONS.map((emoji) => (
            <button
              type="button"
              key={emoji}
              onClick={() => setSelectedEmoji(emoji)}
              className={`flex h-11 w-11 items-center justify-center rounded-xl border-2 text-xl ${
                selectedEmoji === emoji ? "border-chili bg-chili/10" : "border-ink/15"
              }`}
            >
              {emoji}
            </button>
          ))}
        </div>
      </div>

      <label className="flex items-center gap-2 text-sm font-medium">
        <input type="checkbox" name="featured" defaultChecked={product?.featured} />
        Feature on homepage
      </label>

      <label className="flex items-center gap-2 text-sm font-medium">
        <input type="checkbox" name="active" defaultChecked={product?.active ?? true} />
        Active (visible on the storefront and in POS)
      </label>

      <button
        type="submit"
        className="mt-2 w-fit rounded-full bg-chili px-7 py-3 font-heading font-semibold text-white hover:bg-chili-dark"
      >
        {product ? "Save changes" : "Create product"}
      </button>
    </form>
  );
}
