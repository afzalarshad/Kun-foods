import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { ProductImage } from "@/components/product/product-image";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const recipe = await prisma.recipe.findUnique({ where: { slug } });
  if (!recipe || !recipe.published) return { title: "Recipe" };
  return { title: recipe.title, description: recipe.excerpt };
}

export default async function RecipeDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const recipe = await prisma.recipe.findUnique({ where: { slug } });
  if (!recipe || !recipe.published) notFound();

  return (
    <div className="mx-auto max-w-3xl px-4 py-14 sm:py-20">
      <Link href="/recipes" className="text-sm font-medium text-ink-soft hover:text-chili">
        ← All recipes
      </Link>

      <div className="mt-6 text-center">
        <ProductImage emoji={recipe.image || "🍛"} seed={recipe.slug} className="mx-auto h-24 w-24" size="text-5xl" />
        <h1 className="mt-6 font-heading text-4xl font-extrabold">{recipe.title}</h1>
        <p className="mx-auto mt-4 max-w-xl text-lg text-ink-soft">{recipe.excerpt}</p>
      </div>

      <div className="mt-12 whitespace-pre-wrap rounded-3xl bg-white p-8 leading-relaxed text-ink shadow-sm">
        {recipe.body}
      </div>

      <div className="mt-10 text-center">
        <Link
          href="/collections/all"
          className="btn-3d rounded-full bg-chili px-7 py-3.5 font-heading font-semibold text-white hover:bg-chili-dark"
        >
          Shop the ingredients
        </Link>
      </div>
    </div>
  );
}
