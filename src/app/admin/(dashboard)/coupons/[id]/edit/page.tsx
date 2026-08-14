import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { CouponForm } from "@/components/admin/coupon-form";
import { updateCoupon } from "@/app/admin/(dashboard)/coupons/actions";

export default async function EditCouponPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const coupon = await prisma.coupon.findUnique({ where: { id } });
  if (!coupon) notFound();

  const updateWithId = updateCoupon.bind(null, coupon.id);

  return (
    <div>
      <h1 className="font-heading text-3xl font-extrabold">Edit coupon</h1>
      <p className="mt-1 text-ink-soft">{coupon.code}</p>
      <div className="mt-8">
        <CouponForm action={updateWithId} coupon={coupon} />
      </div>
    </div>
  );
}
