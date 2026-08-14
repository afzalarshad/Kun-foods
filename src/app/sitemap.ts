import type { MetadataRoute } from "next";
import { getAllProducts, getCategories } from "@/lib/data";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [products, categories] = await Promise.all([getAllProducts(), getCategories()]);
  const base = "https://kunfoods.example.com";

  return [
    { url: base, priority: 1 },
    { url: `${base}/collections/all`, priority: 0.9 },
    { url: `${base}/about`, priority: 0.5 },
    { url: `${base}/contact`, priority: 0.5 },
    { url: `${base}/track-order`, priority: 0.3 },
    ...categories.map((c) => ({ url: `${base}/collections/${c.slug}`, priority: 0.7 })),
    ...products.map((p) => ({ url: `${base}/products/${p.slug}`, priority: 0.6 })),
  ];
}
