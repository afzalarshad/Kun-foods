// Split out from src/lib/settings.ts (which pulls in the Prisma client) so client components
// like the first-order discount popup can import this constant without bundling server-only code.
export const FIRST_ORDER_COUPON_CODE = "WELCOME";
