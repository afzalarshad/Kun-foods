import { calculateShipping } from "@/lib/format";
import { findPakistanCity } from "@/lib/pakistan-locations";

export type ShippingZonePreview = {
  scope: string;
  city: string | null;
  province: string | null;
  rate: number;
  freeAbove: number | null;
  excluded: boolean;
};

export type ShippingPreviewResult = { rate: number; excluded: boolean };

/** Client-safe shipping preview, mirroring the authoritative server-side getShippingRate(). */
export function getShippingForCity(
  zones: ShippingZonePreview[],
  city: string,
  subtotalAfterDiscount: number
): ShippingPreviewResult {
  const normalized = city.trim().toLowerCase();

  const cityZone = zones.find((z) => z.scope === "city" && z.city?.toLowerCase() === normalized);
  if (cityZone) {
    if (cityZone.excluded) return { rate: 0, excluded: true };
    const rate = cityZone.freeAbove !== null && subtotalAfterDiscount >= cityZone.freeAbove ? 0 : cityZone.rate;
    return { rate, excluded: false };
  }

  const cityInfo = findPakistanCity(city);
  const provinceZone = cityInfo
    ? zones.find((z) => z.scope === "province" && z.province === cityInfo.province)
    : undefined;
  if (provinceZone) {
    if (provinceZone.excluded) return { rate: 0, excluded: true };
    const rate =
      provinceZone.freeAbove !== null && subtotalAfterDiscount >= provinceZone.freeAbove ? 0 : provinceZone.rate;
    return { rate, excluded: false };
  }

  return { rate: calculateShipping(subtotalAfterDiscount), excluded: false };
}
