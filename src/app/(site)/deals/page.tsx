import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { formatPrice } from "@/lib/format";
import { ProductImage } from "@/components/product/product-image";
import { AddBundleToCart } from "@/components/product/add-bundle-to-cart";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Deals & Bundles",
  description: "Save more with Kun Foods bundle deals — grouped favorites at a special price.",
};

export default async function DealsPage() {
  const bundles = await prisma.bundle.findMany({
    where: { active: true },
    include: { items: { include: { product: true } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:py-14">
      <div className="mb-10 flex flex-col items-center gap-4 text-center">
        <ProductImage emoji="🎁" seed="deals" className="h-20 w-20" size="text-4xl" />
        <div>
          <h1 className="font-heading text-3xl font-extrabold sm:text-4xl">Deals & Bundles</h1>
          <p className="mt-1 text-ink-soft">Grouped favorites, bundled at a better price.</p>
        </div>
      </div>

      {bundles.length === 0 ? (
        <p className="py-20 text-center text-ink-soft">No bundle deals right now — check back soon.</p>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {bundles.map((bundle) => {
            const componentTotal = bundle.items.reduce(
              (sum, i) => sum + i.product.price * i.quantity,
              0
            );
            const savings = componentTotal - bundle.price;
            return (
              <div key={bundle.id} className="flex flex-col rounded-3xl bg-cream-dark p-6">
                <div className="flex items-center gap-3">
                  <ProductImage
                    emoji={bundle.image}
                    seed={bundle.slug}
                    shape="circle"
                    className="h-16 w-16 shrink-0"
                    size="text-2xl"
                  />
                  <div>
                    <h2 className="font-heading text-lg font-bold">{bundle.name}</h2>
                    {savings > 0 && (
                      <span className="rounded-full bg-basil px-2.5 py-0.5 text-xs font-semibold text-white">
                        Save {formatPrice(savings)}
                      </span>
                    )}
                  </div>
                </div>

                <p className="mt-3 text-sm text-ink-soft">{bundle.description}</p>

                <ul className="mt-3 flex flex-col gap-1 text-sm text-ink-soft">
                  {bundle.items.map((i) => (
                    <li key={i.id}>
                      • {i.product.name} × {i.quantity}
                    </li>
                  ))}
                </ul>

                <div className="mt-4 flex items-center gap-2">
                  <span className="font-heading text-2xl font-bold text-chili">
                    {formatPrice(bundle.price)}
                  </span>
                  {savings > 0 && (
                    <span className="text-sm text-ink-soft line-through">
                      {formatPrice(componentTotal)}
                    </span>
                  )}
                </div>

                <div className="mt-4">
                  <AddBundleToCart
                    bundleId={bundle.id}
                    name={bundle.name}
                    price={bundle.price}
                    image={bundle.image}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
