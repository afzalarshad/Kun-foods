import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ShippingZoneForm } from "@/components/admin/shipping-zone-form";
import { updateShippingZone } from "@/app/admin/(dashboard)/shipping/actions";

export default async function EditShippingZonePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const zone = await prisma.shippingZone.findUnique({ where: { id } });
  if (!zone) notFound();

  const updateWithId = updateShippingZone.bind(null, zone.id);

  return (
    <div>
      <h1 className="font-heading text-3xl font-extrabold">Edit city</h1>
      <p className="mt-1 text-ink-soft">{zone.city}</p>
      <div className="mt-8">
        <ShippingZoneForm action={updateWithId} zone={zone} />
      </div>
    </div>
  );
}
