import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { PromotionForm } from "@/components/admin/promotion-form";
import { updatePromotion } from "@/app/admin/(dashboard)/promotions/actions";

export default async function EditPromotionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [promotion, categories, products] = await Promise.all([
    prisma.promotion.findUnique({ where: { id } }),
    prisma.category.findMany({ orderBy: { name: "asc" } }),
    prisma.product.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ]);
  if (!promotion) notFound();

  const updateWithId = updatePromotion.bind(null, promotion.id);

  return (
    <div>
      <h1 className="font-heading text-3xl font-extrabold">Edit promotion</h1>
      <p className="mt-1 text-ink-soft">{promotion.name}</p>
      <div className="mt-8">
        <PromotionForm action={updateWithId} promotion={promotion} categories={categories} products={products} />
      </div>
    </div>
  );
}
