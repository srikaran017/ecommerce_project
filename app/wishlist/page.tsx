import React from "react";
import { featureConfig } from "@/config/feature.config";
import { notFound } from "next/navigation";
import { FALLBACK_PRODUCTS } from "@/services/product.service";
import { WishlistClient } from "./WishlistClient";

export const metadata = {
  title: "My Wishlist | Maison De Élégance",
  description: "View your saved luxury garments and curate your dream capsule collection.",
};

export default function WishlistPage() {
  // Hard logical guard for feature flag
  if (!featureConfig.wishlist) {
    notFound();
  }

  // Sample wishlisted products
  const wishlistedProducts = FALLBACK_PRODUCTS.slice(0, 3);

  return <WishlistClient products={wishlistedProducts} />;
}

