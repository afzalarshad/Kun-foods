"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requirePermission, slugify } from "@/lib/require-admin";
import { logAudit } from "@/lib/audit";

const recipeSchema = z.object({
  title: z.string().min(2).max(200),
  excerpt: z.string().min(2).max(300),
  body: z.string().min(2),
  image: z.string().max(10).optional(),
  published: z.coerce.boolean().optional(),
});

function parseForm(formData: FormData) {
  return recipeSchema.parse({
    title: formData.get("title"),
    excerpt: formData.get("excerpt"),
    body: formData.get("body"),
    image: formData.get("image") || undefined,
    published: formData.get("published") === "on",
  });
}

export async function createRecipe(formData: FormData) {
  const session = await requirePermission("content.manage");
  const parsed = parseForm(formData);
  const actorEmail = session.user.email ?? "unknown";

  let slug = slugify(parsed.title);
  const existing = await prisma.recipe.findUnique({ where: { slug } });
  if (existing) slug = `${slug}-${Date.now().toString(36)}`;

  const created = await prisma.recipe.create({
    data: {
      title: parsed.title,
      slug,
      excerpt: parsed.excerpt,
      body: parsed.body,
      image: parsed.image || null,
      published: parsed.published ?? false,
      authorEmail: actorEmail,
    },
  });

  await logAudit({
    actorEmail,
    action: "recipe.create",
    entityType: "Recipe",
    entityId: created.id,
    after: { title: created.title, slug: created.slug, published: created.published },
  });

  revalidatePath("/admin/recipes");
  revalidatePath("/recipes");
  redirect("/admin/recipes");
}

export async function updateRecipe(recipeId: string, formData: FormData) {
  const session = await requirePermission("content.manage");
  const parsed = parseForm(formData);
  const actorEmail = session.user.email ?? "unknown";
  const before = await prisma.recipe.findUniqueOrThrow({ where: { id: recipeId } });

  const updated = await prisma.recipe.update({
    where: { id: recipeId },
    data: {
      title: parsed.title,
      excerpt: parsed.excerpt,
      body: parsed.body,
      image: parsed.image || null,
      published: parsed.published ?? false,
    },
  });

  await logAudit({
    actorEmail,
    action: "recipe.update",
    entityType: "Recipe",
    entityId: recipeId,
    before: { title: before.title, published: before.published },
    after: { title: updated.title, published: updated.published },
  });

  revalidatePath("/admin/recipes");
  revalidatePath("/recipes");
  revalidatePath(`/recipes/${updated.slug}`);
  redirect("/admin/recipes");
}

export async function deleteRecipe(recipeId: string): Promise<{ message?: string }> {
  const session = await requirePermission("content.manage");
  const actorEmail = session.user.email ?? "unknown";
  const before = await prisma.recipe.findUniqueOrThrow({ where: { id: recipeId } });

  await prisma.recipe.delete({ where: { id: recipeId } });
  await logAudit({
    actorEmail,
    action: "recipe.delete",
    entityType: "Recipe",
    entityId: recipeId,
    before: { title: before.title, slug: before.slug },
  });

  revalidatePath("/admin/recipes");
  revalidatePath("/recipes");
  return {};
}
