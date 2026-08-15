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

/**
 * Decrements a specific warehouse's stock and keeps Product.stock (the
 * cross-warehouse total) in sync.
 *
 * The check ("is there enough stock?") and the write must happen as one
 * atomic operation, or two concurrent callers can both read the same
 * pre-decrement quantity, both pass the check, and both decrement — a
 * classic TOCTOU race that overs sells stock. This showed up for real under
 * load testing (150 concurrent orders against 100 units of stock produced
 * 107 successful orders and warehouse stock of -7). The fix is a single
 * conditional UPDATE: Postgres takes a row lock as part of evaluating the
 * WHERE clause, so the quantity check and the decrement can never be split
 * by another transaction the way two separate statements can.
 */
export async function decrementWarehouseStock(
  tx: Tx,
  params: { productId: string; warehouseId: string; quantity: number }
) {
  await tx.warehouseStock.upsert({
    where: { productId_warehouseId: { productId: params.productId, warehouseId: params.warehouseId } },
    create: { productId: params.productId, warehouseId: params.warehouseId, quantity: 0 },
    update: {},
  });
  const result = await tx.warehouseStock.updateMany({
    where: {
      productId: params.productId,
      warehouseId: params.warehouseId,
      quantity: { gte: params.quantity },
    },
    data: { quantity: { decrement: params.quantity } },
  });
  if (result.count === 0) {
    throw new Error("Insufficient stock at the assigned warehouse");
  }
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
