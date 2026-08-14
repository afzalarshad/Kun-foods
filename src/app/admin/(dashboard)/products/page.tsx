import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatPrice } from "@/lib/format";
import { DeleteProductButton } from "@/components/admin/delete-product-button";

export default async function AdminProductsPage() {
  const products = await prisma.product.findMany({
    include: { category: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-3xl font-extrabold">Products</h1>
          <p className="mt-1 text-ink-soft">{products.length} total</p>
        </div>
        <Link
          href="/admin/products/new"
          className="rounded-full bg-chili px-5 py-2.5 font-heading font-semibold text-white hover:bg-chili-dark"
        >
          + Add product
        </Link>
      </div>

      <div className="mt-8 overflow-x-auto rounded-3xl bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-ink/10 text-ink-soft">
              <th className="px-6 py-3 font-medium">Product</th>
              <th className="px-6 py-3 font-medium">Category</th>
              <th className="px-6 py-3 font-medium">Price</th>
              <th className="px-6 py-3 font-medium">Stock</th>
              <th className="px-6 py-3 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.id} className="border-b border-ink/5 last:border-0">
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
                  <div className="flex justify-end gap-3">
                    <Link
                      href={`/admin/products/${p.id}/edit`}
                      className="font-medium text-basil hover:underline"
                    >
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
    </div>
  );
}
