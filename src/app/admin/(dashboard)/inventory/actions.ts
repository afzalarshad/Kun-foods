"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/require-admin";
import { logAudit } from "@/lib/audit";
import { notifyLowStockIfNeeded } from "@/lib/admin-notifications";
import { decrementWarehouseStock, incrementWarehouseStock } from "@/lib/warehouse-stock";

const adjustSchema = z.object({
  productId: z.string().min(1),
  warehouseId: z.string().min(1),
  quantity: z.coerce.number().int().refine((n) => n !== 0, "Quantity can't be zero"),
  reason: z.string().min(3).max(300),
});

export async function adjustStock(formData: FormData): Promise<{ error?: string }> {
  const session = await requirePermission("inventory.adjust");
  const parsed = adjustSchema.parse({
    productId: formData.get("productId"),
    warehouseId: formData.get("warehouseId"),
    quantity: formData.get("quantity"),
    reason: formData.get("reason"),
  });
  const actorEmail = session.user.email ?? "unknown";

  const [product, level] = await Promise.all([
    prisma.product.findUniqueOrThrow({ where: { id: parsed.productId } }),
    prisma.warehouseStock.findUnique({
      where: { productId_warehouseId: { productId: parsed.productId, warehouseId: parsed.warehouseId } },
    }),
  ]);
  const currentAtWarehouse = level?.quantity ?? 0;
  if (parsed.quantity < 0 && currentAtWarehouse + parsed.quantity < 0) {
    return { error: `Adjustment would take this warehouse's stock below zero (current: ${currentAtWarehouse}).` };
  }

  await prisma.$transaction(async (tx) => {
    if (parsed.quantity > 0) {
      await incrementWarehouseStock(tx, { productId: parsed.productId, warehouseId: parsed.warehouseId, quantity: parsed.quantity });
    } else {
      await decrementWarehouseStock(tx, { productId: parsed.productId, warehouseId: parsed.warehouseId, quantity: -parsed.quantity });
    }
    await tx.inventoryMovement.create({
      data: {
        productId: parsed.productId,
        warehouseId: parsed.warehouseId,
        type: "adjustment",
        quantity: parsed.quantity,
        reason: parsed.reason,
        actorEmail,
      },
    });
  });

  const newTotalStock = product.stock + parsed.quantity;

  await logAudit({
    actorEmail,
    action: "inventory.adjust",
    entityType: "Product",
    entityId: parsed.productId,
    before: { stock: product.stock, warehouseStock: currentAtWarehouse },
    after: { stock: newTotalStock, warehouseStock: currentAtWarehouse + parsed.quantity, delta: parsed.quantity, reason: parsed.reason },
  });

  if (product.reorderLevel !== null) {
    notifyLowStockIfNeeded(parsed.productId, product.name, newTotalStock, product.reorderLevel).catch((err) =>
      console.error("[adjustStock] low-stock notification failed:", err)
    );
  }

  revalidatePath("/admin/inventory");
  revalidatePath("/admin/products");
  revalidatePath("/");
  return {};
}
