"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/auth.store";
import { FALLBACK_PRODUCTS } from "@/data/products.data";
import { FavouritesTab } from "../components/FavouritesTab";
import { ArrowLeft, Heart, CheckCircle2, X } from "lucide-react";

export default function AccountWishlistPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 4000);
  };

  return (
    <div className="min-h-screen bg-[#fafafa] py-10 sm:py-14">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        
        {/* Toast */}
        {toastMessage && (
          <div className="fixed top-20 right-4 sm:right-8 z-50 max-w-md bg-neutral-900 text-white px-5 py-3.5 rounded-2xl shadow-xl flex items-center justify-between gap-3 animate-fade-in">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <p className="text-xs font-medium">{toastMessage}</p>
            </div>
            <button onClick={() => setToastMessage(null)} className="text-neutral-400 hover:text-white p-1">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Breadcrumb Navigation */}
        <nav className="flex items-center gap-1.5 text-xs text-neutral-500 font-medium">
          <Link href="/" className="hover:text-neutral-900 transition-colors">
            Home
          </Link>
          <span>/</span>
          <Link href="/account" className="hover:text-neutral-900 transition-colors">
            Account Center
          </Link>
          <span>/</span>
          <span className="text-neutral-900 font-semibold">Favorites and Lists</span>
        </nav>

        {/* Header & Back Link */}
        <div className="space-y-2">
          <Link
            href="/account"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#2b97ba] hover:underline"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Account Center</span>
          </Link>
          <h1 className="text-2xl sm:text-3xl font-bold text-neutral-900 tracking-tight font-sans">
            Favorites and Lists
          </h1>
          <p className="text-xs text-neutral-500">
            Your saved products and collections of products.
          </p>
        </div>

        {/* Favourites Tab Component */}
        <FavouritesTab
          products={FALLBACK_PRODUCTS}
          onShowToast={showToast}
        />

      </div>
    </div>
  );
}
