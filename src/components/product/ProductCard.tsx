"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Heart, ShoppingBag, Eye, Check } from "lucide-react";
import { storeConfig } from "@/config/store.config";
import { featureConfig } from "@/config/feature.config";
import { useCartStore } from "@/stores/cart.store";
import { ProductData, ProductVariantData } from "@/data/products.data";
import { QuickViewModal } from "./QuickViewModal";

export interface ProductCardProps {
  product: ProductData;
}

export function ProductCard({ product }: ProductCardProps) {
  const primaryImg =
    product.images[0]?.url ||
    "https://images.unsplash.com/photo-1610030469983-98e550d6193c?q=80&w=800";
  const hoverImg = product.images[1]?.url || primaryImg;

  const defaultVariant = product.variants?.[0] || {
    id: "default",
    sku: `${product.slug}-def`,
    price: product.price,
    compareAtPrice: product.compareAtPrice,
    stock: product.stock || 10,
    size: "Free Size",
    colorName: "Standard",
    colorHex: "#000000",
  };

  const [selectedVariant, setSelectedVariant] = useState<ProductVariantData>(defaultVariant);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [isQuickViewOpen, setIsQuickViewOpen] = useState(false);
  const [added, setAdded] = useState(false);
  const addItem = useCartStore((state) => state.addItem);

  const availableSizes = Array.from(
    new Set(product.variants?.map((v) => v.size) || ["S", "M", "L"])
  );

  const discountPercentage =
    product.compareAtPrice && product.compareAtPrice > product.price
      ? Math.round(((product.compareAtPrice - product.price) / product.compareAtPrice) * 100)
      : null;

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    addItem({
      productId: product.id,
      variantId: selectedVariant.id,
      name: product.name,
      price: selectedVariant.price,
      compareAtPrice: selectedVariant.compareAtPrice || undefined,
      size: selectedVariant.size,
      colorName: selectedVariant.colorName,
      colorHex: selectedVariant.colorHex,
      imageUrl: primaryImg,
      sku: selectedVariant.sku,
      quantity: 1,
      maxStock: selectedVariant.stock,
    });

    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  };

  const handleOpenQuickView = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsQuickViewOpen(true);
  };

  const toggleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsWishlisted(!isWishlisted);
  };

  return (
    <>
      <div className="group flex flex-col bg-white rounded-3xl p-3 shadow-sm hover:shadow-xl transition-all duration-300 border border-amber-100/60">
        
        {/* Curvy Rounded Image Container */}
        <div className="relative aspect-[3/4] bg-neutral-100 rounded-2xl overflow-hidden">
          <Link href={`/products/${product.slug}`} className="block w-full h-full">
            <img
              src={primaryImg}
              alt={product.name}
              className="w-full h-full object-cover object-top transition-transform duration-500 group-hover:scale-105"
            />
          </Link>

          {/* Discount Badge */}
          {discountPercentage && (
            <div className="absolute top-3 left-3 bg-rose-600 text-white text-[11px] font-bold px-2.5 py-1 rounded-full shadow-sm">
              {discountPercentage}% OFF
            </div>
          )}

          {/* Wishlist Button */}
          {featureConfig.wishlist && (
            <button
              onClick={toggleWishlist}
              aria-label="Wishlist"
              className="absolute top-3 right-3 p-2.5 rounded-full bg-white/90 backdrop-blur-md text-neutral-800 hover:scale-110 transition-all shadow-sm cursor-pointer"
            >
              <Heart
                className={`w-4 h-4 transition-colors ${
                  isWishlisted ? "fill-rose-500 text-rose-500" : "text-neutral-700"
                }`}
              />
            </button>
          )}

          {/* Quick View Button (Pill on image) */}
          <button
            onClick={handleOpenQuickView}
            className="absolute bottom-3 inset-x-3 py-2 bg-white/95 backdrop-blur-md text-neutral-900 text-xs font-bold uppercase rounded-xl opacity-0 group-hover:opacity-100 transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer hover:bg-neutral-900 hover:text-white"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Quick View</span>
          </button>
        </div>

        {/* Details & Clean Product Selection */}
        <div className="pt-3 px-1 flex-1 flex flex-col justify-between space-y-2.5">
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-amber-700 block">
              {product.categoryName}
            </span>

            <Link href={`/products/${product.slug}`}>
              <h3 className="text-sm font-bold text-neutral-900 hover:text-amber-700 transition-colors line-clamp-1 mt-0.5">
                {product.name}
              </h3>
            </Link>

            {/* Price */}
            <div className="flex items-center gap-2 mt-1">
              <span className="text-base font-extrabold text-neutral-900">
                {storeConfig.currency.symbol}
                {product.price.toLocaleString()}
              </span>
              {product.compareAtPrice && product.compareAtPrice > product.price && (
                <span className="text-xs text-neutral-400 line-through">
                  {storeConfig.currency.symbol}
                  {product.compareAtPrice.toLocaleString()}
                </span>
              )}
            </div>
          </div>

          {/* Simple Size Selector Pills */}
          {availableSizes.length > 1 && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {availableSizes.map((size) => {
                const match = product.variants?.find((v) => v.size === size);
                const isSelected = selectedVariant.size === size;
                return (
                  <button
                    key={size}
                    type="button"
                    onClick={() => match && setSelectedVariant(match)}
                    className={`px-2 py-1 text-[11px] font-bold rounded-lg transition-all cursor-pointer ${
                      isSelected
                        ? "bg-neutral-900 text-white shadow-sm"
                        : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
                    }`}
                  >
                    {size}
                  </button>
                );
              })}
            </div>
          )}

          {/* Big Simple Add to Bag Button */}
          <button
            onClick={handleQuickAdd}
            className={`w-full py-2.5 rounded-xl text-xs font-bold tracking-wider uppercase flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm ${
              added
                ? "bg-emerald-600 text-white"
                : "bg-neutral-900 text-white hover:bg-amber-600"
            }`}
          >
            {added ? (
              <>
                <Check className="w-4 h-4" />
                <span>Added to Bag!</span>
              </>
            ) : (
              <>
                <ShoppingBag className="w-3.5 h-3.5" />
                <span>Add to Bag</span>
              </>
            )}
          </button>
        </div>

      </div>

      {/* Quick View Modal */}
      <QuickViewModal
        product={product}
        isOpen={isQuickViewOpen}
        onClose={() => setIsQuickViewOpen(false)}
      />
    </>
  );
}
