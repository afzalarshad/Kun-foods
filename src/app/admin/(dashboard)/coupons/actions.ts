"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";

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
  await requireAdmin();
  const parsed = parseForm(formData);

  await prisma.coupon.create({
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

  revalidatePath("/admin/coupons");
  redirect("/admin/coupons");
}

export async function updateCoupon(couponId: string, formData: FormData) {
  await requireAdmin();
  const parsed = parseForm(formData);

  await prisma.coupon.update({
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

  revalidatePath("/admin/coupons");
  redirect("/admin/coupons");
}

export async function deleteCoupon(couponId: string) {
  await requireAdmin();
  await prisma.coupon.delete({ where: { id: couponId } });
  revalidatePath("/admin/coupons");
}
