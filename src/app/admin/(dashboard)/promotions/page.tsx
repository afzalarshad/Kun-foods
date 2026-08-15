import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatPrice } from "@/lib/format";
import { SEGMENTS } from "@/lib/segments";
import { DeleteButton } from "@/components/admin/delete-button";
import { deletePromotion } from "@/app/admin/(dashboard)/promotions/actions";

const segmentLabel = (id: string | null) => SEGMENTS.find((s) => s.id === id)?.label ?? id;

export default async function AdminPromotionsPage() {
  const [promotions, categories, products] = await Promise.all([
    prisma.promotion.findMany({ orderBy: { createdAt: "desc" } }),
    prisma.category.findMany(),
    prisma.product.findMany({ select: { id: true, name: true } }),
  ]);
  const categoryName = new Map(categories.map((c) => [c.id, c.name]));
  const productName = new Map(products.map((p) => [p.id, p.name]));

  const now = new Date();

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-3xl font-extrabold">Promotions</h1>
          <p className="mt-1 text-ink-soft">
            {promotions.length} total — automatic discounts applied at checkout and POS, no code needed.
          </p>
        </div>
        <Link
          href="/admin/promotions/new"
          className="rounded-full bg-chili px-5 py-2.5 font-heading font-semibold text-white hover:bg-chili-dark"
        >
          + Add promotion
        </Link>
      </div>

      <div className="mt-8 overflow-x-auto rounded-3xl bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-ink/10 text-ink-soft">
              <th className="px-6 py-3 font-medium">Name</th>
              <th className="px-6 py-3 font-medium">Discount</th>
              <th className="px-6 py-3 font-medium">Applies to</th>
              <th className="px-6 py-3 font-medium">Segment</th>
              <th className="px-6 py-3 font-medium">Schedule</th>
              <th className="px-6 py-3 font-medium">Status</th>
              <th className="px-6 py-3 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {promotions.length === 0 && (
              <tr>
                <td colSpan={7} className="px-6 py-8 text-center text-ink-soft">
                  No promotions yet.
                </td>
              </tr>
            )}
            {promotions.map((p) => {
              const scheduled = p.startsAt && p.startsAt > now;
              const expired = p.endsAt && p.endsAt < now;
              const target =
                p.scope === "all"
                  ? "Entire order"
                  : p.scope === "category"
                    ? (categoryName.get(p.categoryId ?? "") ?? "—")
                    : (productName.get(p.productId ?? "") ?? "—");

              return (
                <tr key={p.id} className="border-b border-ink/5 last:border-0">
                  <td className="px-6 py-3 font-semibold">{p.name}</td>
                  <td className="px-6 py-3">
                    {p.type === "percentage_off" && `${p.value}% off`}
                    {p.type === "fixed_off" && `${formatPrice(p.value ?? 0)} off`}
                    {p.type === "bogo" &&
                      `Buy ${p.buyQuantity}, get ${p.getQuantity} at ${p.getDiscountPercent}% off`}
                  </td>
                  <td className="px-6 py-3">{target}</td>
                  <td className="px-6 py-3">{p.segment ? segmentLabel(p.segment) : "Everyone"}</td>
                  <td className="px-6 py-3 text-xs text-ink-soft">
                    {p.startsAt ? p.startsAt.toLocaleDateString("en-PK") : "Any time"}
                    {" – "}
                    {p.endsAt ? p.endsAt.toLocaleDateString("en-PK") : "No end"}
                  </td>
                  <td className="px-6 py-3">
                    {!p.active ? (
                      <span className="rounded-full bg-cream-dark px-3 py-1 text-xs font-semibold">Inactive</span>
                    ) : expired ? (
                      <span className="rounded-full bg-chili/20 px-3 py-1 text-xs font-semibold text-chili-dark">
                        Expired
                      </span>
                    ) : scheduled ? (
                      <span className="rounded-full bg-saffron/20 px-3 py-1 text-xs font-semibold text-saffron-dark">
                        Scheduled
                      </span>
                    ) : (
                      <span className="rounded-full bg-basil/20 px-3 py-1 text-xs font-semibold text-basil-dark">
                        Active
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-3">
                    <div className="flex justify-end gap-3">
                      <Link
                        href={`/admin/promotions/${p.id}/edit`}
                        className="font-medium text-basil hover:underline"
                      >
                        Edit
                      </Link>
                      <DeleteButton
                        confirmMessage={`Delete promotion "${p.name}"?`}
                        action={deletePromotion.bind(null, p.id)}
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
