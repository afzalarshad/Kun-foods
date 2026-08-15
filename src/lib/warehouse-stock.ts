import type { Prisma, PrismaClient } from "@prisma/client";
import { prisma } from "@/lib/prisma";

type Tx = Prisma.TransactionClient | PrismaClient;

export async function getDefaultWarehouse(tx: Tx = prisma) {
  const preferred = await tx.warehouse.findFirst({ where: { isDefault: true, active: true } });
  if (preferred) return preferred;
  return tx.warehouse.findFirstOrThrow({ where: { active: true }, orderBy: { createdAt: "asc" } });
}

/**
 * Picks the single warehouse that can fully cover every line in `neededStock`
 * (productId -> quantity). Orders aren't split across locations — a location
 * either has everything the order needs or it isn't a candidate. Preference:
 * a warehouse whose city matches the delivery city, then the default
 * warehouse, then whichever qualifying warehouse comes first.
 */
export async function resolveFulfillmentWarehouse(
  tx: Tx,
  city: string,
  neededStock: Map<string, number>
): Promise<{ id: string; name: string } | null> {
  const productIds = [...neededStock.keys()];
  const warehouses = await tx.warehouse.findMany({
    where: { active: true },
    include: { stockLevels: { where: { productId: { in: productIds } } } },
  });

  const candidates = warehouses.filter((w) => {
    const levels = new Map(w.stockLevels.map((s) => [s.productId, s.quantity]));
    for (const [productId, qty] of neededStock) {
      if ((levels.get(productId) ?? 0) < qty) return false;
    }
    return true;
  });
  if (candidates.length === 0) return null;

  const cityLower = city.trim().toLowerCase();
  const cityMatch = candidates.find((w) => w.city.toLowerCase() === cityLower);
  if (cityMatch) return cityMatch;
  const defaultMatch = candidates.find((w) => w.isDefault);
  if (defaultMatch) return defaultMatch;
  return candidates[0];
}

/** Decrements a specific warehouse's stock and keeps Product.stock (the cross-warehouse total) in sync. */
export async function decrementWarehouseStock(
  tx: Tx,
  params: { productId: string; warehouseId: string; quantity: number }
) {
  const level = await tx.warehouseStock.upsert({
    where: { productId_warehouseId: { productId: params.productId, warehouseId: params.warehouseId } },
    create: { productId: params.productId, warehouseId: params.warehouseId, quantity: 0 },
    update: {},
  });
  if (level.quantity < params.quantity) {
    throw new Error("Insufficient stock at the assigned warehouse");
  }
  await tx.warehouseStock.update({ where: { id: level.id }, data: { quantity: { decrement: params.quantity } } });
  await tx.product.update({ where: { id: params.productId }, data: { stock: { decrement: params.quantity } } });
}

/** Increments a specific warehouse's stock and keeps Product.stock (the cross-warehouse total) in sync. */
export async function incrementWarehouseStock(
  tx: Tx,
  params: { productId: string; warehouseId: string; quantity: number }
) {
  await tx.warehouseStock.upsert({
    where: { productId_warehouseId: { productId: params.productId, warehouseId: params.warehouseId } },
    create: { productId: params.productId, warehouseId: params.warehouseId, quantity: params.quantity },
    update: { quantity: { increment: params.quantity } },
  });
  await tx.product.update({ where: { id: params.productId }, data: { stock: { increment: params.quantity } } });
}
