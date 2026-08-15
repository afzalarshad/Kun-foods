import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireAnyPermission } from "@/lib/require-admin";
import { WarehousePickList } from "@/components/admin/warehouse-pick-list";

export default async function WarehousePage({
  searchParams,
}: {
  searchParams: Promise<{ warehouse?: string }>;
}) {
  await requireAnyPermission(["warehouse.pick", "warehouse.pack"]);
  const { warehouse: warehouseFilter } = await searchParams;

  const [orders, warehouses] = await Promise.all([
    prisma.order.findMany({
      where: { status: "processing", ...(warehouseFilter ? { warehouseId: warehouseFilter } : {}) },
      include: {
        items: { include: { product: { select: { sku: true, barcode: true } } } },
        shipment: { select: { courier: true, trackingNumber: true, status: true } },
      },
      orderBy: [{ priority: "desc" }, { createdAt: "asc" }],
    }),
    prisma.warehouse.findMany({ where: { active: true }, orderBy: [{ isDefault: "desc" }, { name: "asc" } ] }),
  ]);

  const queue = orders.map((o) => ({
    id: o.id,
    orderNumber: o.orderNumber,
    priority: o.priority,
    city: o.city,
    items: o.items.map((item) => ({
      name: item.name,
      sku: item.product?.sku ?? null,
      barcode: item.product?.barcode ?? null,
      quantity: item.quantity,
      pickedQuantity: item.pickedQuantity,
    })),
    shipment: o.shipment,
  }));

  return (
    <div className="max-w-3xl">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-heading text-3xl font-extrabold">Warehouse pick queue</h1>
          <p className="mt-1 text-ink-soft">
            Orders confirmed and ready to pick, pack, and hand off to a courier. Also available as an API
            (<code className="rounded bg-cream-dark px-1.5 py-0.5 text-xs">/api/warehouse/*</code>) for a future
            barcode-scanner app.
          </p>
        </div>
        {queue.length > 0 && (
          <Link
            href={`/admin/warehouse/print${warehouseFilter ? `?warehouse=${warehouseFilter}` : ""}`}
            target="_blank"
            className="shrink-0 rounded-full bg-ink px-5 py-2.5 text-sm font-heading font-semibold text-cream hover:bg-ink/90"
          >
            🖨️ Print pick list ({queue.length})
          </Link>
        )}
      </div>

      {warehouses.length >= 2 && (
        <div className="mt-4 flex flex-wrap gap-1.5">
          <Link
            href="/admin/warehouse"
            className={`rounded-full px-3 py-1.5 text-sm font-medium ${!warehouseFilter ? "bg-ink text-cream" : "bg-white hover:bg-cream-dark"}`}
          >
            All warehouses
          </Link>
          {warehouses.map((w) => (
            <Link
              key={w.id}
              href={`/admin/warehouse?warehouse=${w.id}`}
              className={`rounded-full px-3 py-1.5 text-sm font-medium ${warehouseFilter === w.id ? "bg-ink text-cream" : "bg-white hover:bg-cream-dark"}`}
            >
              {w.name}
            </Link>
          ))}
        </div>
      )}

      <div className="mt-8">
        <WarehousePickList orders={queue} />
      </div>
    </div>
  );
}
