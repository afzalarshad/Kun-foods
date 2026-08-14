import { calculateShipping } from "@/lib/format";

export type ShippingZonePreview = { city: string; rate: number; freeAbove: number | null };

/** Client-safe shipping preview, mirroring the authoritative server-side getShippingRate(). */
export function getShippingForCity(
  zones: ShippingZonePreview[],
  city: string,
  subtotalAfterDiscount: number
): number {
  if (zones.length === 0) return calculateShipping(subtotalAfterDiscount);
  const zone = zones.find((z) => z.city.toLowerCase() === city.trim().toLowerCase());
  if (!zone) return calculateShipping(subtotalAfterDiscount);
  if (zone.freeAbove !== null && subtotalAfterDiscount >= zone.freeAbove) return 0;
  return zone.rate;
}
