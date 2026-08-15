import { z } from "zod";

/** Matches 03XXXXXXXXX, +923XXXXXXXXX, 923XXXXXXXXX, or 00923XXXXXXXXX (spaces/dashes ignored). */
const PK_MOBILE_PATTERN = /^(?:\+92|0092|92|0)?3\d{9}$/;

function cleanDigits(value: string): string {
  return value.replace(/[\s-]/g, "");
}

export function isValidPakistaniMobile(value: string): boolean {
  return PK_MOBILE_PATTERN.test(cleanDigits(value));
}

/** Normalizes any accepted variant to the canonical local form, e.g. "03001234567". */
export function normalizePakistaniMobile(value: string): string {
  const match = cleanDigits(value).match(/^(?:\+92|0092|92|0)?(3\d{9})$/);
  return match ? `0${match[1]}` : value.trim();
}

export const PAKISTANI_MOBILE_PLACEHOLDER = "03XX-XXXXXXX";

export const pakistaniMobileSchema = z
  .string()
  .trim()
  .refine(isValidPakistaniMobile, {
    message: "Enter a valid Pakistani mobile number, e.g. 0300-1234567",
  })
  .transform(normalizePakistaniMobile);
