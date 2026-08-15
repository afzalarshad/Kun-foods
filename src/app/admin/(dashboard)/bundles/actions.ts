"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requirePermission, slugify } from "@/lib/require-admin";
import { logAudit } from "@/lib/audit";

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
  const session = await requirePermission("promotions.manage");
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

  const created = await prisma.bundle.create({
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

  await logAudit({
    actorEmail: session.user.email ?? "unknown",
    action: "bundle.create",
    entityType: "Bundle",
    entityId: created.id,
    after: { name: created.name, price: created.price },
  });

  revalidatePath("/admin/bundles");
  revalidatePath("/deals");
  revalidatePath("/");
  redirect("/admin/bundles");
}

export async function updateBundle(bundleId: string, formData: FormData) {
  const session = await requirePermission("promotions.manage");
  const parsed = bundleSchema.parse({
    name: formData.get("name"),
    description: formData.get("description"),
    price: formData.get("price"),
    image: formData.get("image"),
    active: formData.get("active") === "on",
  });
  const items = parseItems(formData);
  if (items.length === 0) throw new Error("Select at least one product for this bundle");

  const before = await prisma.bundle.findUniqueOrThrow({ where: { id: bundleId } });

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

  await logAudit({
    actorEmail: session.user.email ?? "unknown",
    action: "bundle.update",
    entityType: "Bundle",
    entityId: bundleId,
    before: { name: before.name, price: before.price },
    after: { name: parsed.name, price: Math.round(parsed.price * 100) },
  });

  revalidatePath("/admin/bundles");
  revalidatePath("/deals");
  revalidatePath("/");
  redirect("/admin/bundles");
}

export async function deleteBundle(bundleId: string) {
  const session = await requirePermission("promotions.manage");
  const actorEmail = session.user.email ?? "unknown";
  const before = await prisma.bundle.findUniqueOrThrow({ where: { id: bundleId } });

  // Deleting a bundle that appears in past orders would null out OrderItem.bundleId.
  // Deactivate instead so order history keeps pointing at a real bundle record.
  const orderItemCount = await prisma.orderItem.count({ where: { bundleId } });

  if (orderItemCount > 0) {
    await prisma.bundle.update({ where: { id: bundleId }, data: { active: false } });
    await logAudit({
      actorEmail,
      action: "bundle.deactivate",
      entityType: "Bundle",
      entityId: bundleId,
      before: { name: before.name },
    });
    revalidatePath("/admin/bundles");
    revalidatePath("/deals");
    revalidatePath("/");
    return {
      message: `"${before.name}" has been ordered before, so it was deactivated (hidden from /deals) instead of deleted, to keep that order history intact.`,
    };
  }

  await prisma.bundle.delete({ where: { id: bundleId } });

  await logAudit({
    actorEmail,
    action: "bundle.delete",
    entityType: "Bundle",
    entityId: bundleId,
    before: { name: before.name },
  });

  revalidatePath("/admin/bundles");
  revalidatePath("/deals");
  revalidatePath("/");
}
