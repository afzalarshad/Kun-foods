import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/require-admin";
import { PrintButton } from "@/components/admin/print-button";
import { getSettings, SETTING_KEYS } from "@/lib/settings";
import { ShippingLabelCard } from "@/components/admin/shipping-label-card";

export default async function ShippingLabelPage({ params }: { params: Promise<{ id: string }> }) {
  await requirePermission("shipping.manage");
  const { id } = await params;

  const [order, settings] = await Promise.all([
    prisma.order.findUnique({
      where: { id },
      include: { items: true, shipment: true },
    }),
    getSettings(),
  ]);
  if (!order || !order.shipment) notFound();

  const storeName = settings[SETTING_KEYS.storeName];
  const storeAddress = settings[SETTING_KEYS.storeAddress];
  const storePhone = settings[SETTING_KEYS.storePhone];

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6 flex items-center justify-between print:hidden">
        <h1 className="font-heading text-2xl font-bold">Shipping label — #{order.orderNumber}</h1>
        <PrintButton />
      </div>

      <ShippingLabelCard order={order} storeName={storeName} storeAddress={storeAddress} storePhone={storePhone} />
    </div>
  );
}
