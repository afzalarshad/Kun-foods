"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user) redirect("/admin/login");
}

function slugify(name: string) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

const productSchema = z.object({
  name: z.string().min(2).max(150),
  categoryId: z.string().min(1),
  description: z.string().min(5).max(2000),
  price: z.coerce.number().int().min(1),
  compareAtPrice: z.coerce.number().int().min(0).optional(),
  weightLabel: z.string().max(50).optional(),
  badge: z.string().max(30).optional(),
  stock: z.coerce.number().int().min(0),
  featured: z.coerce.boolean().optional(),
  image: z.string().min(1).max(10),
});

export async function createProduct(formData: FormData) {
  await requireAdmin();

  const parsed = productSchema.parse({
    name: formData.get("name"),
    categoryId: formData.get("categoryId"),
    description: formData.get("description"),
    price: formData.get("price"),
    compareAtPrice: formData.get("compareAtPrice") || undefined,
    weightLabel: formData.get("weightLabel") || undefined,
    badge: formData.get("badge") || undefined,
    stock: formData.get("stock"),
    featured: formData.get("featured") === "on",
    image: formData.get("image"),
  });

  let slug = slugify(parsed.name);
  const existing = await prisma.product.findUnique({ where: { slug } });
  if (existing) slug = `${slug}-${Date.now().toString(36)}`;

  await prisma.product.create({
    data: {
      name: parsed.name,
      slug,
      description: parsed.description,
      price: Math.round(parsed.price * 100),
      compareAtPrice: parsed.compareAtPrice ? Math.round(parsed.compareAtPrice * 100) : null,
      images: JSON.stringify([parsed.image]),
      badge: parsed.badge || null,
      weightLabel: parsed.weightLabel || null,
      stock: parsed.stock,
      featured: parsed.featured ?? false,
      categoryId: parsed.categoryId,
    },
  });

  revalidatePath("/admin/products");
  revalidatePath("/");
  redirect("/admin/products");
}

export async function updateProduct(productId: string, formData: FormData) {
  await requireAdmin();

  const parsed = productSchema.parse({
    name: formData.get("name"),
    categoryId: formData.get("categoryId"),
    description: formData.get("description"),
    price: formData.get("price"),
    compareAtPrice: formData.get("compareAtPrice") || undefined,
    weightLabel: formData.get("weightLabel") || undefined,
    badge: formData.get("badge") || undefined,
    stock: formData.get("stock"),
    featured: formData.get("featured") === "on",
    image: formData.get("image"),
  });

  await prisma.product.update({
    where: { id: productId },
    data: {
      name: parsed.name,
      description: parsed.description,
      price: Math.round(parsed.price * 100),
      compareAtPrice: parsed.compareAtPrice ? Math.round(parsed.compareAtPrice * 100) : null,
      images: JSON.stringify([parsed.image]),
      badge: parsed.badge || null,
      weightLabel: parsed.weightLabel || null,
      stock: parsed.stock,
      featured: parsed.featured ?? false,
      categoryId: parsed.categoryId,
    },
  });

  revalidatePath("/admin/products");
  revalidatePath("/");
  redirect("/admin/products");
}

export async function deleteProduct(productId: string) {
  await requireAdmin();
  await prisma.product.delete({ where: { id: productId } });
  revalidatePath("/admin/products");
  revalidatePath("/");
}

const statuses = ["pending", "processing", "shipped", "delivered", "cancelled"] as const;

export async function updateOrderStatus(orderId: string, formData: FormData) {
  await requireAdmin();
  const status = z.enum(statuses).parse(formData.get("status"));
  await prisma.order.update({ where: { id: orderId }, data: { status } });
  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${orderId}`);
}
