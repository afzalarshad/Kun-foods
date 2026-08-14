import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatPrice } from "@/lib/format";
import { DeleteButton } from "@/components/admin/delete-button";
import { deleteShippingZone } from "@/app/admin/(dashboard)/shipping/actions";

export default async function AdminShippingPage() {
  const zones = await prisma.shippingZone.findMany({ orderBy: { city: "asc" } });

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-3xl font-extrabold">Shipping</h1>
          <p className="mt-1 text-ink-soft">
            {zones.length} {zones.length === 1 ? "city" : "cities"} configured
          </p>
        </div>
        <Link
          href="/admin/shipping/new"
          className="rounded-full bg-chili px-5 py-2.5 font-heading font-semibold text-white hover:bg-chili-dark"
        >
          + Add city
        </Link>
      </div>

      {zones.length === 0 && (
        <p className="mt-6 max-w-xl rounded-2xl bg-saffron/10 px-4 py-3 text-sm text-saffron-dark">
          No cities configured yet — checkout is using a flat fallback rate for every city. Add
          your first city below to start setting rates per city.
        </p>
      )}

      <div className="mt-8 overflow-x-auto rounded-3xl bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-ink/10 text-ink-soft">
              <th className="px-6 py-3 font-medium">City</th>
              <th className="px-6 py-3 font-medium">Rate</th>
              <th className="px-6 py-3 font-medium">Free above</th>
              <th className="px-6 py-3 font-medium">Status</th>
              <th className="px-6 py-3 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {zones.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-ink-soft">
                  No cities yet.
                </td>
              </tr>
            )}
            {zones.map((z) => (
              <tr key={z.id} className="border-b border-ink/5 last:border-0">
                <td className="px-6 py-3 font-medium">{z.city}</td>
                <td className="px-6 py-3">{z.rate === 0 ? "Free" : formatPrice(z.rate)}</td>
                <td className="px-6 py-3 text-ink-soft">
                  {z.freeAbove !== null ? formatPrice(z.freeAbove) : "—"}
                </td>
                <td className="px-6 py-3">
                  {z.active ? (
                    <span className="rounded-full bg-basil/20 px-3 py-1 text-xs font-semibold text-basil-dark">
                      Active
                    </span>
                  ) : (
                    <span className="rounded-full bg-cream-dark px-3 py-1 text-xs font-semibold">
                      Inactive
                    </span>
                  )}
                </td>
                <td className="px-6 py-3">
                  <div className="flex justify-end gap-3">
                    <Link
                      href={`/admin/shipping/${z.id}/edit`}
                      className="font-medium text-basil hover:underline"
                    >
                      Edit
                    </Link>
                    <DeleteButton
                      confirmMessage={`Delete shipping rate for "${z.city}"?`}
                      action={deleteShippingZone.bind(null, z.id)}
                    />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
