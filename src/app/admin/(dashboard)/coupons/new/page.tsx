import { CouponForm } from "@/components/admin/coupon-form";
import { createCoupon } from "@/app/admin/(dashboard)/coupons/actions";

export default function NewCouponPage() {
  return (
    <div>
      <h1 className="font-heading text-3xl font-extrabold">Add coupon</h1>
      <p className="mt-1 text-ink-soft">Create a new discount code for checkout.</p>
      <div className="mt-8">
        <CouponForm action={createCoupon} />
      </div>
    </div>
  );
}
