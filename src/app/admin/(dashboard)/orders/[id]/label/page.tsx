import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { formatPrice } from "@/lib/format";
import { requirePermission } from "@/lib/require-admin";
import { PrintButton } from "@/components/admin/print-button";

const courierLabels: Record<string, string> = {
  leopards: "Leopards Courier",
  tcs: "TCS",
  postex: "PostEx",
  manual: "Manual / own rider",
};

export default async function ShippingLabelPage({ params }: { params: Promise<{ id: string }> }) {
  await requirePermission("shipping.manage");
  const { id } = await params;

  const order = await prisma.order.findUnique({
    where: { id },
    include: { items: true, shipment: true },
  });
  if (!order || !order.shipment) notFound();

  const shipment = order.shipment;
  const storeAddress = process.env.STORE_ADDRESS || "Kun Foods, Main Boulevard, Lahore, Pakistan";
  const storePhone = process.env.STORE_PHONE || "";

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6 flex items-center justify-between print:hidden">
        <h1 className="font-heading text-2xl font-bold">Shipping label — #{order.orderNumber}</h1>
        <PrintButton />
      </div>

      <div className="rounded-3xl border-2 border-ink bg-white p-8 print:rounded-none print:border-2">
        <div className="flex items-start justify-between border-b-2 border-dashed border-ink/20 pb-4">
          <div>
            <p className="font-heading text-xl font-extrabold">{courierLabels[shipment.courier] ?? shipment.courier}</p>
            <p className="mt-1 text-sm text-ink-soft">Booking / tracking #</p>
            <p className="font-mono text-lg font-bold">{shipment.trackingNumber ?? "—"}</p>
          </div>
          {shipment.codAmount !== null && shipment.codAmount > 0 && (
            <div className="rounded-2xl border-2 border-chili px-4 py-2 text-right">
              <p className="text-xs font-semibold uppercase tracking-wide text-chili-dark">Cash on delivery</p>
              <p className="font-heading text-xl font-bold text-chili-dark">{formatPrice(shipment.codAmount)}</p>
            </div>
          )}
        </div>

        <div className="mt-6 grid grid-cols-2 gap-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-ink-soft">From</p>
            <p className="mt-1 text-sm font-semibold">Kun Foods</p>
            <p className="text-sm text-ink-soft">{storeAddress}</p>
            {storePhone && <p className="text-sm text-ink-soft">{storePhone}</p>}
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-ink-soft">To</p>
            <p className="mt-1 text-sm font-semibold">{order.customerName}</p>
            <p className="text-sm text-ink-soft">{order.phone}</p>
            <p className="text-sm text-ink-soft">{order.address}</p>
            <p className="text-sm text-ink-soft">
              {order.city}
              {order.postalCode ? `, ${order.postalCode}` : ""}
            </p>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-between border-t-2 border-dashed border-ink/20 pt-4 text-sm text-ink-soft">
          <span>Order #{order.orderNumber}</span>
          <span>{order.items.length} item(s)</span>
          {shipment.weightGrams && <span>{shipment.weightGrams}g</span>}
        </div>
      </div>
    </div>
  );
}
