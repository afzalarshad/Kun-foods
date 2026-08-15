import { CategoryForm } from "@/components/admin/category-form";
import { createCategory } from "@/app/admin/(dashboard)/categories/actions";

export default function NewCategoryPage() {
  return (
    <div>
      <h1 className="font-heading text-3xl font-extrabold">Add category</h1>
      <p className="mt-1 text-ink-soft">Used for storefront navigation, product grouping, and reports.</p>
      <div className="mt-8">
        <CategoryForm action={createCategory} />
      </div>
    </div>
  );
}
