import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { ProductImage } from "@/components/product/product-image";
import { ProductCard } from "@/components/product/product-card";
import { AddToCart } from "@/components/product/add-to-cart";
import { getAllProducts, getProductBySlug, getRelatedProducts } from "@/lib/data";
import { formatPrice } from "@/lib/format";
import { whatsappLink } from "@/components/whatsapp-button";

export const revalidate = 60;

export async function generateStaticParams() {
  const products = await getAllProducts();
  return products.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return {};
  return {
    title: product.name,
    description: product.description,
  };
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const related = await getRelatedProducts(product.categorySlug, product.slug);
  const waLink = whatsappLink(
    `Hi! I'd like to order ${product.name} (${formatPrice(product.price)}) from Kun Foods.`
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:py-14">
      <nav className="mb-8 flex flex-wrap items-center gap-1.5 text-sm text-ink-soft">
        <Link href="/" className="hover:text-chili">Home</Link>
        <span>/</span>
        <Link href={`/collections/${product.categorySlug}`} className="hover:text-chili">
          {product.categoryName}
        </Link>
        <span>/</span>
        <span className="text-ink">{product.name}</span>
      </nav>

      <div className="grid gap-10 lg:grid-cols-2 lg:gap-16">
        <div className="grid grid-cols-4 gap-4 lg:sticky lg:top-24 lg:self-start">
          <ProductImage
            emoji={product.images[0] ?? "🍽️"}
            seed={product.slug}
            className="col-span-4 aspect-square"
            size="text-8xl"
          />
          {product.images.length > 1 &&
            product.images.slice(1).map((img, i) => (
              <ProductImage
                key={i}
                emoji={img}
                seed={`${product.slug}-${i}`}
                shape="circle"
                className="aspect-square"
                size="text-3xl"
              />
            ))}
        </div>

        <div>
          <p className="font-heading text-sm font-semibold uppercase tracking-wide text-basil">
            {product.categoryName}
          </p>
          <h1 className="mt-2 font-heading text-3xl font-extrabold sm:text-4xl">
            {product.name}
          </h1>
          {product.weightLabel && (
            <p className="mt-2 text-ink-soft">{product.weightLabel}</p>
          )}

          <div className="mt-4 flex items-center gap-3">
            <span className="font-heading text-3xl font-bold text-chili">
              {formatPrice(product.price)}
            </span>
            {product.compareAtPrice && (
              <span className="text-lg text-ink-soft line-through">
                {formatPrice(product.compareAtPrice)}
              </span>
            )}
          </div>

          <p className="mt-6 leading-relaxed text-ink-soft">{product.description}</p>

          <p className="mt-4 text-sm font-medium">
            {product.stock > 0 ? (
              <span className="text-basil">✓ In stock, ready to ship</span>
            ) : (
              <span className="text-chili">Out of stock</span>
            )}
          </p>

          <div className="mt-6">
            <AddToCart
              productId={product.id}
              name={product.name}
              slug={product.slug}
              price={product.price}
              image={product.images[0] ?? "🍽️"}
              weightLabel={product.weightLabel}
              inStock={product.stock > 0}
            />
            {waLink && (
              <a
                href={waLink}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 flex items-center justify-center gap-2 rounded-full border-2 border-[#25D366] py-3 font-heading font-semibold text-[#128C7E] hover:bg-[#25D366]/10"
              >
                💬 Order via WhatsApp
              </a>
            )}
          </div>

          <dl className="mt-10 grid grid-cols-2 gap-4 border-t border-ink/10 pt-6 text-sm">
            <div>
              <dt className="font-heading font-semibold">🚚 Delivery</dt>
              <dd className="mt-1 text-ink-soft">2–4 business days nationwide</dd>
            </div>
            <div>
              <dt className="font-heading font-semibold">💵 Payment</dt>
              <dd className="mt-1 text-ink-soft">Cash on delivery or card</dd>
            </div>
          </dl>
        </div>
      </div>

      {related.length > 0 && (
        <section className="mt-20">
          <h2 className="mb-8 font-heading text-2xl font-extrabold sm:text-3xl">
            You might also like
          </h2>
          <div className="grid grid-cols-2 gap-x-5 gap-y-10 sm:grid-cols-4">
            {related.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
