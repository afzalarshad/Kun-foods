"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import type { Category, Product } from "@prisma/client";
import { formatPrice } from "@/lib/format";
import { DeleteProductButton } from "@/components/admin/delete-product-button";
import { bulkSetProductActive } from "@/app/admin/(dashboard)/products/bulk-actions";

type ProductRow = Product & { category: Category };

export function ProductsTable({ products }: { products: ProductRow[] }) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [isPending, startTransition] = useTransition();

  const allSelected = products.length > 0 && selected.size === products.length;

  function toggleAll() {
    setSelected(allSelected ? new Set() : new Set(products.map((p) => p.id)));
  }

  function toggleOne(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function runBulk(active: boolean) {
    startTransition(async () => {
      await bulkSetProductActive([...selected], active);
      setSelected(new Set());
    });
  }

  return (
    <div>
      <div className="overflow-x-auto rounded-3xl bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-ink/10 text-ink-soft">
              <th className="w-10 px-6 py-3">
                <input type="checkbox" checked={allSelected} onChange={toggleAll} className="h-4 w-4 rounded border-ink/30" />
              </th>
              <th className="px-6 py-3 font-medium">Product</th>
              <th className="px-6 py-3 font-medium">Category</th>
              <th className="px-6 py-3 font-medium">Price</th>
              <th className="px-6 py-3 font-medium">Stock</th>
              <th className="px-6 py-3 font-medium">Status</th>
              <th className="px-6 py-3 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.id} className={`border-b border-ink/5 last:border-0 ${!p.active ? "opacity-50" : ""}`}>
                <td className="px-6 py-3">
                  <input
                    type="checkbox"
                    checked={selected.has(p.id)}
                    onChange={() => toggleOne(p.id)}
                    className="h-4 w-4 rounded border-ink/30"
                  />
                </td>
                <td className="px-6 py-3">
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{JSON.parse(p.images)[0]}</span>
                    <div>
                      <p className="font-medium">{p.name}</p>
                      {p.featured && <p className="text-xs text-saffron-dark">Featured</p>}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-3 text-ink-soft">{p.category.name}</td>
                <td className="px-6 py-3 font-medium">{formatPrice(p.price)}</td>
                <td className="px-6 py-3">
                  <span className={p.stock === 0 ? "font-medium text-chili" : ""}>{p.stock}</span>
                </td>
                <td className="px-6 py-3">
                  {p.active ? (
                    <span className="rounded-full bg-basil/10 px-2.5 py-0.5 text-xs font-semibold text-basil-dark">Active</span>
                  ) : (
                    <span className="rounded-full bg-cream-dark px-2.5 py-0.5 text-xs font-semibold text-ink-soft">Inactive</span>
                  )}
                </td>
                <td className="px-6 py-3">
                  <div className="flex justify-end gap-3">
                    <Link href={`/admin/inventory?product=${p.id}`} className="font-medium text-ink-soft hover:underline">
                      History
                    </Link>
                    <Link href={`/admin/products/${p.id}/edit`} className="font-medium text-basil hover:underline">
                      Edit
                    </Link>
                    <DeleteProductButton productId={p.id} productName={p.name} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selected.size > 0 && (
        <div className="sticky bottom-4 mt-4 flex items-center justify-between rounded-2xl bg-ink px-6 py-3 text-cream shadow-lg">
          <span className="text-sm font-medium">{selected.size} selected</span>
          <div className="flex gap-2">
            <button
              onClick={() => runBulk(true)}
              disabled={isPending}
              className="rounded-full bg-basil px-4 py-1.5 text-xs font-heading font-semibold text-white hover:bg-basil-dark disabled:opacity-60"
            >
              Activate
            </button>
            <button
              onClick={() => runBulk(false)}
              disabled={isPending}
              className="rounded-full bg-white/10 px-4 py-1.5 text-xs font-heading font-semibold hover:bg-white/20 disabled:opacity-60"
            >
              Deactivate
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
