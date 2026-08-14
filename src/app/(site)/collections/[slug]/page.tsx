import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ProductCard } from "@/components/product/product-card";
import { SortSelect } from "@/components/product/sort-select";
import { ProductImage } from "@/components/product/product-image";
import {
  getAllProducts,
  getCategories,
  getCategoryBySlug,
  getProductsByCategory,
} from "@/lib/data";
import type { ProductCard as ProductCardType } from "@/lib/types";

export const revalidate = 60;

export async function generateStaticParams() {
  const categories = await getCategories();
  return [{ slug: "all" }, ...categories.map((c) => ({ slug: c.slug }))];
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  if (slug === "all") return { title: "All Products" };
  const category = await getCategoryBySlug(slug);
  if (!category) return {};
  return { title: category.name, description: category.description ?? undefined };
}

function sortProducts(products: ProductCardType[], sort: string | undefined) {
  const list = [...products];
  switch (sort) {
    case "price-asc":
      return list.sort((a, b) => a.price - b.price);
    case "price-desc":
      return list.sort((a, b) => b.price - a.price);
    case "name-asc":
      return list.sort((a, b) => a.name.localeCompare(b.name));
    default:
      return list;
  }
}

export default async function CollectionPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ sort?: string }>;
}) {
  const { slug } = await params;
  const { sort } = await searchParams;

  const isAll = slug === "all";
  const category = isAll ? null : await getCategoryBySlug(slug);
  if (!isAll && !category) notFound();

  const products = isAll ? await getAllProducts() : await getProductsByCategory(slug);
  const sorted = sortProducts(products, sort);

  const title = isAll ? "All Products" : category!.name;
  const description = isAll
    ? "Every Kun Foods product, all in one place."
    : category!.description;
  const emoji = isAll ? "🛍️" : category!.image ?? "🍽️";

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:py-14">
      <div className="mb-10 flex flex-col items-center gap-4 text-center sm:flex-row sm:text-left">
        <ProductImage emoji={emoji} seed={slug} className="h-20 w-20 shrink-0" size="text-4xl" />
        <div>
          <h1 className="font-heading text-3xl font-extrabold sm:text-4xl">{title}</h1>
          {description && <p className="mt-1 text-ink-soft">{description}</p>}
        </div>
      </div>

      <div className="mb-6 flex items-center justify-between">
        <p className="text-sm text-ink-soft">
          {sorted.length} product{sorted.length === 1 ? "" : "s"}
        </p>
        <SortSelect />
      </div>

      {sorted.length === 0 ? (
        <p className="py-20 text-center text-ink-soft">No products in this collection yet.</p>
      ) : (
        <div className="grid grid-cols-2 gap-x-5 gap-y-10 sm:grid-cols-3 lg:grid-cols-4">
          {sorted.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}
