/**
 * Products that share a variantGroupId (e.g. the same spice blend in 100g/500g/1kg)
 * render as one storefront listing card instead of one per size — the cheapest
 * variant is shown as the representative, with a "N sizes" badge and a picker
 * on its own product page linking out to the sibling variants' pages.
 */
export function dedupeByVariantGroup<T extends { id: string; variantGroupId: string | null; price: number }>(
  products: T[]
): (T & { variantCount: number })[] {
  const groups = new Map<string, T[]>();
  for (const p of products) {
    const key = p.variantGroupId ?? p.id;
    const list = groups.get(key);
    if (list) list.push(p);
    else groups.set(key, [p]);
  }
  const result: (T & { variantCount: number })[] = [];
  for (const list of groups.values()) {
    const cheapest = list.reduce((min, cur) => (cur.price < min.price ? cur : min), list[0]);
    result.push({ ...cheapest, variantCount: list.length });
  }
  return result;
}
