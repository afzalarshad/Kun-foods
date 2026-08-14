/** Prices are stored in paisa (1/100 PKR). */
export function formatPrice(paisa: number): string {
  const rupees = paisa / 100;
  return new Intl.NumberFormat("en-PK", {
    style: "currency",
    currency: "PKR",
    maximumFractionDigits: 0,
  }).format(rupees);
}

const FREE_SHIPPING_THRESHOLD = 300000; // Rs. 3,000 in paisa
const FLAT_SHIPPING_FEE = 20000; // Rs. 200 in paisa

export function calculateShipping(subtotal: number): number {
  return subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : FLAT_SHIPPING_FEE;
}

export function generateOrderNumber(): string {
  const date = new Date();
  const y = date.getFullYear().toString().slice(-2);
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `KF${y}${m}-${rand}`;
}

export function generateTicketNumber(): string {
  const date = new Date();
  const y = date.getFullYear().toString().slice(-2);
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `TKT${y}${m}-${rand}`;
}
