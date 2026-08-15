"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/require-admin";
import { logAudit } from "@/lib/audit";

const promotionSchema = z.object({
  name: z.string().min(2).max(100),
  type: z.enum(["percentage_off", "fixed_off", "bogo"]),
  scope: z.enum(["all", "category", "product"]).optional(),
  categoryId: z.string().optional(),
  productId: z.string().optional(),
  segment: z.string().optional(),
  value: z.coerce.number().min(0).optional(),
  buyQuantity: z.coerce.number().int().min(1).optional(),
  getQuantity: z.coerce.number().int().min(1).optional(),
  getDiscountPercent: z.coerce.number().int().min(1).max(100).optional(),
  startsAt: z.string().optional(),
  endsAt: z.string().optional(),
  active: z.coerce.boolean().optional(),
});

function parseForm(formData: FormData) {
  return promotionSchema.parse({
    name: formData.get("name"),
    type: formData.get("type"),
    scope: formData.get("scope") || undefined,
    categoryId: formData.get("categoryId") || undefined,
    productId: formData.get("productId") || undefined,
    segment: formData.get("segment") || undefined,
    value: formData.get("value") || undefined,
    buyQuantity: formData.get("buyQuantity") || undefined,
    getQuantity: formData.get("getQuantity") || undefined,
    getDiscountPercent: formData.get("getDiscountPercent") || undefined,
    startsAt: formData.get("startsAt") || undefined,
    endsAt: formData.get("endsAt") || undefined,
    active: formData.get("active") === "on",
  });
}

function buildData(parsed: z.infer<typeof promotionSchema>) {
  const scope = parsed.type === "bogo" ? "product" : (parsed.scope ?? "all");
  if (scope === "category" && !parsed.categoryId) {
    throw new Error("Pick a category for a category-scoped promotion");
  }
  if (scope === "product" && !parsed.productId) {
    throw new Error("Pick a product for a product-scoped promotion");
  }
  if (parsed.type === "percentage_off" && (!parsed.value || parsed.value < 1 || parsed.value > 100)) {
    throw new Error("Percentage discount must be between 1 and 100");
  }
  if (parsed.type === "fixed_off" && (!parsed.value || parsed.value <= 0)) {
    throw new Error("Fixed discount amount is required");
  }
  if (parsed.startsAt && parsed.endsAt && new Date(parsed.startsAt) > new Date(parsed.endsAt)) {
    throw new Error("Start date must be before end date");
  }

  return {
    name: parsed.name.trim(),
    type: parsed.type,
    scope,
    categoryId: scope === "category" ? parsed.categoryId! : null,
    productId: scope === "product" ? parsed.productId! : null,
    segment: parsed.segment || null,
    value:
      parsed.type === "percentage_off"
        ? Math.round(parsed.value!)
        : parsed.type === "fixed_off"
          ? Math.round(parsed.value! * 100)
          : null,
    buyQuantity: parsed.type === "bogo" ? (parsed.buyQuantity ?? 1) : null,
    getQuantity: parsed.type === "bogo" ? (parsed.getQuantity ?? 1) : null,
    getDiscountPercent: parsed.type === "bogo" ? (parsed.getDiscountPercent ?? 100) : null,
    startsAt: parsed.startsAt ? new Date(parsed.startsAt) : null,
    endsAt: parsed.endsAt ? new Date(parsed.endsAt) : null,
    active: parsed.active ?? true,
  };
}

export async function createPromotion(formData: FormData) {
  const session = await requirePermission("promotions.manage");
  const data = buildData(parseForm(formData));

  const created = await prisma.promotion.create({ data });

  await logAudit({
    actorEmail: session.user.email ?? "unknown",
    action: "promotion.create",
    entityType: "Promotion",
    entityId: created.id,
    after: { name: created.name, type: created.type, scope: created.scope },
  });

  revalidatePath("/admin/promotions");
  redirect("/admin/promotions");
}

export async function updatePromotion(promotionId: string, formData: FormData) {
  const session = await requirePermission("promotions.manage");
  const data = buildData(parseForm(formData));
  const before = await prisma.promotion.findUniqueOrThrow({ where: { id: promotionId } });

  const updated = await prisma.promotion.update({ where: { id: promotionId }, data });

  await logAudit({
    actorEmail: session.user.email ?? "unknown",
    action: "promotion.update",
    entityType: "Promotion",
    entityId: promotionId,
    before: { name: before.name, active: before.active },
    after: { name: updated.name, active: updated.active },
  });

  revalidatePath("/admin/promotions");
  redirect("/admin/promotions");
}

export async function deletePromotion(promotionId: string) {
  const session = await requirePermission("promotions.manage");
  const before = await prisma.promotion.findUniqueOrThrow({ where: { id: promotionId } });
  await prisma.promotion.delete({ where: { id: promotionId } });

  await logAudit({
    actorEmail: session.user.email ?? "unknown",
    action: "promotion.delete",
    entityType: "Promotion",
    entityId: promotionId,
    before: { name: before.name },
  });

  revalidatePath("/admin/promotions");
}
