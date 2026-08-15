import { prisma } from "@/lib/prisma";
import { PromotionForm } from "@/components/admin/promotion-form";
import { createPromotion } from "@/app/admin/(dashboard)/promotions/actions";

export default async function NewPromotionPage() {
  const [categories, products] = await Promise.all([
    prisma.category.findMany({ orderBy: { name: "asc" } }),
    prisma.product.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ]);

  return (
    <div>
      <h1 className="font-heading text-3xl font-extrabold">Add promotion</h1>
      <p className="mt-1 text-ink-soft">
        Create an automatic discount — no code required at checkout.
      </p>
      <div className="mt-8">
        <PromotionForm action={createPromotion} categories={categories} products={products} />
      </div>
    </div>
  );
}
