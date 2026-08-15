import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { computePromotionsForCart } from "@/lib/promotions";

const previewSchema = z.object({
  items: z
    .array(
      z.object({
        type: z.enum(["product", "bundle"]),
        id: z.string(),
        quantity: z.number().int().min(1).max(500),
      })
    )
    .min(1),
  email: z.string().email().optional(),
});

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = previewSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ discount: 0, applied: [] });

  const { items, email } = parsed.data;
  const productIds = items.filter((i) => i.type === "product").map((i) => i.id);
  const bundleIds = items.filter((i) => i.type === "bundle").map((i) => i.id);

  const [products, bundles] = await Promise.all([
    productIds.length ? prisma.product.findMany({ where: { id: { in: productIds } } }) : Promise.resolve([]),
    bundleIds.length ? prisma.bundle.findMany({ where: { id: { in: bundleIds } } }) : Promise.resolve([]),
  ]);

  const productMap = new Map(products.map((p) => [p.id, { id: p.id, price: p.price, categoryId: p.categoryId }]));
  const bundlePriceMap = new Map(bundles.map((b) => [b.id, b.price]));

  const subtotal = items.reduce((sum, item) => {
    const unitPrice = item.type === "product" ? (productMap.get(item.id)?.price ?? 0) : (bundlePriceMap.get(item.id) ?? 0);
    return sum + unitPrice * item.quantity;
  }, 0);

  const { discount, applied } = await computePromotionsForCart({ items, productMap, subtotal, email });

  return NextResponse.json({ subtotal, discount, applied });
}
