"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/require-admin";
import { logAudit } from "@/lib/audit";

const couriers = ["leopards", "tcs", "postex", "manual"] as const;
const shipmentStatuses = ["pending", "booked", "picked_up", "in_transit", "delivered", "returned"] as const;

const bookSchema = z.object({
  courier: z.enum(couriers),
  trackingNumber: z.string().max(80).optional(),
  weightGrams: z.coerce.number().int().min(0).optional(),
  codAmount: z.coerce.number().min(0).optional(),
});

export async function saveShipment(orderId: string, formData: FormData) {
  const session = await requirePermission("shipping.manage");
  const actorEmail = session.user.email ?? "unknown";
  const parsed = bookSchema.parse({
    courier: formData.get("courier"),
    trackingNumber: formData.get("trackingNumber") || undefined,
    weightGrams: formData.get("weightGrams") || undefined,
    codAmount: formData.get("codAmount") || undefined,
  });

  const existing = await prisma.shipment.findUnique({ where: { orderId } });

  const data = {
    courier: parsed.courier,
    trackingNumber: parsed.trackingNumber || null,
    weightGrams: parsed.weightGrams ?? null,
    codAmount: parsed.codAmount !== undefined ? Math.round(parsed.codAmount * 100) : null,
    actorEmail,
  };

  const shipment = existing
    ? await prisma.shipment.update({ where: { orderId }, data })
    : await prisma.shipment.create({ data: { ...data, orderId, status: "booked" } });

  await logAudit({
    actorEmail,
    action: existing ? "shipment.update" : "shipment.create",
    entityType: "Shipment",
    entityId: shipment.id,
    after: { orderId, courier: shipment.courier, trackingNumber: shipment.trackingNumber },
  });

  revalidatePath(`/admin/orders/${orderId}`);
  revalidatePath("/admin/shipments");
}

export async function updateShipmentStatus(orderId: string, formData: FormData) {
  const session = await requirePermission("shipping.manage");
  const actorEmail = session.user.email ?? "unknown";
  const status = z.enum(shipmentStatuses).parse(formData.get("status"));

  const before = await prisma.shipment.findUniqueOrThrow({ where: { orderId } });

  await prisma.shipment.update({ where: { orderId }, data: { status, actorEmail } });

  await logAudit({
    actorEmail,
    action: "shipment.status_update",
    entityType: "Shipment",
    entityId: before.id,
    before: { status: before.status },
    after: { status },
  });

  revalidatePath(`/admin/orders/${orderId}`);
  revalidatePath("/admin/shipments");
}

export async function generateLabel(orderId: string): Promise<{ error?: string }> {
  const session = await requirePermission("shipping.manage");
  const actorEmail = session.user.email ?? "unknown";

  const shipment = await prisma.shipment.findUnique({ where: { orderId } });
  if (!shipment) return { error: "Book a courier for this order before generating a label." };
  if (!shipment.trackingNumber) return { error: "Add a tracking/booking number before generating a label." };

  await prisma.shipment.update({ where: { orderId }, data: { labelGeneratedAt: new Date(), actorEmail } });

  await logAudit({
    actorEmail,
    action: "shipment.label_generated",
    entityType: "Shipment",
    entityId: shipment.id,
    after: { orderId, courier: shipment.courier, trackingNumber: shipment.trackingNumber },
  });

  revalidatePath(`/admin/orders/${orderId}`);
  revalidatePath(`/admin/orders/${orderId}/label`);
  return {};
}
