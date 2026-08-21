import type { Metadata } from "next";
import Link from "next/link";
import { ProductImage } from "@/components/product/product-image";

export const metadata: Metadata = {
  title: "About Us",
  description: "The story behind Kun Foods — authentic recipes, made the traditional way.",
};

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-14 sm:py-20">
      <div className="text-center">
        <ProductImage emoji="🌶️" seed="about" className="mx-auto h-24 w-24" size="text-5xl" />
        <h1 className="mt-6 font-heading text-4xl font-extrabold">Our story</h1>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-ink-soft">
          Kun Foods started in a home kitchen with one family recipe and a simple promise:
          never cut corners.
        </p>
      </div>

      <div className="mt-14 grid gap-10 sm:grid-cols-2">
        <div>
          <h2 className="font-heading text-xl font-bold">Small batches, real ingredients</h2>
          <p className="mt-2 text-ink-soft">
            Every spice blend is stone-ground, every pickle is hand-cured, and every product
            is tested by our family before it reaches yours. No fillers, no shortcuts —
            just the taste of home.
          </p>
        </div>
        <div>
          <h2 className="font-heading text-xl font-bold">Sourced with care</h2>
          <p className="mt-2 text-ink-soft">
            We work directly with farmers across Pakistan to source the freshest chilies,
            turmeric, and rice — supporting local growers while keeping quality consistent.
          </p>
        </div>
      </div>

      <div className="mt-14 text-center">
        <Link
          href="/collections/all"
          className="btn-3d rounded-full bg-chili px-7 py-3.5 font-heading font-semibold text-white hover:bg-chili-dark"
        >
          Shop our products
        </Link>
      </div>
    </div>
  );
}
