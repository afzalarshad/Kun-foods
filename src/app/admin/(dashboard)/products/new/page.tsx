import { prisma } from "@/lib/prisma";
import { ProductForm } from "@/components/admin/product-form";
import { createProduct } from "@/app/admin/(dashboard)/actions";

export default async function NewProductPage() {
  const categories = await prisma.category.findMany({ orderBy: { name: "asc" } });

  return (
    <div>
      <h1 className="font-heading text-3xl font-extrabold">Add product</h1>
      <p className="mt-1 text-ink-soft">Create a new product for the storefront.</p>
      <div className="mt-8">
        <ProductForm action={createProduct} categories={categories} />
      </div>
    </div>
  );
}
