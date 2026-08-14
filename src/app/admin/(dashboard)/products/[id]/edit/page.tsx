import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ProductForm } from "@/components/admin/product-form";
import { updateProduct } from "@/app/admin/(dashboard)/actions";

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [product, categories] = await Promise.all([
    prisma.product.findUnique({ where: { id } }),
    prisma.category.findMany({ orderBy: { name: "asc" } }),
  ]);

  if (!product) notFound();

  const updateWithId = updateProduct.bind(null, product.id);

  return (
    <div>
      <h1 className="font-heading text-3xl font-extrabold">Edit product</h1>
      <p className="mt-1 text-ink-soft">{product.name}</p>
      <div className="mt-8">
        <ProductForm action={updateWithId} categories={categories} product={product} />
      </div>
    </div>
  );
}
