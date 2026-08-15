import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/require-admin";
import { DeleteButton } from "@/components/admin/delete-button";
import { deleteCategory } from "@/app/admin/(dashboard)/categories/actions";

export default async function CategoriesPage() {
  await requirePermission("products.manage");

  const categories = await prisma.category.findMany({
    include: { _count: { select: { products: true } } },
    orderBy: { name: "asc" },
  });

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-3xl font-extrabold">Categories</h1>
          <p className="mt-1 text-ink-soft">
            {categories.length} categor{categories.length === 1 ? "y" : "ies"} — used for storefront navigation,
            product grouping, and reports.
          </p>
        </div>
        <Link
          href="/admin/categories/new"
          className="rounded-full bg-chili px-5 py-2.5 font-heading font-semibold text-white hover:bg-chili-dark"
        >
          + Add category
        </Link>
      </div>

      <div className="mt-8 overflow-x-auto rounded-3xl bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-ink/10 text-ink-soft">
              <th className="px-6 py-3 font-medium">Category</th>
              <th className="px-6 py-3 font-medium">Products</th>
              <th className="px-6 py-3 font-medium">Status</th>
              <th className="px-6 py-3 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {categories.length === 0 && (
              <tr>
                <td colSpan={4} className="px-6 py-8 text-center text-ink-soft">
                  No categories yet.
                </td>
              </tr>
            )}
            {categories.map((c) => (
              <tr key={c.id} className="border-b border-ink/5 last:border-0">
                <td className="px-6 py-3">
                  <span className="mr-2 text-lg">{c.image}</span>
                  <span className="font-medium">{c.name}</span>
                  {c.description && <p className="mt-0.5 text-xs text-ink-soft">{c.description}</p>}
                </td>
                <td className="px-6 py-3">{c._count.products}</td>
                <td className="px-6 py-3">
                  {c.active ? (
                    <span className="rounded-full bg-basil/20 px-3 py-1 text-xs font-semibold text-basil-dark">Active</span>
                  ) : (
                    <span className="rounded-full bg-cream-dark px-3 py-1 text-xs font-semibold">Inactive</span>
                  )}
                </td>
                <td className="px-6 py-3">
                  <div className="flex justify-end gap-3">
                    <Link href={`/admin/categories/${c.id}/edit`} className="font-medium text-basil hover:underline">
                      Edit
                    </Link>
                    <DeleteButton confirmMessage={`Delete "${c.name}"?`} action={deleteCategory.bind(null, c.id)} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
