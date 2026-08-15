import { prisma } from "@/lib/prisma";
import { toProductCard, type ProductCard } from "@/lib/types";
import { dedupeByVariantGroup } from "@/lib/variants";

export async function getCategories() {
  return prisma.category.findMany({ where: { active: true }, orderBy: { name: "asc" } });
}

export async function getCategoryBySlug(slug: string) {
  return prisma.category.findUnique({ where: { slug } });
}

export async function getFeaturedProducts(limit = 8): Promise<ProductCard[]> {
  const products = await prisma.product.findMany({
    where: { featured: true, active: true },
    include: { category: true },
    orderBy: { createdAt: "desc" },
  });
  return dedupeByVariantGroup(products).slice(0, limit).map(toProductCard);
}

/** Every active product row, one per variant — for the sitemap and static param generation, never deduped. */
export async function getAllProducts(): Promise<ProductCard[]> {
  const products = await prisma.product.findMany({
    where: { active: true },
    include: { category: true },
    orderBy: { createdAt: "desc" },
  });
  return products.map(toProductCard);
}

export async function getProductsByCategory(categorySlug: string): Promise<ProductCard[]> {
  const products = await prisma.product.findMany({
    where: { category: { slug: categorySlug }, active: true },
    include: { category: true },
    orderBy: { createdAt: "desc" },
  });
  return dedupeByVariantGroup(products).map(toProductCard);
}

export async function getProductBySlug(slug: string) {
  const product = await prisma.product.findUnique({
    where: { slug },
    include: { category: true },
  });
  if (!product || !product.active) return null;
  return { ...toProductCard(product), description: product.description, stock: product.stock };
}

/** Sibling products in the same variant group (e.g. other sizes), for the size picker on a product page. */
export async function getProductVariants(variantGroupId: string, excludeId: string) {
  const products = await prisma.product.findMany({
    where: { variantGroupId, active: true, id: { not: excludeId } },
    select: { id: true, slug: true, variantLabel: true, price: true, stock: true },
    orderBy: { price: "asc" },
  });
  return products;
}

export async function getRelatedProducts(categorySlug: string, excludeSlug: string, limit = 4): Promise<ProductCard[]> {
  const excludeProduct = await prisma.product.findUnique({ where: { slug: excludeSlug }, select: { variantGroupId: true } });
  const products = await prisma.product.findMany({
    where: {
      category: { slug: categorySlug },
      slug: { not: excludeSlug },
      active: true,
      ...(excludeProduct?.variantGroupId
        ? { OR: [{ variantGroupId: null }, { variantGroupId: { not: excludeProduct.variantGroupId } }] }
        : {}),
    },
    include: { category: true },
  });
  return dedupeByVariantGroup(products).slice(0, limit).map(toProductCard);
}
