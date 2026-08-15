"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/require-admin";
import { logAudit } from "@/lib/audit";

const couponSchema = z.object({
  code: z.string().min(2).max(30),
  type: z.enum(["percentage", "fixed"]),
  value: z.coerce.number().int().min(1),
  minSubtotal: z.coerce.number().min(0).optional(),
  usageLimit: z.coerce.number().int().min(1).optional(),
  expiresAt: z.string().optional(),
  active: z.coerce.boolean().optional(),
});

function parseForm(formData: FormData) {
  return couponSchema.parse({
    code: formData.get("code"),
    type: formData.get("type"),
    value: formData.get("value"),
    minSubtotal: formData.get("minSubtotal") || undefined,
    usageLimit: formData.get("usageLimit") || undefined,
    expiresAt: formData.get("expiresAt") || undefined,
    active: formData.get("active") === "on",
  });
}

export async function createCoupon(formData: FormData) {
  const session = await requirePermission("promotions.manage");
  const parsed = parseForm(formData);

  const created = await prisma.coupon.create({
    data: {
      code: parsed.code.trim().toUpperCase(),
      type: parsed.type,
      value: parsed.type === "percentage" ? parsed.value : Math.round(parsed.value * 100),
      minSubtotal: Math.round((parsed.minSubtotal ?? 0) * 100),
      usageLimit: parsed.usageLimit ?? null,
      expiresAt: parsed.expiresAt ? new Date(parsed.expiresAt) : null,
      active: parsed.active ?? true,
    },
  });

  await logAudit({
    actorEmail: session.user.email ?? "unknown",
    action: "coupon.create",
    entityType: "Coupon",
    entityId: created.id,
    after: { code: created.code, type: created.type, value: created.value },
  });

  revalidatePath("/admin/coupons");
  redirect("/admin/coupons");
}

export async function updateCoupon(couponId: string, formData: FormData) {
  const session = await requirePermission("promotions.manage");
  const parsed = parseForm(formData);
  const before = await prisma.coupon.findUniqueOrThrow({ where: { id: couponId } });

  const updated = await prisma.coupon.update({
    where: { id: couponId },
    data: {
      code: parsed.code.trim().toUpperCase(),
      type: parsed.type,
      value: parsed.type === "percentage" ? parsed.value : Math.round(parsed.value * 100),
      minSubtotal: Math.round((parsed.minSubtotal ?? 0) * 100),
      usageLimit: parsed.usageLimit ?? null,
      expiresAt: parsed.expiresAt ? new Date(parsed.expiresAt) : null,
      active: parsed.active ?? true,
    },
  });

  await logAudit({
    actorEmail: session.user.email ?? "unknown",
    action: "coupon.update",
    entityType: "Coupon",
    entityId: couponId,
    before: { code: before.code, value: before.value, active: before.active },
    after: { code: updated.code, value: updated.value, active: updated.active },
  });

  revalidatePath("/admin/coupons");
  redirect("/admin/coupons");
}

export async function deleteCoupon(couponId: string) {
  const session = await requirePermission("promotions.manage");
  const before = await prisma.coupon.findUniqueOrThrow({ where: { id: couponId } });
  await prisma.coupon.delete({ where: { id: couponId } });

  await logAudit({
    actorEmail: session.user.email ?? "unknown",
    action: "coupon.delete",
    entityType: "Coupon",
    entityId: couponId,
    before: { code: before.code },
  });

  revalidatePath("/admin/coupons");
}
