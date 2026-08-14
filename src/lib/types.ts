import type { Product as PrismaProduct, Category } from "@prisma/client";

export type ProductWithCategory = PrismaProduct & { category: Category };

export type ProductCard = {
  id: string;
  name: string;
  slug: string;
  price: number;
  compareAtPrice: number | null;
  images: string[];
  badge: string | null;
  weightLabel: string | null;
  categorySlug: string;
  categoryName: string;
};

export function toProductCard(p: ProductWithCategory): ProductCard {
  return {
    id: p.id,
    name: p.name,
    slug: p.slug,
    price: p.price,
    compareAtPrice: p.compareAtPrice,
    images: JSON.parse(p.images) as string[],
    badge: p.badge,
    weightLabel: p.weightLabel,
    categorySlug: p.category.slug,
    categoryName: p.category.name,
  };
}
