import React, { Suspense } from "react";
import { featureConfig } from "@/config/feature.config";
import { storeConfig } from "@/config/store.config";
import { notFound } from "next/navigation";
import { WishlistClient } from "./WishlistClient";

export const metadata = {
  title: `My Saved Wishlist | ${storeConfig.name}`,
  description: "View your saved luxury garments, check stock availability, and move garments to your cart.",
};

export default function WishlistPage() {
  if (!featureConfig.wishlist) {
    notFound();
  }

  return (
    <Suspense
      fallback={
        <div className="py-24 bg-[var(--background)] min-h-[70vh] flex items-center justify-center">
          <div className="text-center space-y-3">
            <div className="w-10 h-10 rounded-full border-2 border-neutral-300 border-t-neutral-900 animate-spin mx-auto" />
            <p className="text-xs text-neutral-400 font-medium">Loading your wishlist...</p>
          </div>
        </div>
      }
    >
      <WishlistClient />
    </Suspense>
  );
}
