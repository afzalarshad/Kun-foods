"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/require-admin";
import { logAudit } from "@/lib/audit";
import { PAKISTAN_PROVINCES, isKnownPakistanCity } from "@/lib/pakistan-locations";

const shippingZoneSchema = z.object({
  scope: z.enum(["city", "province"]),
  city: z.string().max(100).optional(),
  province: z.enum(PAKISTAN_PROVINCES).optional(),
  rate: z.coerce.number().min(0),
  freeAbove: z.coerce.number().min(0).optional(),
  excluded: z.coerce.boolean().optional(),
  active: z.coerce.boolean().optional(),
});

function parseForm(formData: FormData) {
  return shippingZoneSchema.parse({
    scope: formData.get("scope"),
    city: formData.get("city") || undefined,
    province: formData.get("province") || undefined,
    rate: formData.get("rate"),
    freeAbove: formData.get("freeAbove") || undefined,
    excluded: formData.get("excluded") === "on",
    active: formData.get("active") === "on",
  });
}

function buildData(parsed: z.infer<typeof shippingZoneSchema>) {
  if (parsed.scope === "city") {
    if (!parsed.city?.trim()) throw new Error("Pick a city for a city-scoped rate");
    if (!isKnownPakistanCity(parsed.city)) {
      throw new Error(`"${parsed.city}" isn't in the Pakistan city list — pick one from the dropdown`);
    }
  } else if (!parsed.province) {
    throw new Error("Pick a province for a province-scoped rate");
  }

  return {
    scope: parsed.scope,
    city: parsed.scope === "city" ? parsed.city!.trim() : null,
    province: parsed.scope === "province" ? parsed.province! : null,
    rate: Math.round(parsed.rate * 100),
    freeAbove: parsed.freeAbove !== undefined ? Math.round(parsed.freeAbove * 100) : null,
    excluded: parsed.excluded ?? false,
    active: parsed.active ?? true,
  };
}

async function assertNoDuplicate(data: ReturnType<typeof buildData>, excludeId?: string) {
  const existing = await prisma.shippingZone.findFirst({
    where: {
      scope: data.scope,
      ...(data.scope === "city" ? { city: data.city } : { province: data.province }),
      ...(excludeId ? { id: { not: excludeId } } : {}),
    },
  });
  if (existing) {
    throw new Error(
      data.scope === "city"
        ? `A rate for "${data.city}" already exists — edit that one instead.`
        : `A province-wide rate for "${data.province}" already exists — edit that one instead.`
    );
  }
}

export async function createShippingZone(formData: FormData) {
  const session = await requirePermission("shipping.manage");
  const data = buildData(parseForm(formData));
  await assertNoDuplicate(data);

  const created = await prisma.shippingZone.create({ data });

  await logAudit({
    actorEmail: session.user.email ?? "unknown",
    action: "shipping_zone.create",
    entityType: "ShippingZone",
    entityId: created.id,
    after: { scope: created.scope, city: created.city, province: created.province, rate: created.rate, excluded: created.excluded },
  });

  revalidatePath("/admin/shipping");
  revalidatePath("/checkout");
  redirect("/admin/shipping");
}

export async function updateShippingZone(zoneId: string, formData: FormData) {
  const session = await requirePermission("shipping.manage");
  const data = buildData(parseForm(formData));
  const before = await prisma.shippingZone.findUniqueOrThrow({ where: { id: zoneId } });
  await assertNoDuplicate(data, zoneId);

  const updated = await prisma.shippingZone.update({ where: { id: zoneId }, data });

  await logAudit({
    actorEmail: session.user.email ?? "unknown",
    action: "shipping_zone.update",
    entityType: "ShippingZone",
    entityId: zoneId,
    before: { city: before.city, province: before.province, rate: before.rate, excluded: before.excluded },
    after: { city: updated.city, province: updated.province, rate: updated.rate, excluded: updated.excluded },
  });

  revalidatePath("/admin/shipping");
  revalidatePath("/checkout");
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
    before: { city: before.city, province: before.province },
  });

  revalidatePath("/admin/shipping");
  revalidatePath("/checkout");
}
