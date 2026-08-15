import { getActiveShippingZones } from "@/lib/shipping";
import { CheckoutForm } from "@/components/checkout-form";

export const revalidate = 60;

export default async function CheckoutPage() {
  const zones = await getActiveShippingZones();

  return (
    <CheckoutForm
      zones={zones.map((z) => ({
        scope: z.scope,
        city: z.city,
        province: z.province,
        rate: z.rate,
        freeAbove: z.freeAbove,
        excluded: z.excluded,
      }))}
    />
  );
}
