"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin, slugify } from "@/lib/require-admin";

const bundleSchema = z.object({
  name: z.string().min(2).max(150),
  description: z.string().min(5).max(2000),
  price: z.coerce.number().min(1),
  image: z.string().min(1).max(10),
  active: z.coerce.boolean().optional(),
});

function parseItems(formData: FormData) {
  const items: Array<{ productId: string; quantity: number }> = [];
  for (const [key, value] of formData.entries()) {
    if (!key.startsWith("include_")) continue;
    if (value !== "on") continue;
    const productId = key.replace("include_", "");
    const quantity = Number(formData.get(`qty_${productId}`)) || 1;
    items.push({ productId, quantity });
  }
  return items;
}

export async function createBundle(formData: FormData) {
  await requireAdmin();
  const parsed = bundleSchema.parse({
    name: formData.get("name"),
    description: formData.get("description"),
    price: formData.get("price"),
    image: formData.get("image"),
    active: formData.get("active") === "on",
  });
  const items = parseItems(formData);
  if (items.length === 0) throw new Error("Select at least one product for this bundle");

  let slug = slugify(parsed.name);
  const existing = await prisma.bundle.findUnique({ where: { slug } });
  if (existing) slug = `${slug}-${Date.now().toString(36)}`;

  await prisma.bundle.create({
    data: {
      name: parsed.name,
      slug,
      description: parsed.description,
      price: Math.round(parsed.price * 100),
      image: parsed.image,
      active: parsed.active ?? true,
      items: { create: items },
    },
  });

  revalidatePath("/admin/bundles");
  revalidatePath("/deals");
  revalidatePath("/");
  redirect("/admin/bundles");
}

export async function updateBundle(bundleId: string, formData: FormData) {
  await requireAdmin();
  const parsed = bundleSchema.parse({
    name: formData.get("name"),
    description: formData.get("description"),
    price: formData.get("price"),
    image: formData.get("image"),
    active: formData.get("active") === "on",
  });
  const items = parseItems(formData);
  if (items.length === 0) throw new Error("Select at least one product for this bundle");

  await prisma.$transaction([
    prisma.bundleItem.deleteMany({ where: { bundleId } }),
    prisma.bundle.update({
      where: { id: bundleId },
      data: {
        name: parsed.name,
        description: parsed.description,
        price: Math.round(parsed.price * 100),
        image: parsed.image,
        active: parsed.active ?? true,
        items: { create: items },
      },
    }),
  ]);

  revalidatePath("/admin/bundles");
  revalidatePath("/deals");
  revalidatePath("/");
  redirect("/admin/bundles");
}

export async function deleteBundle(bundleId: string) {
  await requireAdmin();
  await prisma.bundle.delete({ where: { id: bundleId } });
  revalidatePath("/admin/bundles");
  revalidatePath("/deals");
  revalidatePath("/");
}
