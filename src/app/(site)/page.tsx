import Link from "next/link";
import { ProductImage } from "@/components/product/product-image";
import { ProductCard } from "@/components/product/product-card";
import { getCategories, getFeaturedProducts } from "@/lib/data";

export const revalidate = 60;

export default async function Home() {
  const [categories, featured] = await Promise.all([
    getCategories(),
    getFeaturedProducts(8),
  ]);

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div
          className="blob animate-blob-float absolute -right-32 top-10 h-96 w-96 bg-gradient-to-br from-saffron to-chili opacity-90 sm:-right-16"
          aria-hidden
        />
        <div
          className="blob-alt absolute -left-24 bottom-0 h-72 w-72 bg-basil/20"
          aria-hidden
        />

        <div className="relative mx-auto grid max-w-7xl items-center gap-10 px-4 py-16 sm:py-24 lg:grid-cols-2 lg:py-28">
          <div>
            <span className="inline-block rounded-full bg-cream-dark px-4 py-1.5 text-sm font-semibold font-heading text-chili">
              🔥 Now delivering across Karachi
            </span>
            <h1 className="mt-5 font-heading text-4xl font-extrabold leading-[1.1] text-balance sm:text-5xl lg:text-6xl">
              Real flavor, <span className="text-chili">straight</span> from Kun Foods.
            </h1>
            <p className="mt-5 max-w-lg text-lg text-ink-soft">
              Hand-ground spices, slow-cured pickles, and pantry staples made the traditional
              way — no shortcuts, no fillers. Just the taste of home, delivered fresh.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/collections/all"
                className="btn-3d rounded-full bg-chili px-7 py-3.5 font-heading font-semibold text-white hover:bg-chili-dark"
              >
                Shop all products
              </Link>
              <Link
                href="/collections/spices-masalas"
                className="rounded-full border-2 border-ink px-7 py-3.5 font-heading font-semibold text-ink hover:bg-ink hover:text-cream"
              >
                Explore spices
              </Link>
            </div>
          </div>

          <div className="relative mx-auto grid w-full max-w-md grid-cols-2 gap-4">
            <ProductImage emoji="🌶️" seed="hero-1" shape="blob" className="col-span-2 aspect-[2/1]" size="text-7xl" />
            <ProductImage emoji="🥭" seed="hero-2" shape="blob-alt" className="aspect-square" size="text-5xl" />
            <ProductImage emoji="🍛" seed="hero-3" shape="circle" className="aspect-square" size="text-5xl" />
          </div>
        </div>
      </section>

      {/* Trust strip */}
      <section className="border-y border-ink/10 bg-cream-dark/60">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-6 px-4 py-8 text-center sm:grid-cols-4">
          {[
            ["🌿", "100% authentic recipes"],
            ["🚚", "Fast, tracked delivery"],
            ["💵", "Cash on delivery"],
            ["♻️", "No fillers or preservatives"],
          ].map(([icon, label]) => (
            <div key={label} className="flex flex-col items-center gap-1.5">
              <span className="text-2xl">{icon}</span>
              <p className="text-sm font-medium text-ink-soft">{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Shop by category */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:py-20">
        <div className="mb-10 flex items-end justify-between gap-4">
          <h2 className="font-heading text-3xl font-extrabold sm:text-4xl">Shop by category</h2>
          <Link href="/collections/all" className="hidden font-semibold text-chili hover:underline sm:block">
            View all →
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-6">
          {categories.map((cat) => (
            <Link key={cat.id} href={`/collections/${cat.slug}`} className="group flex flex-col items-center gap-3 text-center">
              <ProductImage
                emoji={cat.image ?? "🍽️"}
                seed={cat.slug}
                className="aspect-square w-full transition-transform group-hover:scale-105"
                size="text-4xl"
              />
              <span className="font-heading text-sm font-semibold leading-tight">{cat.name}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured products */}
      <section className="mx-auto max-w-7xl px-4 py-4 sm:py-8">
        <div className="mb-10 flex items-end justify-between gap-4">
          <div>
            <h2 className="font-heading text-3xl font-extrabold sm:text-4xl">Customer favorites</h2>
            <p className="mt-2 text-ink-soft">The products our customers keep coming back for.</p>
          </div>
          <Link href="/collections/all" className="hidden font-semibold text-chili hover:underline sm:block">
            View all →
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-x-5 gap-y-10 sm:grid-cols-3 lg:grid-cols-4">
          {featured.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>

      {/* Story banner */}
      <section className="relative mx-4 my-20 overflow-hidden rounded-[2.5rem] bg-basil px-6 py-16 text-center text-white sm:mx-auto sm:max-w-7xl sm:px-16">
        <div className="blob absolute -left-16 -top-16 h-56 w-56 bg-white/10" aria-hidden />
        <div className="blob-alt absolute -bottom-20 -right-10 h-64 w-64 bg-white/10" aria-hidden />
        <div className="relative">
          <h2 className="font-heading text-3xl font-extrabold sm:text-4xl">
            From our kitchen to yours, since day one.
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-white/85">
            Kun Foods started with one family recipe and a promise: never cut corners. Today
            every jar is still made in small batches, tested by hand, and shipped fresh.
          </p>
          <Link
            href="/about"
            className="mt-7 inline-block rounded-full bg-white px-7 py-3.5 font-heading font-semibold text-basil-dark hover:bg-cream"
          >
            Our story
          </Link>
        </div>
      </section>

      {/* Testimonials */}
      <section className="mx-auto max-w-7xl px-4 pb-20">
        <h2 className="mb-10 text-center font-heading text-3xl font-extrabold sm:text-4xl">
          Loved across Pakistan
        </h2>
        <div className="grid gap-6 sm:grid-cols-3">
          {[
            {
              name: "Ayesha K.",
              quote:
                "The garam masala tastes exactly like my grandmother's blend. Ordering again for Eid!",
            },
            {
              name: "Bilal R.",
              quote: "Fast delivery and the mango achaar is unreal. Kun Foods is my new go-to.",
            },
            {
              name: "Sana M.",
              quote:
                "Finally a spice brand that doesn't cut corners. You can taste the difference.",
            },
          ].map((t) => (
            <div key={t.name} className="rounded-3xl bg-cream-dark p-6">
              <p className="text-saffron-dark">★★★★★</p>
              <p className="mt-3 text-ink-soft">&ldquo;{t.quote}&rdquo;</p>
              <p className="mt-4 font-heading font-semibold">{t.name}</p>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
