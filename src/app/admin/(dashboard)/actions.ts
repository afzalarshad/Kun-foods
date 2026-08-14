"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin, slugify } from "@/lib/require-admin";
import { notifyOrderStatusChanged } from "@/lib/notifications";
import { logAudit } from "@/lib/audit";

const productSchema = z.object({
  name: z.string().min(2).max(150),
  categoryId: z.string().min(1),
  description: z.string().min(5).max(2000),
  price: z.coerce.number().int().min(1),
  compareAtPrice: z.coerce.number().int().min(0).optional(),
  costPrice: z.coerce.number().min(0).optional(),
  sku: z.string().max(60).optional(),
  barcode: z.string().max(60).optional(),
  supplier: z.string().max(150).optional(),
  reorderLevel: z.coerce.number().int().min(0).optional(),
  weightLabel: z.string().max(50).optional(),
  badge: z.string().max(30).optional(),
  stock: z.coerce.number().int().min(0),
  featured: z.coerce.boolean().optional(),
  image: z.string().min(1).max(10),
});

function parseProductForm(formData: FormData) {
  return productSchema.parse({
    name: formData.get("name"),
    categoryId: formData.get("categoryId"),
    description: formData.get("description"),
    price: formData.get("price"),
    compareAtPrice: formData.get("compareAtPrice") || undefined,
    costPrice: formData.get("costPrice") || undefined,
    sku: formData.get("sku") || undefined,
    barcode: formData.get("barcode") || undefined,
    supplier: formData.get("supplier") || undefined,
    reorderLevel: formData.get("reorderLevel") || undefined,
    weightLabel: formData.get("weightLabel") || undefined,
    badge: formData.get("badge") || undefined,
    stock: formData.get("stock"),
    featured: formData.get("featured") === "on",
    image: formData.get("image"),
  });
}

export async function createProduct(formData: FormData) {
  const session = await requireAdmin();
  const parsed = parseProductForm(formData);

  let slug = slugify(parsed.name);
  const existing = await prisma.product.findUnique({ where: { slug } });
  if (existing) slug = `${slug}-${Date.now().toString(36)}`;

  const created = await prisma.product.create({
    data: {
      name: parsed.name,
      slug,
      description: parsed.description,
      price: Math.round(parsed.price * 100),
      compareAtPrice: parsed.compareAtPrice ? Math.round(parsed.compareAtPrice * 100) : null,
      costPrice: parsed.costPrice !== undefined ? Math.round(parsed.costPrice * 100) : null,
      sku: parsed.sku || null,
      barcode: parsed.barcode || null,
      supplier: parsed.supplier || null,
      reorderLevel: parsed.reorderLevel ?? null,
      images: JSON.stringify([parsed.image]),
      badge: parsed.badge || null,
      weightLabel: parsed.weightLabel || null,
      stock: parsed.stock,
      featured: parsed.featured ?? false,
      categoryId: parsed.categoryId,
    },
  });

  if (parsed.stock > 0) {
    await prisma.inventoryMovement.create({
      data: {
        productId: created.id,
        type: "restock",
        quantity: parsed.stock,
        reason: "Initial stock on product creation",
        actorEmail: session.user.email ?? "unknown",
      },
    });
  }

  await logAudit({
    actorEmail: session.user.email ?? "unknown",
    action: "product.create",
    entityType: "Product",
    entityId: created.id,
    after: { name: created.name, price: created.price, stock: created.stock },
  });

  revalidatePath("/admin/products");
  revalidatePath("/");
  redirect("/admin/products");
}

export async function updateProduct(productId: string, formData: FormData) {
  const session = await requireAdmin();
  const parsed = parseProductForm(formData);

  const before = await prisma.product.findUniqueOrThrow({ where: { id: productId } });

  const updated = await prisma.product.update({
    where: { id: productId },
    data: {
      name: parsed.name,
      description: parsed.description,
      price: Math.round(parsed.price * 100),
      compareAtPrice: parsed.compareAtPrice ? Math.round(parsed.compareAtPrice * 100) : null,
      costPrice: parsed.costPrice !== undefined ? Math.round(parsed.costPrice * 100) : null,
      sku: parsed.sku || null,
      barcode: parsed.barcode || null,
      supplier: parsed.supplier || null,
      reorderLevel: parsed.reorderLevel ?? null,
      images: JSON.stringify([parsed.image]),
      badge: parsed.badge || null,
      weightLabel: parsed.weightLabel || null,
      stock: parsed.stock,
      featured: parsed.featured ?? false,
      categoryId: parsed.categoryId,
    },
  });

  const stockDelta = parsed.stock - before.stock;
  if (stockDelta !== 0) {
    await prisma.inventoryMovement.create({
      data: {
        productId,
        type: "adjustment",
        quantity: stockDelta,
        reason: "Manual stock edit via product form",
        actorEmail: session.user.email ?? "unknown",
      },
    });
  }

  await logAudit({
    actorEmail: session.user.email ?? "unknown",
    action: "product.update",
    entityType: "Product",
    entityId: productId,
    before: { name: before.name, price: before.price, stock: before.stock },
    after: { name: updated.name, price: updated.price, stock: updated.stock },
  });

  revalidatePath("/admin/products");
  revalidatePath("/");
  redirect("/admin/products");
}

export async function deleteProduct(productId: string) {
  const session = await requireAdmin();
  const before = await prisma.product.findUniqueOrThrow({ where: { id: productId } });
  await prisma.product.delete({ where: { id: productId } });

  await logAudit({
    actorEmail: session.user.email ?? "unknown",
    action: "product.delete",
    entityType: "Product",
    entityId: productId,
    before: { name: before.name, sku: before.sku },
  });

  revalidatePath("/admin/products");
  revalidatePath("/");
}

const statuses = ["pending", "processing", "shipped", "delivered", "cancelled"] as const;

export async function updateOrderStatus(orderId: string, formData: FormData) {
  const session = await requireAdmin();
  const status = z.enum(statuses).parse(formData.get("status"));
  const note = (formData.get("note") as string | null)?.trim() || undefined;
  const actorEmail = session.user.email ?? "unknown";

  const before = await prisma.order.findUniqueOrThrow({ where: { id: orderId } });

  const order = await prisma.order.update({
    where: { id: orderId },
    data: {
      status,
      cancellationReason: status === "cancelled" ? note ?? before.cancellationReason : before.cancellationReason,
    },
    include: { items: true },
  });

  await prisma.orderStatusEvent.create({
    data: { orderId, status, note, actorEmail },
  });

  await logAudit({
    actorEmail,
    action: "order.status_update",
    entityType: "Order",
    entityId: orderId,
    before: { status: before.status },
    after: { status },
  });

  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${orderId}`);

  notifyOrderStatusChanged(order).catch((err) =>
    console.error("[updateOrderStatus] notification failed:", err)
  );
}
