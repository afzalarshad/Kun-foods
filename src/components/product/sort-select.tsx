"use client";

import { useRouter, useSearchParams } from "next/navigation";

export function SortSelect() {
  const router = useRouter();
  const searchParams = useSearchParams();

  return (
    <select
      defaultValue={searchParams.get("sort") ?? "featured"}
      onChange={(e) => {
        const params = new URLSearchParams(searchParams.toString());
        if (e.target.value === "featured") {
          params.delete("sort");
        } else {
          params.set("sort", e.target.value);
        }
        router.push(`?${params.toString()}`);
      }}
      className="rounded-full border border-ink/20 bg-cream px-4 py-2 text-sm font-medium focus:border-chili focus:outline-none"
    >
      <option value="featured">Featured</option>
      <option value="price-asc">Price: Low to High</option>
      <option value="price-desc">Price: High to Low</option>
      <option value="name-asc">Name: A–Z</option>
    </select>
  );
}
