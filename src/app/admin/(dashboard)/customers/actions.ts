"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";
import { logAudit } from "@/lib/audit";

export async function addCustomerTag(customerId: string, formData: FormData) {
  const session = await requireAdmin();
  const tag = z.string().min(1).max(30).parse(formData.get("tag")).trim();

  await prisma.customerTag.upsert({
    where: { customerId_tag: { customerId, tag } },
    update: {},
    create: { customerId, tag },
  });

  await logAudit({
    actorEmail: session.user.email ?? "unknown",
    action: "customer.tag_add",
    entityType: "Customer",
    entityId: customerId,
    after: { tag },
  });

  revalidatePath(`/admin/customers/${customerId}`);
}

export async function removeCustomerTag(customerId: string, tagId: string) {
  const session = await requireAdmin();
  const tag = await prisma.customerTag.delete({ where: { id: tagId } });

  await logAudit({
    actorEmail: session.user.email ?? "unknown",
    action: "customer.tag_remove",
    entityType: "Customer",
    entityId: customerId,
    before: { tag: tag.tag },
  });

  revalidatePath(`/admin/customers/${customerId}`);
}

export async function addCustomerNote(customerId: string, formData: FormData) {
  const session = await requireAdmin();
  const note = z.string().min(1).max(1000).parse(formData.get("note"));

  await prisma.customerNote.create({
    data: { customerId, note, authorEmail: session.user.email ?? "unknown" },
  });

  await logAudit({
    actorEmail: session.user.email ?? "unknown",
    action: "customer.note_add",
    entityType: "Customer",
    entityId: customerId,
  });

  revalidatePath(`/admin/customers/${customerId}`);
}

const addressSchema = z.object({
  label: z.string().min(1).max(40),
  address: z.string().min(3).max(300),
  city: z.string().min(2).max(100),
  postalCode: z.string().max(20).optional(),
  isDefault: z.coerce.boolean().optional(),
});

export async function addCustomerAddress(customerId: string, formData: FormData) {
  await requireAdmin();
  const parsed = addressSchema.parse({
    label: formData.get("label"),
    address: formData.get("address"),
    city: formData.get("city"),
    postalCode: formData.get("postalCode") || undefined,
    isDefault: formData.get("isDefault") === "on",
  });

  if (parsed.isDefault) {
    await prisma.customerAddress.updateMany({ where: { customerId }, data: { isDefault: false } });
  }

  await prisma.customerAddress.create({
    data: {
      customerId,
      label: parsed.label,
      address: parsed.address,
      city: parsed.city,
      postalCode: parsed.postalCode,
      isDefault: parsed.isDefault ?? false,
    },
  });

  revalidatePath(`/admin/customers/${customerId}`);
}

export async function deleteCustomerAddress(customerId: string, addressId: string) {
  await requireAdmin();
  await prisma.customerAddress.delete({ where: { id: addressId } });
  revalidatePath(`/admin/customers/${customerId}`);
}
