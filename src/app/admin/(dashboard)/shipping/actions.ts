"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/require-admin";
import { logAudit } from "@/lib/audit";

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
  const session = await requirePermission("shipping.manage");
  const parsed = parseForm(formData);

  const created = await prisma.shippingZone.create({
    data: {
      city: parsed.city.trim(),
      rate: Math.round(parsed.rate * 100),
      freeAbove: parsed.freeAbove !== undefined ? Math.round(parsed.freeAbove * 100) : null,
      active: parsed.active ?? true,
    },
  });

  await logAudit({
    actorEmail: session.user.email ?? "unknown",
    action: "shipping_zone.create",
    entityType: "ShippingZone",
    entityId: created.id,
    after: { city: created.city, rate: created.rate },
  });

  revalidatePath("/admin/shipping");
  redirect("/admin/shipping");
}

export async function updateShippingZone(zoneId: string, formData: FormData) {
  const session = await requirePermission("shipping.manage");
  const parsed = parseForm(formData);
  const before = await prisma.shippingZone.findUniqueOrThrow({ where: { id: zoneId } });

  const updated = await prisma.shippingZone.update({
    where: { id: zoneId },
    data: {
      city: parsed.city.trim(),
      rate: Math.round(parsed.rate * 100),
      freeAbove: parsed.freeAbove !== undefined ? Math.round(parsed.freeAbove * 100) : null,
      active: parsed.active ?? true,
    },
  });

  await logAudit({
    actorEmail: session.user.email ?? "unknown",
    action: "shipping_zone.update",
    entityType: "ShippingZone",
    entityId: zoneId,
    before: { city: before.city, rate: before.rate },
    after: { city: updated.city, rate: updated.rate },
  });

  revalidatePath("/admin/shipping");
  redirect("/admin/shipping");
}

export async function deleteShippingZone(zoneId: string) {
  const session = await requirePermission("shipping.manage");
  const before = await prisma.shippingZone.findUniqueOrThrow({ where: { id: zoneId } });
  await prisma.shippingZone.delete({ where: { id: zoneId } });

  await logAudit({
    actorEmail: session.user.email ?? "unknown",
    action: "shipping_zone.delete",
    entityType: "ShippingZone",
    entityId: zoneId,
    before: { city: before.city },
  });

  revalidatePath("/admin/shipping");
}
