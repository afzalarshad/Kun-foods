import { prisma } from "@/lib/prisma";
import { calculateShipping as legacyFlatRateShipping } from "@/lib/format";

export async function getActiveShippingZones() {
  return prisma.shippingZone.findMany({
    where: { active: true },
    orderBy: { city: "asc" },
  });
}

/**
 * Authoritative shipping cost for an order. Looks up the city (case/whitespace
 * insensitive) among active shipping zones; if none are configured yet, or the
 * given city doesn't match any zone, falls back to the flat rate so checkout
 * never breaks before shipping zones are set up.
 */
export async function getShippingRate(city: string, subtotalAfterDiscount: number): Promise<number> {
  const zones = await getActiveShippingZones();
  if (zones.length === 0) return legacyFlatRateShipping(subtotalAfterDiscount);

  const normalized = city.trim().toLowerCase();
  const zone = zones.find((z) => z.city.toLowerCase() === normalized);
  if (!zone) return legacyFlatRateShipping(subtotalAfterDiscount);

  if (zone.freeAbove !== null && subtotalAfterDiscount >= zone.freeAbove) return 0;
  return zone.rate;
}
