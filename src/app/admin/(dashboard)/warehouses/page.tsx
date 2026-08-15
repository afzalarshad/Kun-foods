import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/require-admin";
import { DeleteButton } from "@/components/admin/delete-button";
import { StockTransferForm } from "@/components/admin/stock-transfer-form";
import { deleteWarehouse } from "@/app/admin/(dashboard)/warehouses/actions";

export default async function WarehousesPage() {
  await requirePermission("warehouses.manage");

  const [warehouses, products, transfers] = await Promise.all([
    prisma.warehouse.findMany({
      include: {
        stockLevels: { select: { quantity: true } },
        _count: { select: { orders: true } },
      },
      orderBy: [{ isDefault: "desc" }, { name: "asc" }],
    }),
    prisma.product.findMany({ select: { id: true, name: true, sku: true }, orderBy: { name: "asc" } }),
    prisma.stockTransfer.findMany({
      include: { product: { select: { name: true } }, fromWarehouse: { select: { name: true } }, toWarehouse: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
  ]);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-3xl font-extrabold">Warehouses</h1>
          <p className="mt-1 text-ink-soft">
            {warehouses.length} location{warehouses.length === 1 ? "" : "s"} — each holds its own stock pool.
            Orders are automatically fulfilled from whichever location can cover the whole order, preferring a
            city match.
          </p>
        </div>
        <Link
          href="/admin/warehouses/new"
          className="rounded-full bg-chili px-5 py-2.5 font-heading font-semibold text-white hover:bg-chili-dark"
        >
          + Add warehouse
        </Link>
      </div>

      <div className="mt-8 overflow-x-auto rounded-3xl bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-ink/10 text-ink-soft">
              <th className="px-6 py-3 font-medium">Warehouse</th>
              <th className="px-6 py-3 font-medium">City</th>
              <th className="px-6 py-3 font-medium">Units in stock</th>
              <th className="px-6 py-3 font-medium">Orders fulfilled</th>
              <th className="px-6 py-3 font-medium">Status</th>
              <th className="px-6 py-3 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {warehouses.map((w) => {
              const totalUnits = w.stockLevels.reduce((sum, s) => sum + s.quantity, 0);
              return (
                <tr key={w.id} className="border-b border-ink/5 last:border-0">
                  <td className="px-6 py-3">
                    <span className="font-medium">{w.name}</span>
                    <span className="ml-2 font-mono text-xs text-ink-soft">{w.code}</span>
                    {w.isDefault && (
                      <span className="ml-2 rounded-full bg-plum/10 px-2 py-0.5 text-xs font-semibold text-plum">Default</span>
                    )}
                  </td>
                  <td className="px-6 py-3 text-ink-soft">{w.city}</td>
                  <td className="px-6 py-3">{totalUnits}</td>
                  <td className="px-6 py-3 text-ink-soft">{w._count.orders}</td>
                  <td className="px-6 py-3">
                    {w.active ? (
                      <span className="rounded-full bg-basil/20 px-3 py-1 text-xs font-semibold text-basil-dark">Active</span>
                    ) : (
                      <span className="rounded-full bg-cream-dark px-3 py-1 text-xs font-semibold">Inactive</span>
                    )}
                  </td>
                  <td className="px-6 py-3">
                    <div className="flex justify-end gap-3">
                      <Link href={`/admin/warehouses/${w.id}/edit`} className="font-medium text-basil hover:underline">
                        Edit
                      </Link>
                      <DeleteButton confirmMessage={`Delete "${w.name}"?`} action={deleteWarehouse.bind(null, w.id)} />
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {warehouses.length >= 2 && (
        <div className="mt-8 rounded-3xl bg-white p-6 shadow-sm">
          <h2 className="font-heading font-bold">Transfer stock between warehouses</h2>
          <p className="mt-1 text-sm text-ink-soft">
            Moves units from one location&apos;s pool to another — the cross-warehouse total for the product
            doesn&apos;t change, only where it&apos;s held.
          </p>
          <div className="mt-4">
            <StockTransferForm
              products={products}
              warehouses={warehouses.map((w) => ({ id: w.id, name: w.name }))}
            />
          </div>
        </div>
      )}

      {transfers.length > 0 && (
        <div className="mt-8">
          <h2 className="font-heading text-lg font-bold">Recent transfers</h2>
          <div className="mt-3 overflow-x-auto rounded-3xl bg-white shadow-sm">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-ink/10 text-ink-soft">
                  <th className="px-6 py-3 font-medium">When</th>
                  <th className="px-6 py-3 font-medium">Product</th>
                  <th className="px-6 py-3 font-medium">Qty</th>
                  <th className="px-6 py-3 font-medium">From</th>
                  <th className="px-6 py-3 font-medium">To</th>
                  <th className="px-6 py-3 font-medium">Reason</th>
                </tr>
              </thead>
              <tbody>
                {transfers.map((t) => (
                  <tr key={t.id} className="border-b border-ink/5 last:border-0">
                    <td className="px-6 py-3 whitespace-nowrap text-ink-soft">
                      {new Date(t.createdAt).toLocaleString("en-PK", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                    </td>
                    <td className="px-6 py-3">{t.product.name}</td>
                    <td className="px-6 py-3 font-medium">{t.quantity}</td>
                    <td className="px-6 py-3 text-ink-soft">{t.fromWarehouse.name}</td>
                    <td className="px-6 py-3 text-ink-soft">{t.toWarehouse.name}</td>
                    <td className="px-6 py-3 text-ink-soft">{t.reason ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
