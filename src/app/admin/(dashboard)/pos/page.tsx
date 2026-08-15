import { prisma } from "@/lib/prisma";
import { getActiveShippingZones } from "@/lib/shipping";
import { PosClient } from "@/components/admin/pos-client";

export default async function AdminPosPage() {
  const [products, bundles, zones] = await Promise.all([
    prisma.product.findMany({ where: { active: true }, orderBy: { name: "asc" } }),
    prisma.bundle.findMany({ where: { active: true }, orderBy: { name: "asc" } }),
    getActiveShippingZones(),
  ]);

  return (
    <div>
      <h1 className="font-heading text-3xl font-extrabold">Point of Sale</h1>
      <p className="mt-1 text-ink-soft">Create an order for an in-store or phone sale.</p>
      <div className="mt-8">
        <PosClient
          products={products.map((p) => ({
            id: p.id,
            name: p.name,
            price: p.price,
            stock: p.stock,
            image: JSON.parse(p.images)[0] ?? "🍽️",
          }))}
          bundles={bundles.map((b) => ({ id: b.id, name: b.name, price: b.price, image: b.image }))}
          zones={zones.map((z) => ({ city: z.city, rate: z.rate, freeAbove: z.freeAbove }))}
        />
      </div>
    </div>
  );
}
