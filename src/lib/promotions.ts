import { prisma } from "@/lib/prisma";
import { matchesSegment, SEGMENTS, type SegmentId } from "@/lib/segments";
import type { Promotion } from "@prisma/client";

export type PromoLineItem = { type: "product" | "bundle"; id: string; quantity: number };

/** Just the fields the engine needs from a Product row. */
export type PromoProduct = { id: string; price: number; categoryId: string };

export type AppliedPromotion = { id: string; name: string; discount: number };

export async function getActivePromotions(now: Date = new Date()): Promise<Promotion[]> {
  return prisma.promotion.findMany({
    where: {
      active: true,
      AND: [
        { OR: [{ startsAt: null }, { startsAt: { lte: now } }] },
        { OR: [{ endsAt: null }, { endsAt: { gte: now } }] },
      ],
    },
    orderBy: { priority: "asc" },
  });
}

/** Which of the 10 dynamic segments (src/lib/segments.ts) this customer currently belongs to. */
export async function resolveCustomerSegments(email: string | undefined): Promise<Set<SegmentId>> {
  const result = new Set<SegmentId>();
  if (!email) return result;
  const customer = await prisma.customer.findUnique({
    where: { email },
    include: { tags: true, orders: { include: { returns: true } } },
  });
  if (!customer) return result;
  for (const s of SEGMENTS) {
    if (matchesSegment(customer, s.id)) result.add(s.id);
  }
  return result;
}

/**
 * Pure discount calculation — no DB access — so it can be unit-tested and reused between
 * the live storefront/POS preview endpoint and the authoritative calculation in createOrder.
 * All matching promotions stack (each computed against its own eligible slice, capped in
 * total at `subtotal`); it's on the admin to avoid overlapping promotions that double-discount
 * the same items if that's not intended.
 */
export function computePromotionDiscount({
  promotions,
  items,
  productMap,
  subtotal,
  customerSegments,
}: {
  promotions: Promotion[];
  items: PromoLineItem[];
  productMap: Map<string, PromoProduct>;
  subtotal: number;
  customerSegments: Set<SegmentId>;
}): { discount: number; applied: AppliedPromotion[] } {
  const applied: AppliedPromotion[] = [];
  let total = 0;

  for (const promo of promotions) {
    if (promo.segment && !customerSegments.has(promo.segment as SegmentId)) continue;

    let promoDiscount = 0;

    if (promo.type === "bogo") {
      if (promo.scope !== "product" || !promo.productId) continue;
      const item = items.find((i) => i.type === "product" && i.id === promo.productId);
      const product = productMap.get(promo.productId);
      if (!item || !product) continue;
      const buy = promo.buyQuantity ?? 1;
      const get = promo.getQuantity ?? 1;
      const groups = Math.floor(item.quantity / (buy + get));
      const freeUnits = groups * get;
      if (freeUnits <= 0) continue;
      const pct = promo.getDiscountPercent ?? 100;
      promoDiscount = Math.round(product.price * freeUnits * (pct / 100));
    } else {
      let eligibleSubtotal = 0;
      if (promo.scope === "all") {
        eligibleSubtotal = subtotal;
      } else if (promo.scope === "category" && promo.categoryId) {
        eligibleSubtotal = items
          .filter((i) => i.type === "product" && productMap.get(i.id)?.categoryId === promo.categoryId)
          .reduce((sum, i) => sum + (productMap.get(i.id)?.price ?? 0) * i.quantity, 0);
      } else if (promo.scope === "product" && promo.productId) {
        const item = items.find((i) => i.type === "product" && i.id === promo.productId);
        if (item) eligibleSubtotal = (productMap.get(promo.productId)?.price ?? 0) * item.quantity;
      }
      if (eligibleSubtotal <= 0) continue;

      if (promo.type === "percentage_off") {
        promoDiscount = Math.round((eligibleSubtotal * (promo.value ?? 0)) / 100);
      } else if (promo.type === "fixed_off") {
        promoDiscount = Math.min(promo.value ?? 0, eligibleSubtotal);
      }
    }

    if (promoDiscount > 0) {
      applied.push({ id: promo.id, name: promo.name, discount: promoDiscount });
      total += promoDiscount;
    }
  }

  return { discount: Math.min(total, subtotal), applied };
}

/** Convenience wrapper: fetches active promotions + customer segments, then computes the discount. */
export async function computePromotionsForCart({
  items,
  productMap,
  subtotal,
  email,
}: {
  items: PromoLineItem[];
  productMap: Map<string, PromoProduct>;
  subtotal: number;
  email: string | undefined;
}): Promise<{ discount: number; applied: AppliedPromotion[] }> {
  if (subtotal <= 0 || items.length === 0) return { discount: 0, applied: [] };
  const [promotions, customerSegments] = await Promise.all([
    getActivePromotions(),
    resolveCustomerSegments(email),
  ]);
  if (promotions.length === 0) return { discount: 0, applied: [] };
  return computePromotionDiscount({ promotions, items, productMap, subtotal, customerSegments });
}
