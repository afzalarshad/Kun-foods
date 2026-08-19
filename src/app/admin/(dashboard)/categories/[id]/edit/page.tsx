import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { CategoryForm } from "@/components/admin/category-form";
import { updateCategory } from "@/app/admin/(dashboard)/categories/actions";

export default async function EditCategoryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const category = await prisma.category.findUnique({ where: { id } });
  if (!category) notFound();

  const updateWithId = updateCategory.bind(null, category.id);

  return (
    <div>
      <h1 className="font-heading text-3xl font-extrabold">Edit category</h1>
      <p className="mt-1 text-ink-soft">{category.name}</p>
      <div className="mt-8">
        <CategoryForm action={updateWithId} category={category} />
      </div>
    </div>
  );
}
