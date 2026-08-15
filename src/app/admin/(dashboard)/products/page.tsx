import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { ProductsTable } from "@/components/admin/products-table";

const PAGE_SIZE = 50;

export default async function AdminProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; q?: string }>;
}) {
  const { page: pageParam, q } = await searchParams;
  const page = Math.max(1, Number(pageParam) || 1);
  const query = q?.trim();

  const where = query
    ? {
        OR: [
          { name: { contains: query, mode: "insensitive" as const } },
          { sku: { contains: query, mode: "insensitive" as const } },
          { barcode: { contains: query, mode: "insensitive" as const } },
        ],
      }
    : {};

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      include: { category: true },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.product.count({ where }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const pageQuery = (n: number) => `?${query ? `q=${encodeURIComponent(query)}&` : ""}page=${n}`;

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-3xl font-extrabold">Products</h1>
          <p className="mt-1 text-ink-soft">{total} total</p>
        </div>
        <Link
          href="/admin/products/new"
          className="rounded-full bg-chili px-5 py-2.5 font-heading font-semibold text-white hover:bg-chili-dark"
        >
          + Add product
        </Link>
      </div>

      <form className="mt-6 flex gap-2" action="/admin/products">
        <input
          type="text"
          name="q"
          defaultValue={query}
          placeholder="Search by name, SKU, or barcode…"
          className="w-full max-w-sm rounded-full border border-ink/20 bg-white px-4 py-2.5 text-sm focus:border-chili focus:outline-none"
        />
        <button type="submit" className="rounded-full border border-ink/20 px-4 py-2.5 text-sm font-semibold hover:bg-cream-dark">
          Search
        </button>
        {query && (
          <Link href="/admin/products" className="rounded-full border border-ink/20 px-4 py-2.5 text-sm font-semibold hover:bg-cream-dark">
            Clear
          </Link>
        )}
      </form>

      <div className="mt-6">
        <ProductsTable products={products} />
      </div>

      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-center gap-3 text-sm">
          {page > 1 && (
            <Link href={pageQuery(page - 1)} className="rounded-full border border-ink/20 px-4 py-1.5 hover:bg-cream-dark">
              ← Newer
            </Link>
          )}
          <span className="text-ink-soft">
            Page {page} of {totalPages}
          </span>
          {page < totalPages && (
            <Link href={pageQuery(page + 1)} className="rounded-full border border-ink/20 px-4 py-1.5 hover:bg-cream-dark">
              Older →
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
