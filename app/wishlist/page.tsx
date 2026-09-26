import React from "react";
import Link from "next/link";
import { featureConfig } from "@/config/feature.config";
import { notFound } from "next/navigation";
import { FALLBACK_PRODUCTS } from "@/services/product.service";
import { ProductCard } from "@/components/product/ProductCard";
import { Heart } from "lucide-react";
import { Button } from "@/components/ui/Button";

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

  return (
    <div className="py-12 bg-[var(--background)] min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center max-w-xl mx-auto mb-12 space-y-3">
          <div className="inline-flex p-3 rounded-full bg-[var(--muted)] text-[var(--primary)] mb-2">
            <Heart className="w-6 h-6 fill-[var(--primary)]" />
          </div>
          <h1 className="font-heading text-3xl sm:text-4xl font-bold uppercase tracking-tight text-[var(--foreground)]">
            YOUR SAVED WISHLIST
          </h1>
          <p className="text-xs sm:text-sm text-[var(--muted-foreground)]">
            Keep track of your favorite artisanal garments and limited edition seasonal releases.
          </p>
        </div>

        {wishlistedProducts.length === 0 ? (
          <div className="py-16 text-center space-y-4 max-w-md mx-auto">
            <p className="text-sm font-semibold uppercase tracking-widest text-[var(--muted-foreground)]">
              Your wishlist is currently empty
            </p>
            <Link href="/products">
              <Button variant="primary" size="md">
                EXPLORE COLLECTION
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {wishlistedProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}

      </div>
    </div>
  );
}
