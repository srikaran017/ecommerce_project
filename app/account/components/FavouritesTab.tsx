"use client";

import React from "react";
import Link from "next/link";
import { ProductData } from "@/data/products.data";
import { useWishlistStore } from "@/stores/wishlist.store";
import { useCartStore } from "@/stores/cart.store";
import { storeConfig } from "@/config/store.config";
import {
  Heart,
  ShoppingBag,
  Trash2,
  ArrowRight,
  Sparkles,
} from "lucide-react";

interface FavouritesTabProps {
  products: ProductData[];
  onShowToast: (msg: string) => void;
}

export function FavouritesTab({ products, onShowToast }: FavouritesTabProps) {
  const { wishlistIds, removeFromWishlist, clearWishlist } = useWishlistStore();
  const { addItem } = useCartStore();

  const favoriteProducts = products.filter((p) => wishlistIds.includes(p.id));

  const handleMoveToBag = async (product: ProductData) => {
    const imageUrl =
      product.images?.[0]?.url ||
      product.thumbnail ||
      "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=500";
    const size = product.variants?.[0]?.size || "M";
    const colorName = product.variants?.[0]?.colorName || "Original";
    const colorHex = product.variants?.[0]?.colorHex;

    await addItem({
      productId: product.id,
      name: product.name,
      price: product.price,
      compareAtPrice: product.compareAtPrice ?? undefined,
      size,
      colorName,
      colorHex,
      imageUrl,
      quantity: 1,
    });
    await removeFromWishlist(product.id);
    onShowToast(`"${product.name}" moved to your shopping bag!`);
  };

  const handleRemove = (product: ProductData) => {
    removeFromWishlist(product.id);
    onShowToast(`Removed "${product.name}" from your favourites.`);
  };

  return (
    <div className="bg-white rounded-3xl border border-neutral-200/80 p-6 sm:p-8 shadow-sm space-y-8 animate-fade-in">
      {/* Header */}
      <div className="border-b border-neutral-100 pb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base sm:text-lg font-bold uppercase tracking-tight text-neutral-900 flex items-center gap-2">
            <Heart className="w-5 h-5 text-rose-600 fill-rose-600" />
            <span>Saved Favourites & Capsule Wishlist</span>
          </h2>
          <p className="text-xs text-neutral-500 mt-0.5">
            Curate your personal collection of artisanal creations and seasonal high-fashion releases.
          </p>
        </div>

        {favoriteProducts.length > 0 && (
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-neutral-500 font-mono">
              {favoriteProducts.length} {favoriteProducts.length === 1 ? "Item" : "Items"} Saved
            </span>
            <button
              onClick={() => {
                if (confirm("Clear all items from your favourites?")) {
                  clearWishlist();
                  onShowToast("Favourites list cleared.");
                }
              }}
              className="text-xs font-bold text-neutral-400 hover:text-rose-600 uppercase tracking-wider transition-colors cursor-pointer"
            >
              Clear All
            </button>
          </div>
        )}
      </div>

      {/* Favourites Grid */}
      {favoriteProducts.length === 0 ? (
        <div className="py-16 text-center space-y-3 bg-neutral-50/60 rounded-2xl border border-neutral-100">
          <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
            <Heart className="w-6 h-6" />
          </div>
          <p className="text-xs font-bold uppercase tracking-wider text-neutral-700">
            Your Wishlist Is Empty
          </p>
          <p className="text-xs text-neutral-500 max-w-sm mx-auto">
            Explore the latest couture arrivals and tap the heart icon on any silhouette to preserve it here.
          </p>
          <Link
            href="/products"
            className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-neutral-900 hover:bg-amber-600 text-white text-xs font-bold uppercase tracking-widest rounded-xl transition-all shadow-md cursor-pointer mt-2"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Browse Haute Couture</span>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {favoriteProducts.map((product) => {
            const formattedPrice = `${storeConfig.currency.symbol}${product.price.toLocaleString()}`;
            const formattedCompare = product.compareAtPrice
              ? `${storeConfig.currency.symbol}${product.compareAtPrice.toLocaleString()}`
              : null;
            const imageUrl =
              product.images?.[0]?.url ||
              product.thumbnail ||
              "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=600";

            return (
              <div
                key={product.id}
                className="group rounded-2xl border border-neutral-200/80 bg-white overflow-hidden shadow-xs hover:border-neutral-300 hover:shadow-md transition-all flex flex-col justify-between"
              >
                {/* Image and Badges */}
                <div className="relative aspect-[3/4] overflow-hidden bg-neutral-100">
                  <Link href={`/products/${product.slug}`}>
                    <img
                      src={imageUrl}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  </Link>

                  {/* Remove Button */}
                  <button
                    onClick={() => handleRemove(product)}
                    className="absolute top-3 right-3 p-2 rounded-full bg-white/90 backdrop-blur-md text-neutral-500 hover:text-rose-600 hover:bg-white shadow-sm transition-all"
                    title="Remove from favourites"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>

                  {/* Category Pill */}
                  <div className="absolute bottom-3 left-3">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-neutral-900/80 backdrop-blur-md text-white">
                      {product.categoryName || "Couture"}
                    </span>
                  </div>
                </div>

                {/* Details */}
                <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                  <div className="space-y-1">
                    <Link
                      href={`/products/${product.slug}`}
                      className="font-bold text-xs uppercase tracking-tight text-neutral-900 line-clamp-1 hover:text-amber-800 transition-colors"
                    >
                      {product.name}
                    </Link>

                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-neutral-900 font-mono">
                        {formattedPrice}
                      </span>
                      {formattedCompare && (
                        <span className="text-[11px] text-neutral-400 line-through font-mono">
                          {formattedCompare}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Action */}
                  <button
                    onClick={() => handleMoveToBag(product)}
                    className="w-full py-2.5 bg-neutral-900 hover:bg-amber-600 text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <ShoppingBag className="w-3.5 h-3.5" />
                    <span>Move to Bag</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
