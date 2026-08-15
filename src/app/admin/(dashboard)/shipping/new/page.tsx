import { ShippingZoneForm } from "@/components/admin/shipping-zone-form";
import { createShippingZone } from "@/app/admin/(dashboard)/shipping/actions";

export default function NewShippingZonePage() {
  return (
    <div>
      <h1 className="font-heading text-3xl font-extrabold">Add shipping rate</h1>
      <p className="mt-1 text-ink-soft">Set a delivery rate for a city or an entire province.</p>
      <div className="mt-8">
        <ShippingZoneForm action={createShippingZone} />
      </div>
    </div>
  );
}
