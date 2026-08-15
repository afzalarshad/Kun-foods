import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/require-admin";
import { AdjustStockForm } from "@/components/admin/adjust-stock-form";

const PAGE_SIZE = 50;

const typeStyles: Record<string, string> = {
  sale: "bg-chili/10 text-chili-dark",
  return: "bg-plum/10 text-plum",
  adjustment: "bg-saffron/20 text-saffron-dark",
  restock: "bg-basil/10 text-basil-dark",
};

export default async function InventoryPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; product?: string }>;
}) {
  await requirePermission("inventory.view");
  const { page: pageParam, product: productFilter } = await searchParams;
  const page = Math.max(1, Number(pageParam) || 1);

  const where = productFilter ? { productId: productFilter } : {};

  const [products, lowStock, movements, total, filteredProduct] = await Promise.all([
    prisma.product.findMany({
      select: { id: true, name: true, sku: true, stock: true },
      orderBy: { name: "asc" },
    }),
    prisma.product.findMany({
      where: { reorderLevel: { not: null } },
      select: { id: true, name: true, sku: true, stock: true, reorderLevel: true },
      orderBy: { stock: "asc" },
    }),
    prisma.inventoryMovement.findMany({
      where,
      include: { product: { select: { name: true, sku: true } } },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.inventoryMovement.count({ where }),
    productFilter ? prisma.product.findUnique({ where: { id: productFilter }, select: { name: true } }) : null,
  ]);

  const lowStockAlerts = lowStock.filter((p) => p.reorderLevel !== null && p.stock <= p.reorderLevel);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const pageQuery = (n: number) => `?${productFilter ? `product=${productFilter}&` : ""}page=${n}`;

  return (
    <div>
      <h1 className="font-heading text-3xl font-extrabold">Inventory</h1>
      <p className="mt-1 text-ink-soft">Stock movements, manual adjustments, and low-stock alerts.</p>

      {lowStockAlerts.length > 0 && (
        <div className="mt-6 rounded-3xl border-2 border-chili/30 bg-chili/5 p-6">
          <h2 className="font-heading font-bold text-chili-dark">⚠️ Low stock — {lowStockAlerts.length} product(s)</h2>
          <ul className="mt-3 flex flex-wrap gap-2">
            {lowStockAlerts.map((p) => (
              <li key={p.id}>
                <Link
                  href={`/admin/inventory?product=${p.id}`}
                  className="rounded-full bg-white px-3 py-1.5 text-sm font-medium shadow-sm hover:text-chili"
                >
                  {p.name} — {p.stock} left (reorder at {p.reorderLevel})
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-6 rounded-3xl bg-white p-6 shadow-sm">
        <h2 className="font-heading font-bold">Adjust stock</h2>
        <p className="mt-1 text-sm text-ink-soft">
          Use a positive number for stock received, negative for damage/loss/recount corrections. Sales and
          returns are logged automatically and don&apos;t need a manual entry here.
        </p>
        <div className="mt-4">
          <AdjustStockForm products={products} />
        </div>
      </div>

      <div className="mt-6 flex items-center justify-between">
        <h2 className="font-heading text-lg font-bold">
          Movement history{filteredProduct ? ` — ${filteredProduct.name}` : ""}
        </h2>
        {productFilter && (
          <Link href="/admin/inventory" className="text-sm font-semibold text-chili hover:underline">
            Clear filter ×
          </Link>
        )}
      </div>

      <div className="mt-3 overflow-x-auto rounded-3xl bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-ink/10 text-ink-soft">
              <th className="px-6 py-3 font-medium">When</th>
              <th className="px-6 py-3 font-medium">Product</th>
              <th className="px-6 py-3 font-medium">Type</th>
              <th className="px-6 py-3 font-medium">Qty</th>
              <th className="px-6 py-3 font-medium">Reason</th>
              <th className="px-6 py-3 font-medium">By</th>
            </tr>
          </thead>
          <tbody>
            {movements.length === 0 && (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-ink-soft">
                  No movements recorded yet.
                </td>
              </tr>
            )}
            {movements.map((m) => (
              <tr key={m.id} className="border-b border-ink/5 last:border-0 align-top">
                <td className="px-6 py-3 whitespace-nowrap text-ink-soft">
                  {new Date(m.createdAt).toLocaleString("en-PK", {
                    day: "numeric",
                    month: "short",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </td>
                <td className="px-6 py-3">
                  <Link href={`/admin/inventory?product=${m.productId}`} className="font-medium hover:text-chili">
                    {m.product.name}
                  </Link>
                  {m.product.sku && <span className="ml-1 text-xs text-ink-soft">({m.product.sku})</span>}
                </td>
                <td className="px-6 py-3">
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${typeStyles[m.type] ?? "bg-cream-dark"}`}>
                    {m.type}
                  </span>
                </td>
                <td className={`px-6 py-3 font-medium ${m.quantity < 0 ? "text-chili" : "text-basil-dark"}`}>
                  {m.quantity > 0 ? `+${m.quantity}` : m.quantity}
                </td>
                <td className="px-6 py-3 text-ink-soft">{m.reason ?? "—"}</td>
                <td className="px-6 py-3 text-ink-soft">{m.actorEmail ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-center gap-3 text-sm">
          {page > 1 && (
            <a href={pageQuery(page - 1)} className="rounded-full border border-ink/20 px-4 py-1.5 hover:bg-cream-dark">
              ← Newer
            </a>
          )}
          <span className="text-ink-soft">
            Page {page} of {totalPages}
          </span>
          {page < totalPages && (
            <a href={pageQuery(page + 1)} className="rounded-full border border-ink/20 px-4 py-1.5 hover:bg-cream-dark">
              Older →
            </a>
          )}
        </div>
      )}
    </div>
  );
}
