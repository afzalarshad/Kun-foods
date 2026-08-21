import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/require-admin";
import { DeleteButton } from "@/components/admin/delete-button";
import { deleteRecipe } from "@/app/admin/(dashboard)/recipes/actions";

export default async function RecipesPage() {
  await requirePermission("content.manage");

  const recipes = await prisma.recipe.findMany({ orderBy: { createdAt: "desc" } });

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-3xl font-extrabold">Recipes</h1>
          <p className="mt-1 text-ink-soft">
            {recipes.length} recipe{recipes.length === 1 ? "" : "s"} — shown on the storefront at /recipes once published.
          </p>
        </div>
        <Link
          href="/admin/recipes/new"
          className="rounded-full bg-chili px-5 py-2.5 font-heading font-semibold text-white hover:bg-chili-dark"
        >
          + Add recipe
        </Link>
      </div>

      <div className="mt-8 overflow-x-auto rounded-3xl bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-ink/10 text-ink-soft">
              <th className="px-6 py-3 font-medium">Recipe</th>
              <th className="px-6 py-3 font-medium">Status</th>
              <th className="px-6 py-3 font-medium">Updated</th>
              <th className="px-6 py-3 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {recipes.length === 0 && (
              <tr>
                <td colSpan={4} className="px-6 py-8 text-center text-ink-soft">
                  No recipes yet.
                </td>
              </tr>
            )}
            {recipes.map((r) => (
              <tr key={r.id} className="border-b border-ink/5 last:border-0">
                <td className="px-6 py-3">
                  <span className="mr-2 text-lg">{r.image}</span>
                  <span className="font-medium">{r.title}</span>
                  <p className="mt-0.5 text-xs text-ink-soft">{r.excerpt}</p>
                </td>
                <td className="px-6 py-3">
                  {r.published ? (
                    <span className="rounded-full bg-basil/20 px-3 py-1 text-xs font-semibold text-basil-dark">Published</span>
                  ) : (
                    <span className="rounded-full bg-cream-dark px-3 py-1 text-xs font-semibold">Draft</span>
                  )}
                </td>
                <td className="px-6 py-3 text-ink-soft">
                  {new Date(r.updatedAt).toLocaleDateString("en-PK", { day: "numeric", month: "short", year: "numeric" })}
                </td>
                <td className="px-6 py-3">
                  <div className="flex justify-end gap-3">
                    <Link href={`/admin/recipes/${r.id}/edit`} className="font-medium text-basil hover:underline">
                      Edit
                    </Link>
                    <DeleteButton confirmMessage={`Delete "${r.title}"?`} action={deleteRecipe.bind(null, r.id)} />
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
