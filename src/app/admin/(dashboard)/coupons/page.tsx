import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatPrice } from "@/lib/format";
import { DeleteButton } from "@/components/admin/delete-button";
import { deleteCoupon } from "@/app/admin/(dashboard)/coupons/actions";

export default async function AdminCouponsPage() {
  const coupons = await prisma.coupon.findMany({ orderBy: { createdAt: "desc" } });

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-3xl font-extrabold">Coupons</h1>
          <p className="mt-1 text-ink-soft">{coupons.length} total</p>
        </div>
        <Link
          href="/admin/coupons/new"
          className="rounded-full bg-chili px-5 py-2.5 font-heading font-semibold text-white hover:bg-chili-dark"
        >
          + Add coupon
        </Link>
      </div>

      <div className="mt-8 overflow-x-auto rounded-3xl bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-ink/10 text-ink-soft">
              <th className="px-6 py-3 font-medium">Code</th>
              <th className="px-6 py-3 font-medium">Discount</th>
              <th className="px-6 py-3 font-medium">Used</th>
              <th className="px-6 py-3 font-medium">Status</th>
              <th className="px-6 py-3 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {coupons.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-ink-soft">
                  No coupons yet.
                </td>
              </tr>
            )}
            {coupons.map((c) => {
              const expired = c.expiresAt ? c.expiresAt < new Date() : false;
              return (
                <tr key={c.id} className="border-b border-ink/5 last:border-0">
                  <td className="px-6 py-3 font-mono font-semibold">{c.code}</td>
                  <td className="px-6 py-3">
                    {c.type === "percentage" ? `${c.value}% off` : `${formatPrice(c.value)} off`}
                    {c.minSubtotal > 0 && (
                      <span className="text-ink-soft"> · min {formatPrice(c.minSubtotal)}</span>
                    )}
                  </td>
                  <td className="px-6 py-3">
                    {c.usedCount}
                    {c.usageLimit ? ` / ${c.usageLimit}` : ""}
                  </td>
                  <td className="px-6 py-3">
                    {expired ? (
                      <span className="rounded-full bg-chili/20 px-3 py-1 text-xs font-semibold text-chili-dark">
                        Expired
                      </span>
                    ) : c.active ? (
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
                        href={`/admin/coupons/${c.id}/edit`}
                        className="font-medium text-basil hover:underline"
                      >
                        Edit
                      </Link>
                      <DeleteButton
                        confirmMessage={`Delete coupon "${c.code}"?`}
                        action={deleteCoupon.bind(null, c.id)}
                      />
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
