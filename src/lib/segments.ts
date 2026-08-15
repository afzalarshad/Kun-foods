export type SegmentId =
  | "new"
  | "returning"
  | "vip"
  | "high_value"
  | "inactive_30"
  | "inactive_90"
  | "frequent"
  | "coupon_users"
  | "cod"
  | "high_return";

export const SEGMENTS: { id: SegmentId; label: string }[] = [
  { id: "new", label: "New (30d)" },
  { id: "returning", label: "Returning" },
  { id: "frequent", label: "Frequent (3+)" },
  { id: "vip", label: "VIP tag" },
  { id: "high_value", label: "High value" },
  { id: "inactive_30", label: "Inactive 30d" },
  { id: "inactive_90", label: "Inactive 90d" },
  { id: "coupon_users", label: "Coupon users" },
  { id: "cod", label: "COD" },
  { id: "high_return", label: "High return" },
];

const HIGH_VALUE_THRESHOLD_PAISA = 500000; // Rs. 5,000
const DAY_MS = 24 * 60 * 60 * 1000;

export type SegmentCustomer = {
  createdAt: Date;
  tags: { tag: string }[];
  orders: {
    total: number;
    status: string;
    createdAt: Date;
    couponId: string | null;
    paymentMethod: string;
    returns: { id: string }[];
  }[];
};

export function matchesSegment(customer: SegmentCustomer, segment: SegmentId): boolean {
  const nonCancelled = customer.orders.filter((o) => o.status !== "cancelled");
  const totalSpent = nonCancelled.reduce((sum, o) => sum + o.total, 0);
  const lastOrder = customer.orders.reduce<Date | null>(
    (latest, o) => (!latest || o.createdAt > latest ? o.createdAt : latest),
    null
  );
  const daysSinceLastOrder = lastOrder ? (Date.now() - lastOrder.getTime()) / DAY_MS : null;
  const returnCount = customer.orders.reduce((sum, o) => sum + o.returns.length, 0);

  switch (segment) {
    case "new":
      return Date.now() - customer.createdAt.getTime() <= 30 * DAY_MS;
    case "returning":
      return nonCancelled.length >= 2;
    case "frequent":
      return nonCancelled.length >= 3;
    case "vip":
      return customer.tags.some((t) => t.tag.toLowerCase() === "vip");
    case "high_value":
      return totalSpent >= HIGH_VALUE_THRESHOLD_PAISA;
    case "inactive_30":
      return daysSinceLastOrder !== null && daysSinceLastOrder > 30;
    case "inactive_90":
      return daysSinceLastOrder !== null && daysSinceLastOrder > 90;
    case "coupon_users":
      return customer.orders.some((o) => o.couponId !== null);
    case "cod":
      return customer.orders.some((o) => o.paymentMethod === "cod");
    case "high_return":
      return returnCount >= 2;
    default:
      return false;
  }
}
