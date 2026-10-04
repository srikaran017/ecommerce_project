"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/auth.store";
import { ProductCard } from "@/components/product/ProductCard";
import { Heart } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ProductData } from "@/data/products.data";

export function WishlistClient({ products }: { products: ProductData[] }) {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (isMounted && !isAuthenticated) {
      router.replace("/login?redirect=/wishlist");
    }
  }, [isMounted, isAuthenticated, router]);

  // Loading state during initial client check
  if (!isMounted || !isAuthenticated) {
    return (
      <div className="py-24 bg-[var(--background)] min-h-[70vh] flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 rounded-full border-2 border-neutral-300 border-t-neutral-900 animate-spin mx-auto" />
          <p className="text-xs text-neutral-400 font-medium">Verifying access...</p>
        </div>
      </div>
    );
  }

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

        {products.length === 0 ? (
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
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
