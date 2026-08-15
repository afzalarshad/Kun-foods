import { prisma } from "@/lib/prisma";

type NotificationType = "low_stock" | "new_order" | "new_ticket" | "return_requested";

export async function createAdminNotification(input: { type: NotificationType; message: string; link?: string }) {
  try {
    await prisma.adminNotification.create({
      data: { type: input.type, message: input.message, link: input.link },
    });
  } catch (err) {
    console.error("[admin-notifications] failed to create:", err);
  }
}

/** Fires once per product per low-stock episode -- skips if an unread low-stock alert for the same link already exists. */
export async function notifyLowStockIfNeeded(productId: string, productName: string, stock: number, reorderLevel: number) {
  if (stock > reorderLevel) return;
  const link = `/admin/inventory?product=${productId}`;
  const existing = await prisma.adminNotification.findFirst({
    where: { type: "low_stock", link, read: false },
  });
  if (existing) return;
  await createAdminNotification({
    type: "low_stock",
    message: `${productName} is low on stock — ${stock} left (reorder at ${reorderLevel})`,
    link,
  });
}
