import { prisma } from "@/lib/prisma";
import { generateOrderNumber } from "@/lib/format";
import { getShippingRate } from "@/lib/shipping";
import { notifyOrderCreated } from "@/lib/notifications";

export type CreateOrderInput = {
  customerName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  postalCode?: string;
  notes?: string;
  paymentMethod: "cod" | "card" | "cash";
  source: "web" | "pos";
  status?: string;
  couponCode?: string;
  items: Array<{ type: "product" | "bundle"; id: string; quantity: number }>;
};

export class OrderError extends Error {}

export async function createOrder(input: CreateOrderInput) {
  if (input.items.length === 0) throw new OrderError("Cart is empty");

  const productIds = input.items.filter((i) => i.type === "product").map((i) => i.id);
  const bundleIds = input.items.filter((i) => i.type === "bundle").map((i) => i.id);

  const [directProducts, bundles] = await Promise.all([
    productIds.length
      ? prisma.product.findMany({ where: { id: { in: productIds } } })
      : Promise.resolve([]),
    bundleIds.length
      ? prisma.bundle.findMany({
          where: { id: { in: bundleIds } },
          include: { items: { include: { product: true } } },
        })
      : Promise.resolve([]),
  ]);

  const productMap = new Map(directProducts.map((p) => [p.id, p]));
  const bundleMap = new Map(bundles.map((b) => [b.id, b]));

  if (productIds.some((id) => !productMap.has(id))) {
    throw new OrderError("One or more products no longer exist");
  }
  if (bundleIds.some((id) => !bundleMap.has(id) || !bundleMap.get(id)!.active)) {
    throw new OrderError("One or more bundles are no longer available");
  }

  // Aggregate total product stock needed (direct + inside bundles)
  const neededStock = new Map<string, number>();
  for (const item of input.items) {
    if (item.type === "product") {
      neededStock.set(item.id, (neededStock.get(item.id) ?? 0) + item.quantity);
    } else {
      const bundle = bundleMap.get(item.id)!;
      for (const bi of bundle.items) {
        neededStock.set(
          bi.productId,
          (neededStock.get(bi.productId) ?? 0) + bi.quantity * item.quantity
        );
      }
    }
  }
  for (const [productId, qty] of neededStock) {
    const product =
      productMap.get(productId) ?? bundles.flatMap((b) => b.items).find((bi) => bi.productId === productId)?.product;
    if (product && product.stock < qty) {
      throw new OrderError(`${product.name} doesn't have enough stock`);
    }
  }

  const subtotal = input.items.reduce((sum, item) => {
    const unitPrice =
      item.type === "product" ? productMap.get(item.id)!.price : bundleMap.get(item.id)!.price;
    return sum + unitPrice * item.quantity;
  }, 0);

  let discount = 0;
  let couponId: string | undefined;
  if (input.couponCode) {
    const coupon = await prisma.coupon.findUnique({ where: { code: input.couponCode.trim().toUpperCase() } });
    if (!coupon || !coupon.active) throw new OrderError("Invalid coupon code");
    if (coupon.expiresAt && coupon.expiresAt < new Date()) throw new OrderError("This coupon has expired");
    if (coupon.usageLimit !== null && coupon.usedCount >= coupon.usageLimit) {
      throw new OrderError("This coupon has reached its usage limit");
    }
    if (subtotal < coupon.minSubtotal) {
      throw new OrderError(`This coupon requires a minimum order of ${coupon.minSubtotal / 100} Rs.`);
    }
    discount =
      coupon.type === "percentage" ? Math.round((subtotal * coupon.value) / 100) : coupon.value;
    discount = Math.min(discount, subtotal);
    couponId = coupon.id;
  }

  // An empty city means a walk-in/pickup POS sale — no delivery, no shipping charge.
  // Only look up a real shipping rate when a city was actually given.
  const rawCity = input.city.trim();
  const shipping = rawCity ? await getShippingRate(rawCity, subtotal - discount) : 0;
  const total = subtotal - discount + shipping;

  const city = rawCity || "Walk-in / Pickup";
  const address = input.address.trim() || "In-store purchase";

  const order = await prisma.$transaction(async (tx) => {
    const customer = await tx.customer.upsert({
      where: { email: input.email },
      update: { name: input.customerName, phone: input.phone, address, city },
      create: {
        name: input.customerName,
        email: input.email,
        phone: input.phone,
        address,
        city,
      },
    });

    const created = await tx.order.create({
      data: {
        orderNumber: generateOrderNumber(),
        customerId: customer.id,
        customerName: input.customerName,
        email: input.email,
        phone: input.phone,
        address,
        city,
        postalCode: input.postalCode,
        notes: input.notes,
        paymentMethod: input.paymentMethod,
        source: input.source,
        status: input.status ?? "pending",
        subtotal,
        discount,
        couponId,
        shipping,
        total,
        items: {
          create: input.items.map((item) => {
            if (item.type === "product") {
              const product = productMap.get(item.id)!;
              return { productId: product.id, name: product.name, price: product.price, quantity: item.quantity };
            }
            const bundle = bundleMap.get(item.id)!;
            return { bundleId: bundle.id, name: `${bundle.name} (bundle)`, price: bundle.price, quantity: item.quantity };
          }),
        },
      },
      include: { items: true },
    });

    for (const [productId, qty] of neededStock) {
      await tx.product.update({ where: { id: productId }, data: { stock: { decrement: qty } } });
      await tx.inventoryMovement.create({
        data: {
          productId,
          type: "sale",
          quantity: -qty,
          reason: `Order ${created.orderNumber}`,
          orderId: created.id,
        },
      });
    }

    if (couponId) {
      await tx.coupon.update({ where: { id: couponId }, data: { usedCount: { increment: 1 } } });
    }

    await tx.payment.create({
      data: {
        orderId: created.id,
        amount: total,
        method: input.paymentMethod,
        status: input.paymentMethod === "cod" ? "pending" : "paid",
      },
    });

    return created;
  });

  notifyOrderCreated(order).catch((err) => console.error("[create-order] notification failed:", err));

  return order;
}
