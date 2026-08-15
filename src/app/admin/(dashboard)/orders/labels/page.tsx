import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/require-admin";
import { PrintButton } from "@/components/admin/print-button";
import { ShippingLabelCard } from "@/components/admin/shipping-label-card";
import { getSettings, SETTING_KEYS } from "@/lib/settings";

export default async function BulkShippingLabelsPage({
  searchParams,
}: {
  searchParams: Promise<{ ids?: string }>;
}) {
  await requirePermission("shipping.manage");
  const { ids } = await searchParams;
  const orderIds = (ids ?? "")
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean);

  const [orders, settings] = await Promise.all([
    orderIds.length > 0
      ? prisma.order.findMany({
          where: { id: { in: orderIds } },
          include: { items: true, shipment: true },
        })
      : Promise.resolve([]),
    getSettings(),
  ]);

  // Preserve the order the ids were selected in rather than DB return order.
  const byId = new Map(orders.map((o) => [o.id, o]));
  const ordered = orderIds.map((id) => byId.get(id)).filter((o): o is NonNullable<typeof o> => Boolean(o));

  const storeName = settings[SETTING_KEYS.storeName];
  const storeAddress = settings[SETTING_KEYS.storeAddress];
  const storePhone = settings[SETTING_KEYS.storePhone];

  const withShipment = ordered.filter((o) => o.shipment);
  const withoutShipment = ordered.filter((o) => !o.shipment);

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6 flex items-center justify-between print:hidden">
        <div>
          <h1 className="font-heading text-2xl font-bold">Shipping labels — {withShipment.length} order(s)</h1>
          {withoutShipment.length > 0 && (
            <p className="mt-1 text-sm text-chili-dark">
              {withoutShipment.length} selected order(s) have no courier booked yet and are skipped — book a courier
              first.
            </p>
          )}
        </div>
        {withShipment.length > 0 && <PrintButton />}
      </div>

      {ordered.length === 0 ? (
        <p className="rounded-3xl bg-white p-6 text-sm text-ink-soft shadow-sm print:hidden">
          No orders selected. Go back to the orders list, select some orders, and choose &ldquo;Print labels&rdquo;.
        </p>
      ) : withShipment.length === 0 ? (
        <p className="rounded-3xl bg-white p-6 text-sm text-ink-soft shadow-sm print:hidden">
          None of the selected orders have a courier booked yet.
        </p>
      ) : (
        <div className="flex flex-col gap-8 print:gap-0">
          {withShipment.map((order) => (
            <div key={order.id} className="break-after-page">
              <ShippingLabelCard order={order} storeName={storeName} storeAddress={storeAddress} storePhone={storePhone} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
