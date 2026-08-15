import { prisma } from "@/lib/prisma";
import { requireAnyPermission } from "@/lib/require-admin";
import { PrintButton } from "@/components/admin/print-button";

export default async function WarehousePickListPrintPage({
  searchParams,
}: {
  searchParams: Promise<{ warehouse?: string }>;
}) {
  await requireAnyPermission(["warehouse.pick", "warehouse.pack"]);
  const { warehouse: warehouseFilter } = await searchParams;

  const orders = await prisma.order.findMany({
    where: { status: "processing", ...(warehouseFilter ? { warehouseId: warehouseFilter } : {}) },
    include: {
      items: { include: { product: { select: { sku: true, barcode: true } } } },
    },
    orderBy: [{ priority: "desc" }, { createdAt: "asc" }],
  });

  const consolidated = new Map<string, { name: string; sku: string | null; barcode: string | null; quantity: number }>();
  for (const order of orders) {
    for (const item of order.items) {
      const key = item.product?.barcode ?? item.product?.sku ?? item.name;
      const existing = consolidated.get(key);
      if (existing) {
        existing.quantity += item.quantity;
      } else {
        consolidated.set(key, {
          name: item.name,
          sku: item.product?.sku ?? null,
          barcode: item.product?.barcode ?? null,
          quantity: item.quantity,
        });
      }
    }
  }
  const consolidatedRows = [...consolidated.values()].sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6 flex items-center justify-between print:hidden">
        <div>
          <h1 className="font-heading text-2xl font-bold">Pick list — {orders.length} order(s)</h1>
          <p className="mt-1 text-sm text-ink-soft">Generated {new Date().toLocaleString("en-PK")}</p>
        </div>
        <PrintButton />
      </div>

      {orders.length === 0 ? (
        <p className="rounded-3xl bg-white p-6 text-sm text-ink-soft shadow-sm print:hidden">
          Nothing waiting to be picked — queue is empty.
        </p>
      ) : (
        <>
          <div className="rounded-3xl border-2 border-ink bg-white p-6 print:rounded-none print:border-2">
            <h2 className="font-heading font-bold">Consolidated pick totals</h2>
            <table className="mt-3 w-full text-left text-sm">
              <thead>
                <tr className="border-b border-ink/10 text-ink-soft">
                  <th className="py-2 pr-4 font-medium">Item</th>
                  <th className="py-2 pr-4 font-medium">Code</th>
                  <th className="py-2 pr-4 font-medium text-right">Qty to pick</th>
                </tr>
              </thead>
              <tbody>
                {consolidatedRows.map((row, i) => (
                  <tr key={i} className="border-b border-ink/5 last:border-0">
                    <td className="py-2 pr-4">{row.name}</td>
                    <td className="py-2 pr-4 font-mono text-xs text-ink-soft">{row.barcode ?? row.sku ?? "—"}</td>
                    <td className="py-2 pr-4 text-right font-semibold">{row.quantity}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-6 flex flex-col gap-4 print:mt-4">
            {orders.map((order) => (
              <div
                key={order.id}
                className="break-inside-avoid rounded-3xl border-2 border-ink/20 bg-white p-5 print:rounded-none print:border print:border-ink/40"
              >
                <div className="flex items-center justify-between">
                  <p className="font-heading font-bold">#{order.orderNumber}</p>
                  <span className="rounded-full bg-cream-dark px-2.5 py-0.5 text-xs font-semibold capitalize">{order.priority}</span>
                </div>
                <p className="text-xs text-ink-soft">{order.city}</p>
                <ul className="mt-3 flex flex-col gap-1 border-t border-ink/10 pt-2">
                  {order.items.map((item) => (
                    <li key={item.id} className="flex items-center justify-between text-sm">
                      <span>{item.name}</span>
                      <span className="font-mono text-xs text-ink-soft">
                        {item.product?.barcode ?? item.product?.sku ?? "no code"} · ×{item.quantity}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
