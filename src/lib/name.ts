import { z } from "zod";

/**
 * Letters and spaces only — no digits or symbols. Blocks a customer from putting a link, HTML,
 * or other markup into their name, which would otherwise render un-escaped in order notification
 * emails and admin-exported CSVs (a real phishing/injection vector, since the name is shown to
 * staff and echoed back to the customer themselves).
 */
const PERSON_NAME_PATTERN = /^[A-Za-zÀ-ɏ ]+$/;

export const PERSON_NAME_HTML_PATTERN = "[A-Za-z ]+";

export function isValidPersonName(value: string): boolean {
  return PERSON_NAME_PATTERN.test(value.trim());
}

export const personNameSchema = z
  .string()
  .trim()
  .min(2)
  .max(100)
  .refine(isValidPersonName, {
    message: "Name can only contain letters and spaces — no numbers or symbols.",
  });
