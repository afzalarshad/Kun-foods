"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requirePermission, slugify } from "@/lib/require-admin";
import { logAudit } from "@/lib/audit";

const categorySchema = z.object({
  name: z.string().min(2).max(100),
  description: z.string().max(500).optional(),
  image: z.string().max(10).optional(),
  active: z.coerce.boolean().optional(),
});

function parseForm(formData: FormData) {
  return categorySchema.parse({
    name: formData.get("name"),
    description: formData.get("description") || undefined,
    image: formData.get("image") || undefined,
    active: formData.get("active") === "on",
  });
}

export async function createCategory(formData: FormData) {
  const session = await requirePermission("products.manage");
  const parsed = parseForm(formData);
  const actorEmail = session.user.email ?? "unknown";

  let slug = slugify(parsed.name);
  const existing = await prisma.category.findUnique({ where: { slug } });
  if (existing) slug = `${slug}-${Date.now().toString(36)}`;

  const created = await prisma.category.create({
    data: {
      name: parsed.name,
      slug,
      description: parsed.description || null,
      image: parsed.image || null,
      active: parsed.active ?? true,
    },
  });

  await logAudit({
    actorEmail,
    action: "category.create",
    entityType: "Category",
    entityId: created.id,
    after: { name: created.name, slug: created.slug },
  });

  revalidatePath("/admin/categories");
  revalidatePath("/");
  redirect("/admin/categories");
}

export async function updateCategory(categoryId: string, formData: FormData) {
  const session = await requirePermission("products.manage");
  const parsed = parseForm(formData);
  const actorEmail = session.user.email ?? "unknown";
  const before = await prisma.category.findUniqueOrThrow({ where: { id: categoryId } });

  const updated = await prisma.category.update({
    where: { id: categoryId },
    data: {
      name: parsed.name,
      description: parsed.description || null,
      image: parsed.image || null,
      active: parsed.active ?? true,
    },
  });

  await logAudit({
    actorEmail,
    action: "category.update",
    entityType: "Category",
    entityId: categoryId,
    before: { name: before.name, active: before.active },
    after: { name: updated.name, active: updated.active },
  });

  revalidatePath("/admin/categories");
  revalidatePath("/");
  redirect("/admin/categories");
}

export async function deleteCategory(categoryId: string): Promise<{ message?: string }> {
  const session = await requirePermission("products.manage");
  const actorEmail = session.user.email ?? "unknown";
  const before = await prisma.category.findUniqueOrThrow({ where: { id: categoryId } });

  const productCount = await prisma.product.count({ where: { categoryId } });

  if (productCount > 0) {
    // Products require a category (categoryId is non-nullable), so a category
    // still in use can't be hard-deleted — deactivate it instead so it drops
    // off the storefront nav without orphaning any products.
    await prisma.category.update({ where: { id: categoryId }, data: { active: false } });
    await logAudit({
      actorEmail,
      action: "category.deactivate",
      entityType: "Category",
      entityId: categoryId,
      before: { name: before.name },
    });
    revalidatePath("/admin/categories");
    revalidatePath("/");
    return { message: `"${before.name}" still has ${productCount} product(s), so it was deactivated instead of deleted.` };
  }

  await prisma.category.delete({ where: { id: categoryId } });
  await logAudit({
    actorEmail,
    action: "category.delete",
    entityType: "Category",
    entityId: categoryId,
    before: { name: before.name, slug: before.slug },
  });

  revalidatePath("/admin/categories");
  revalidatePath("/");
  return {};
}
