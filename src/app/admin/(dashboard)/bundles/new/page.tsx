import { prisma } from "@/lib/prisma";
import { BundleForm } from "@/components/admin/bundle-form";
import { createBundle } from "@/app/admin/(dashboard)/bundles/actions";

export default async function NewBundlePage() {
  const products = await prisma.product.findMany({ orderBy: { name: "asc" } });

  return (
    <div>
      <h1 className="font-heading text-3xl font-extrabold">Add bundle</h1>
      <p className="mt-1 text-ink-soft">Group products together at a special price.</p>
      <div className="mt-8">
        <BundleForm action={createBundle} products={products} />
      </div>
    </div>
  );
}
