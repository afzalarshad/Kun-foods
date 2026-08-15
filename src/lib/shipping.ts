import { prisma } from "@/lib/prisma";
import { calculateShipping as legacyFlatRateShipping } from "@/lib/format";
import { findPakistanCity } from "@/lib/pakistan-locations";

export class ShippingError extends Error {}

export async function getActiveShippingZones() {
  return prisma.shippingZone.findMany({
    where: { active: true },
    orderBy: [{ scope: "asc" }, { city: "asc" }, { province: "asc" }],
  });
}

/**
 * Authoritative shipping cost for an order. Resolution order:
 * 1. An exact city-scoped zone always wins (even over a province-level exclusion — lets a
 *    specific city be re-opened even if its whole province is otherwise excluded).
 * 2. Otherwise, a province-scoped zone for the city's province (via the Pakistan city
 *    reference data) applies.
 * 3. Otherwise, falls back to the flat rate so checkout never breaks before zones are set up.
 * Throws ShippingError if the resolved zone is marked `excluded` — callers must surface this
 * as a user-facing "we don't deliver there" message, not a generic failure.
 */
export async function getShippingRate(city: string, subtotalAfterDiscount: number): Promise<number> {
  const zones = await getActiveShippingZones();
  const normalized = city.trim().toLowerCase();

  const cityZone = zones.find((z) => z.scope === "city" && z.city?.toLowerCase() === normalized);
  if (cityZone) {
    if (cityZone.excluded) throw new ShippingError(`Sorry, we don't currently deliver to ${city}.`);
    if (cityZone.freeAbove !== null && subtotalAfterDiscount >= cityZone.freeAbove) return 0;
    return cityZone.rate;
  }

  const cityInfo = findPakistanCity(city);
  const provinceZone = cityInfo
    ? zones.find((z) => z.scope === "province" && z.province === cityInfo.province)
    : undefined;
  if (provinceZone) {
    if (provinceZone.excluded) throw new ShippingError(`Sorry, we don't currently deliver to ${city}.`);
    if (provinceZone.freeAbove !== null && subtotalAfterDiscount >= provinceZone.freeAbove) return 0;
    return provinceZone.rate;
  }

  return legacyFlatRateShipping(subtotalAfterDiscount);
}
