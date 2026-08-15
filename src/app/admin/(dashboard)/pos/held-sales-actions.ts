"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/require-admin";

const holdSchema = z.object({
  label: z.string().max(100).optional(),
  cart: z.string().min(2), // JSON-encoded, validated shape-agnostic (client owns the schema)
  customer: z.string().min(2),
});

export async function holdSale(formData: FormData) {
  const session = await requirePermission("pos.operate");
  const parsed = holdSchema.parse({
    label: formData.get("label") || undefined,
    cart: formData.get("cart"),
    customer: formData.get("customer"),
  });

  const held = await prisma.heldSale.create({
    data: {
      label: parsed.label || null,
      cart: parsed.cart,
      customer: parsed.customer,
      actorEmail: session.user.email ?? "unknown",
    },
  });

  revalidatePath("/admin/pos");
  return { id: held.id };
}

export async function listHeldSales() {
  await requirePermission("pos.operate");
  return prisma.heldSale.findMany({ orderBy: { createdAt: "desc" } });
}

export async function resumeSale(id: string) {
  await requirePermission("pos.operate");
  const held = await prisma.heldSale.findUnique({ where: { id } });
  if (!held) return { error: "This held sale no longer exists." };
  await prisma.heldSale.delete({ where: { id } });
  revalidatePath("/admin/pos");
  return { cart: held.cart, customer: held.customer };
}

export async function discardHeldSale(id: string) {
  await requirePermission("pos.operate");
  await prisma.heldSale.delete({ where: { id } }).catch(() => {});
  revalidatePath("/admin/pos");
}
