import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { BundleForm } from "@/components/admin/bundle-form";
import { updateBundle } from "@/app/admin/(dashboard)/bundles/actions";

export default async function EditBundlePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [bundle, products] = await Promise.all([
    prisma.bundle.findUnique({ where: { id }, include: { items: true } }),
    prisma.product.findMany({ orderBy: { name: "asc" } }),
  ]);

  if (!bundle) notFound();

  const updateWithId = updateBundle.bind(null, bundle.id);

  return (
    <div>
      <h1 className="font-heading text-3xl font-extrabold">Edit bundle</h1>
      <p className="mt-1 text-ink-soft">{bundle.name}</p>
      <div className="mt-8">
        <BundleForm action={updateWithId} products={products} bundle={bundle} bundleItems={bundle.items} />
      </div>
    </div>
  );
}
