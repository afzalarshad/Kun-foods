"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/require-admin";
import { logAudit } from "@/lib/audit";

const adjustSchema = z.object({
  productId: z.string().min(1),
  quantity: z.coerce.number().int().refine((n) => n !== 0, "Quantity can't be zero"),
  reason: z.string().min(3).max(300),
});

export async function adjustStock(formData: FormData): Promise<{ error?: string }> {
  const session = await requirePermission("inventory.adjust");
  const parsed = adjustSchema.parse({
    productId: formData.get("productId"),
    quantity: formData.get("quantity"),
    reason: formData.get("reason"),
  });
  const actorEmail = session.user.email ?? "unknown";

  const product = await prisma.product.findUniqueOrThrow({ where: { id: parsed.productId } });
  const newStock = product.stock + parsed.quantity;
  if (newStock < 0) {
    return { error: `Adjustment would take stock below zero (current: ${product.stock}).` };
  }

  await prisma.$transaction([
    prisma.product.update({ where: { id: parsed.productId }, data: { stock: newStock } }),
    prisma.inventoryMovement.create({
      data: {
        productId: parsed.productId,
        type: "adjustment",
        quantity: parsed.quantity,
        reason: parsed.reason,
        actorEmail,
      },
    }),
  ]);

  await logAudit({
    actorEmail,
    action: "inventory.adjust",
    entityType: "Product",
    entityId: parsed.productId,
    before: { stock: product.stock },
    after: { stock: newStock, delta: parsed.quantity, reason: parsed.reason },
  });

  revalidatePath("/admin/inventory");
  revalidatePath("/admin/products");
  revalidatePath("/");
  return {};
}
