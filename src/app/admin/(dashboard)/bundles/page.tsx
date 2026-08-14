import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatPrice } from "@/lib/format";
import { DeleteButton } from "@/components/admin/delete-button";
import { deleteBundle } from "@/app/admin/(dashboard)/bundles/actions";

export default async function AdminBundlesPage() {
  const bundles = await prisma.bundle.findMany({
    include: { items: { include: { product: true } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-3xl font-extrabold">Bundles</h1>
          <p className="mt-1 text-ink-soft">{bundles.length} total</p>
        </div>
        <Link
          href="/admin/bundles/new"
          className="rounded-full bg-chili px-5 py-2.5 font-heading font-semibold text-white hover:bg-chili-dark"
        >
          + Add bundle
        </Link>
      </div>

      <div className="mt-8 flex flex-col gap-4">
        {bundles.length === 0 && (
          <p className="rounded-3xl bg-white p-8 text-center text-ink-soft shadow-sm">
            No bundles yet.
          </p>
        )}
        {bundles.map((b) => {
          const componentTotal = b.items.reduce((sum, i) => sum + i.product.price * i.quantity, 0);
          return (
            <div key={b.id} className="rounded-3xl bg-white p-6 shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <span className="text-3xl">{b.image}</span>
                  <div>
                    <p className="font-heading font-bold">
                      {b.name}{" "}
                      {!b.active && (
                        <span className="ml-1 rounded-full bg-cream-dark px-2 py-0.5 text-xs font-medium">
                          Inactive
                        </span>
                      )}
                    </p>
                    <p className="mt-1 text-sm text-ink-soft">
                      {b.items.map((i) => `${i.product.name} × ${i.quantity}`).join(", ")}
                    </p>
                    <p className="mt-1 text-sm">
                      <span className="font-semibold text-chili">{formatPrice(b.price)}</span>{" "}
                      <span className="text-ink-soft line-through">{formatPrice(componentTotal)}</span>
                    </p>
                  </div>
                </div>
                <div className="flex shrink-0 gap-3 text-sm">
                  <Link href={`/admin/bundles/${b.id}/edit`} className="font-medium text-basil hover:underline">
                    Edit
                  </Link>
                  <DeleteButton
                    confirmMessage={`Delete bundle "${b.name}"?`}
                    action={deleteBundle.bind(null, b.id)}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
