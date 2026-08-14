"use client";

import { useState } from "react";
import { useCart } from "@/store/cart";

export function AddBundleToCart({
  bundleId,
  name,
  price,
  image,
}: {
  bundleId: string;
  name: string;
  price: number;
  image: string;
}) {
  const addItem = useCart((s) => s.addItem);
  const [added, setAdded] = useState(false);

  return (
    <button
      onClick={() => {
        addItem({ type: "bundle", id: bundleId, name, price, image, weightLabel: null });
        setAdded(true);
        setTimeout(() => setAdded(false), 1800);
      }}
      className="w-full rounded-full bg-chili py-3 font-heading font-semibold text-white shadow-lg shadow-chili/20 hover:bg-chili-dark"
    >
      {added ? "Added to cart ✓" : "Add bundle to cart"}
    </button>
  );
}
