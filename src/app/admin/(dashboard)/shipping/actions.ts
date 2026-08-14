"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";

const shippingZoneSchema = z.object({
  city: z.string().min(2).max(100),
  rate: z.coerce.number().min(0),
  freeAbove: z.coerce.number().min(0).optional(),
  active: z.coerce.boolean().optional(),
});

function parseForm(formData: FormData) {
  return shippingZoneSchema.parse({
    city: formData.get("city"),
    rate: formData.get("rate"),
    freeAbove: formData.get("freeAbove") || undefined,
    active: formData.get("active") === "on",
  });
}

export async function createShippingZone(formData: FormData) {
  await requireAdmin();
  const parsed = parseForm(formData);

  await prisma.shippingZone.create({
    data: {
      city: parsed.city.trim(),
      rate: Math.round(parsed.rate * 100),
      freeAbove: parsed.freeAbove !== undefined ? Math.round(parsed.freeAbove * 100) : null,
      active: parsed.active ?? true,
    },
  });

  revalidatePath("/admin/shipping");
  redirect("/admin/shipping");
}

export async function updateShippingZone(zoneId: string, formData: FormData) {
  await requireAdmin();
  const parsed = parseForm(formData);

  await prisma.shippingZone.update({
    where: { id: zoneId },
    data: {
      city: parsed.city.trim(),
      rate: Math.round(parsed.rate * 100),
      freeAbove: parsed.freeAbove !== undefined ? Math.round(parsed.freeAbove * 100) : null,
      active: parsed.active ?? true,
    },
  });

  revalidatePath("/admin/shipping");
  redirect("/admin/shipping");
}

export async function deleteShippingZone(zoneId: string) {
  await requireAdmin();
  await prisma.shippingZone.delete({ where: { id: zoneId } });
  revalidatePath("/admin/shipping");
}
