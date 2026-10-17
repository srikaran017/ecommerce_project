"use client";

import React, { Suspense } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { WishlistClient } from "@/app/wishlist/WishlistClient";

export default function AccountWishlistPage() {
  return (
    <div className="min-h-screen bg-[var(--background)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-4">
        {/* Breadcrumb Navigation */}
        <nav className="flex items-center gap-2 text-xs text-neutral-500 font-medium">
          <Link href="/" className="hover:text-neutral-900 transition-colors">
            Home
          </Link>
          <span className="text-neutral-300">/</span>
          <Link href="/account" className="hover:text-neutral-900 transition-colors">
            Account
          </Link>
          <span className="text-neutral-300">/</span>
          <span className="text-neutral-900 font-semibold">Wishlist</span>
        </nav>

        <div>
          <Link
            href="/account"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-neutral-600 hover:text-neutral-900 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to account</span>
          </Link>
        </div>
      </div>

      <Suspense
        fallback={
          <div className="py-24 text-center">
            <div className="w-7 h-7 rounded-full border-2 border-neutral-300 border-t-neutral-900 animate-spin mx-auto" />
            <p className="text-xs text-neutral-500 mt-2 font-medium">Loading wishlist...</p>
          </div>
        }
      >
        <WishlistClient />
      </Suspense>
    </div>
  );
}
