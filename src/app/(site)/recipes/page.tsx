import Link from "next/link";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { ProductImage } from "@/components/product/product-image";

export const metadata: Metadata = {
  title: "Recipes",
  description: "Recipes from the Kun Foods kitchen — made with our spices, pickles, and pantry staples.",
};

export default async function RecipesPage() {
  const recipes = await prisma.recipe.findMany({
    where: { published: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="mx-auto max-w-6xl px-4 py-14 sm:py-20">
      <div className="text-center">
        <h1 className="font-heading text-4xl font-extrabold">Recipes</h1>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-ink-soft">
          What to actually cook with what&apos;s in your pantry — straight from our kitchen to yours.
        </p>
      </div>

      {recipes.length === 0 ? (
        <p className="mt-14 text-center text-ink-soft">New recipes are on the way — check back soon.</p>
      ) : (
        <div className="mt-14 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {recipes.map((recipe) => (
            <Link
              key={recipe.id}
              href={`/recipes/${recipe.slug}`}
              className="group flex flex-col overflow-hidden rounded-3xl bg-white shadow-sm transition-shadow duration-200 hover:shadow-xl"
            >
              <ProductImage
                emoji={recipe.image || "🍛"}
                seed={recipe.slug}
                shape="circle"
                size="text-5xl"
                className="h-44 w-full rounded-none group-hover:scale-[1.02] transition-transform duration-200"
              />
              <div className="flex flex-1 flex-col p-5">
                <h2 className="font-heading text-lg font-bold group-hover:text-chili">{recipe.title}</h2>
                <p className="mt-2 flex-1 text-sm text-ink-soft">{recipe.excerpt}</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
