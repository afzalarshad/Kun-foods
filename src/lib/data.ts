import { prisma } from "@/lib/prisma";
import { toProductCard, type ProductCard } from "@/lib/types";

export async function getCategories() {
  return prisma.category.findMany({ orderBy: { name: "asc" } });
}

export async function getCategoryBySlug(slug: string) {
  return prisma.category.findUnique({ where: { slug } });
}

export async function getFeaturedProducts(limit = 8): Promise<ProductCard[]> {
  const products = await prisma.product.findMany({
    where: { featured: true },
    include: { category: true },
    take: limit,
    orderBy: { createdAt: "desc" },
  });
  return products.map(toProductCard);
}

export async function getAllProducts(): Promise<ProductCard[]> {
  const products = await prisma.product.findMany({
    include: { category: true },
    orderBy: { createdAt: "desc" },
  });
  return products.map(toProductCard);
}

export async function getProductsByCategory(categorySlug: string): Promise<ProductCard[]> {
  const products = await prisma.product.findMany({
    where: { category: { slug: categorySlug } },
    include: { category: true },
    orderBy: { createdAt: "desc" },
  });
  return products.map(toProductCard);
}

export async function getProductBySlug(slug: string) {
  const product = await prisma.product.findUnique({
    where: { slug },
    include: { category: true },
  });
  if (!product) return null;
  return { ...toProductCard(product), description: product.description, stock: product.stock };
}

export async function getRelatedProducts(categorySlug: string, excludeSlug: string, limit = 4): Promise<ProductCard[]> {
  const products = await prisma.product.findMany({
    where: { category: { slug: categorySlug }, slug: { not: excludeSlug } },
    include: { category: true },
    take: limit,
  });
  return products.map(toProductCard);
}
