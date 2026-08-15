import { formatPrice } from "@/lib/format";
import { COURIER_LABELS } from "@/lib/providers/couriers";
import { QrCode } from "@/components/admin/qr-code";

type LabelOrder = {
  id: string;
  orderNumber: string;
  customerName: string;
  phone: string;
  address: string;
  city: string;
  postalCode: string | null;
  items: { id: string }[];
  shipment: {
    courier: string;
    trackingNumber: string | null;
    codAmount: number | null;
    weightGrams: number | null;
  } | null;
};

export function ShippingLabelCard({
  order,
  storeName,
  storeAddress,
  storePhone,
}: {
  order: LabelOrder;
  storeName: string;
  storeAddress: string;
  storePhone: string;
}) {
  const shipment = order.shipment;
  if (!shipment) return null;

  return (
    <div className="rounded-3xl border-2 border-ink bg-white p-8 print:rounded-none print:border-2">
      <div className="flex items-start justify-between border-b-2 border-dashed border-ink/20 pb-4">
        <div>
          <p className="font-heading text-xl font-extrabold">{COURIER_LABELS[shipment.courier as keyof typeof COURIER_LABELS] ?? shipment.courier}</p>
          <p className="mt-1 text-sm text-ink-soft">Booking / tracking #</p>
          <p className="font-mono text-lg font-bold">{shipment.trackingNumber ?? "—"}</p>
        </div>
        <div className="flex items-start gap-3">
          {shipment.codAmount !== null && shipment.codAmount > 0 && (
            <div className="rounded-2xl border-2 border-chili px-4 py-2 text-right">
              <p className="text-xs font-semibold uppercase tracking-wide text-chili-dark">Cash on delivery</p>
              <p className="font-heading text-xl font-bold text-chili-dark">{formatPrice(shipment.codAmount)}</p>
            </div>
          )}
          <QrCode data={`order:${order.id}`} size={72} />
        </div>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-ink-soft">From</p>
          <p className="mt-1 text-sm font-semibold">{storeName}</p>
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
  );
}
