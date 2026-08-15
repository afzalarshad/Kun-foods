import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAnyPermission } from "@/lib/require-admin";
import { WarehousePickScanner } from "@/components/admin/warehouse-pick-scanner";

export default async function WarehousePickOrderPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAnyPermission(["warehouse.pick", "warehouse.pack"]);
  const { id } = await params;

  const order = await prisma.order.findUnique({
    where: { id },
    include: { items: { include: { product: { select: { sku: true, barcode: true } } } } },
  });
  if (!order) notFound();

  return (
    <div className="max-w-2xl">
      <Link href="/admin/warehouse" className="text-sm font-semibold text-ink-soft hover:text-chili">
        ← Back to queue
      </Link>
      <h1 className="mt-2 font-heading text-3xl font-extrabold">Pick order #{order.orderNumber}</h1>
      <p className="mt-1 text-ink-soft">
        {order.city} · {order.customerName}
      </p>

      {order.status !== "processing" ? (
        <p className="mt-8 rounded-3xl bg-white p-6 text-sm text-ink-soft shadow-sm">
          This order is &ldquo;{order.status}&rdquo;, not ready to pick.
        </p>
      ) : (
        <div className="mt-8">
          <WarehousePickScanner
            orderId={order.id}
            items={order.items.map((item) => ({
              id: item.id,
              name: item.name,
              sku: item.product?.sku ?? null,
              barcode: item.product?.barcode ?? null,
              quantity: item.quantity,
              pickedQuantity: item.pickedQuantity,
            }))}
          />
        </div>
      )}
    </div>
  );
}
