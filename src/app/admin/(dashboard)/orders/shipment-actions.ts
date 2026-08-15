"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/require-admin";
import { logAudit } from "@/lib/audit";
import { notifyOrderStatusChanged } from "@/lib/notifications";
import { getCourierAdapter } from "@/lib/providers/couriers";

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

  let trackingNumber = parsed.trackingNumber || null;
  const adapter = getCourierAdapter(parsed.courier);

  // If staff didn't type a tracking number and this courier's API is actually configured,
  // try booking through it directly instead of requiring manual entry. None of the couriers
  // ship with real credentials today, so this is a no-op until LEOPARDS_API_KEY etc. is set.
  if (!trackingNumber && adapter.configured) {
    const order = await prisma.order.findUniqueOrThrow({ where: { id: orderId } });
    try {
      const booking = await adapter.createBooking({
        orderNumber: order.orderNumber,
        customerName: order.customerName,
        phone: order.phone,
        address: order.address,
        city: order.city,
        codAmount: parsed.codAmount !== undefined ? Math.round(parsed.codAmount * 100) : null,
        weightGrams: parsed.weightGrams ?? null,
      });
      trackingNumber = booking.trackingNumber;
    } catch (err) {
      console.error(`[saveShipment] ${adapter.label} auto-booking failed:`, err);
    }
  }

  const data = {
    courier: parsed.courier,
    trackingNumber,
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

  // A real tracking number is the only trustworthy signal that the order has
  // actually left the building — auto-promote from processing/packed to shipped
  // instead of relying on staff to remember a separate manual status change.
  if (trackingNumber) {
    const order = await prisma.order.findUniqueOrThrow({ where: { id: orderId } });
    if (order.status === "processing" || order.status === "packed") {
      const updated = await prisma.order.update({
        where: { id: orderId },
        data: { status: "shipped" },
        include: { items: true },
      });
      await prisma.orderStatusEvent.create({
        data: { orderId, status: "shipped", note: `Courier booked — tracking ${trackingNumber}`, actorEmail },
      });
      await logAudit({
        actorEmail,
        action: "order.status_update",
        entityType: "Order",
        entityId: orderId,
        before: { status: order.status },
        after: { status: "shipped", source: "shipment-booking" },
      });
      notifyOrderStatusChanged(updated).catch((err) => console.error("[saveShipment] notification failed:", err));
      revalidatePath("/admin/orders");
      revalidatePath("/admin/warehouse");
      revalidatePath("/admin");
    }
  }

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

// Lets warehouse/dispatch staff scan the QR code printed on a shipping label
// (see ShippingLabelCard, which encodes "order:<id>") instead of hunting the
// order down by number, then advance its shipment status with one tap.
export async function scanUpdateShipmentStatus(
  rawCode: string,
  status: (typeof shipmentStatuses)[number]
): Promise<{ error?: string; orderNumber?: string }> {
  const session = await requirePermission("shipping.manage");
  const actorEmail = session.user.email ?? "unknown";
  z.enum(shipmentStatuses).parse(status);

  const match = rawCode.trim().match(/^order:(.+)$/);
  const orderId = match ? match[1] : rawCode.trim();
  if (!orderId) return { error: "Empty code" };

  const shipment = await prisma.shipment.findUnique({ where: { orderId }, include: { order: { select: { orderNumber: true } } } });
  if (!shipment) return { error: "No shipment booked for this code — book a courier first." };

  await prisma.shipment.update({ where: { orderId }, data: { status, actorEmail } });

  await logAudit({
    actorEmail,
    action: "shipment.status_update",
    entityType: "Shipment",
    entityId: shipment.id,
    before: { status: shipment.status },
    after: { status, source: "label-scan" },
  });

  revalidatePath(`/admin/orders/${orderId}`);
  revalidatePath("/admin/shipments");
  return { orderNumber: shipment.order.orderNumber };
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
