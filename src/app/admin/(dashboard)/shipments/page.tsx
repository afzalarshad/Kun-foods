import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/require-admin";
import { formatPrice } from "@/lib/format";
import { PrintButton } from "@/components/admin/print-button";
import { ScanDispatchWidget } from "@/components/admin/scan-dispatch-widget";
import { CustomerNameLink } from "@/components/admin/customer-name-link";
import { COURIERS, getCourierAdapter } from "@/lib/providers/couriers";

const couriers = COURIERS.map((c) => c.id);
const statuses = ["pending", "booked", "picked_up", "in_transit", "delivered", "returned"] as const;

const statusStyles: Record<string, string> = {
  pending: "bg-cream-dark text-ink-soft",
  booked: "bg-saffron/20 text-saffron-dark",
  picked_up: "bg-plum/20 text-plum",
  in_transit: "bg-plum/20 text-plum",
  delivered: "bg-basil/20 text-basil-dark",
  returned: "bg-chili/20 text-chili-dark",
};

const courierLabels: Record<string, string> = {
  leopards: "Leopards",
  tcs: "TCS",
  postex: "PostEx",
  manual: "Manual",
};

export default async function ShipmentsPage({
  searchParams,
}: {
  searchParams: Promise<{ courier?: string; status?: string }>;
}) {
  await requirePermission("shipping.manage");
  const { courier, status } = await searchParams;

  const where = {
    ...(courier ? { courier } : {}),
    ...(status ? { status } : {}),
  };

  const shipments = await prisma.shipment.findMany({
    where,
    include: { order: { select: { orderNumber: true, customerId: true, customerName: true, city: true, total: true } } },
    orderBy: { createdAt: "desc" },
  });

  const linkQuery = (overrides: { courier?: string; status?: string }) => {
    const params = new URLSearchParams();
    const c = "courier" in overrides ? overrides.courier : courier;
    const s = "status" in overrides ? overrides.status : status;
    if (c) params.set("courier", c);
    if (s) params.set("status", s);
    const qs = params.toString();
    return qs ? `/admin/shipments?${qs}` : "/admin/shipments";
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4 print:hidden">
        <div>
          <h1 className="font-heading text-3xl font-extrabold">Shipments</h1>
          <p className="mt-1 text-ink-soft">{shipments.length} booking(s){courier ? ` · ${courierLabels[courier]}` : ""}</p>
        </div>
        <PrintButton />
      </div>

      <div className="mt-6 print:hidden">
        <ScanDispatchWidget />
      </div>

      <div className="mt-6 flex flex-wrap gap-4 print:hidden">
        <div className="flex flex-wrap gap-1.5">
          <Link
            href={linkQuery({ courier: undefined })}
            className={`rounded-full px-3 py-1.5 text-sm font-medium ${!courier ? "bg-ink text-cream" : "bg-white hover:bg-cream-dark"}`}
          >
            All couriers
          </Link>
          {couriers.map((c) => (
            <Link
              key={c}
              href={linkQuery({ courier: c })}
              className={`rounded-full px-3 py-1.5 text-sm font-medium ${courier === c ? "bg-ink text-cream" : "bg-white hover:bg-cream-dark"}`}
            >
              {courierLabels[c]}
            </Link>
          ))}
        </div>
        <div className="flex flex-wrap gap-1.5">
          <Link
            href={linkQuery({ status: undefined })}
            className={`rounded-full px-3 py-1.5 text-sm font-medium capitalize ${!status ? "bg-ink text-cream" : "bg-white hover:bg-cream-dark"}`}
          >
            All statuses
          </Link>
          {statuses.map((s) => (
            <Link
              key={s}
              href={linkQuery({ status: s })}
              className={`rounded-full px-3 py-1.5 text-sm font-medium capitalize ${status === s ? "bg-ink text-cream" : "bg-white hover:bg-cream-dark"}`}
            >
              {s.replace("_", " ")}
            </Link>
          ))}
        </div>
      </div>

      <div className="mt-6 overflow-x-auto rounded-3xl bg-white shadow-sm print:rounded-none print:shadow-none">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-ink/10 text-ink-soft">
              <th className="px-6 py-3 font-medium">Order</th>
              <th className="px-6 py-3 font-medium">Customer</th>
              <th className="px-6 py-3 font-medium">City</th>
              <th className="px-6 py-3 font-medium">Courier</th>
              <th className="px-6 py-3 font-medium">Tracking #</th>
              <th className="px-6 py-3 font-medium">COD</th>
              <th className="px-6 py-3 font-medium">Status</th>
              <th className="px-6 py-3 font-medium print:hidden">Track</th>
            </tr>
          </thead>
          <tbody>
            {shipments.length === 0 && (
              <tr>
                <td colSpan={8} className="px-6 py-8 text-center text-ink-soft">
                  No shipments booked yet.
                </td>
              </tr>
            )}
            {shipments.map((s) => {
              const trackingUrl = s.trackingNumber ? getCourierAdapter(s.courier).trackingUrl(s.trackingNumber) : null;
              return (
                <tr key={s.id} className="border-b border-ink/5 last:border-0">
                  <td className="px-6 py-3">
                    <Link href={`/admin/orders/${s.orderId}`} className="font-medium hover:text-chili print:text-ink">
                      #{s.order.orderNumber}
                    </Link>
                  </td>
                  <td className="px-6 py-3">
                    <CustomerNameLink customerId={s.order.customerId} customerName={s.order.customerName} />
                  </td>
                  <td className="px-6 py-3 text-ink-soft">{s.order.city}</td>
                  <td className="px-6 py-3">{courierLabels[s.courier] ?? s.courier}</td>
                  <td className="px-6 py-3 font-mono text-xs">{s.trackingNumber ?? "—"}</td>
                  <td className="px-6 py-3">{s.codAmount ? formatPrice(s.codAmount) : "—"}</td>
                  <td className="px-6 py-3">
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${statusStyles[s.status] ?? "bg-cream-dark"}`}>
                      {s.status.replace("_", " ")}
                    </span>
                  </td>
                  <td className="px-6 py-3 print:hidden">
                    {trackingUrl ? (
                      <Link
                        href={trackingUrl}
                        target="_blank"
                        className="rounded-full border border-ink/20 px-2.5 py-1 text-xs font-semibold hover:bg-cream-dark"
                      >
                        Track ↗
                      </Link>
                    ) : (
                      <span className="text-ink-soft">—</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
