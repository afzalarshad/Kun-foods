import Link from "next/link";

type QueueOrder = {
  id: string;
  orderNumber: string;
  priority: string;
  city: string;
  items: { name: string; sku: string | null; barcode: string | null; quantity: number; pickedQuantity: number }[];
  shipment: { courier: string; trackingNumber: string | null; status: string } | null;
};

const priorityStyles: Record<string, string> = {
  low: "bg-cream-dark text-ink-soft",
  normal: "bg-cream-dark text-ink",
  high: "bg-saffron/20 text-saffron-dark",
  urgent: "bg-chili/20 text-chili-dark",
};

export function WarehousePickList({ orders }: { orders: QueueOrder[] }) {
  if (orders.length === 0) {
    return <p className="rounded-3xl bg-white p-6 text-sm text-ink-soft shadow-sm">Nothing waiting to be picked — queue is empty.</p>;
  }

  return (
    <div className="flex flex-col gap-4">
      {orders.map((o) => {
        const totalUnits = o.items.reduce((sum, i) => sum + i.quantity, 0);
        const pickedUnits = o.items.reduce((sum, i) => sum + Math.min(i.pickedQuantity, i.quantity), 0);
        const fullyPicked = pickedUnits >= totalUnits;
        return (
          <Link
            key={o.id}
            href={`/admin/warehouse/${o.id}/pick`}
            className="block rounded-3xl bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-heading font-bold">#{o.orderNumber}</p>
                <p className="text-sm text-ink-soft">{o.city}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${priorityStyles[o.priority] ?? "bg-cream-dark"}`}>
                  {o.priority}
                </span>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${fullyPicked ? "bg-basil/20 text-basil-dark" : "bg-plum/20 text-plum"}`}
                >
                  {pickedUnits}/{totalUnits} picked
                </span>
              </div>
            </div>
            <ul className="mt-4 flex flex-col gap-1.5 border-t border-ink/10 pt-3">
              {o.items.map((item, i) => (
                <li key={i} className="flex items-center justify-between text-sm">
                  <span>{item.name}</span>
                  <span className="text-ink-soft">
                    {item.barcode ? (
                      <span className="font-mono text-xs">{item.barcode}</span>
                    ) : item.sku ? (
                      <span className="font-mono text-xs">{item.sku}</span>
                    ) : (
                      "no code"
                    )}{" "}
                    · {Math.min(item.pickedQuantity, item.quantity)}/{item.quantity}
                  </span>
                </li>
              ))}
            </ul>
          </Link>
        );
      })}
    </div>
  );
}
