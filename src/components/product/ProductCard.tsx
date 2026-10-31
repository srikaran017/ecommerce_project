"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Heart, ShoppingBag, Eye, Check, SlidersHorizontal, Sparkles } from "lucide-react";
import { storeConfig } from "@/config/store.config";
import { featureConfig } from "@/config/feature.config";
import { useCartStore } from "@/stores/cart.store";
import { useWishlistStore } from "@/stores/wishlist.store";
import { useAuthStore } from "@/stores/auth.store";
import { ProductData, ProductVariantData } from "@/data/products.data";
import { QuickViewModal } from "./QuickViewModal";
import { resolveProductImage, getProductFallbackImage } from "@/utils/image.utils";

export interface ProductCardProps {
  product: ProductData;
}

export function ProductCard({ product }: ProductCardProps) {
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const resolvedImages = useMemo(() => resolveProductImage(product), [product]);
  const [currentImg, setCurrentImg] = useState<string>(resolvedImages.primary);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    setCurrentImg(resolvedImages.primary);
  }, [resolvedImages.primary]);

  const displayImg = isHovered && resolvedImages.hover ? resolvedImages.hover : currentImg;

  const handleImageError = () => {
    const fallback = getProductFallbackImage(product);
    if (currentImg !== fallback) {
      setCurrentImg(fallback);
    }
  };

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
  const { isAuthenticated } = useAuthStore();
  const { isWishlisted: checkWishlist, toggleWishlist: storeToggleWishlist } = useWishlistStore();
  const isWishlisted = isMounted ? checkWishlist(product.id) : false;
  const [isQuickViewOpen, setIsQuickViewOpen] = useState(false);
  const [added, setAdded] = useState(false);
  const addItem = useCartStore((state) => state.addItem);

  const availableSizes = Array.from(
    new Set(product.variants?.map((v) => v.size) || [])
  );

  // 3-Tier Pricing Model
  const effectivePrice = product.priceObject?.effective ?? product.price;
  const regularPrice = product.priceObject?.regular ?? product.compareAtPrice ?? product.price;
  const discountPercentage =
    product.priceObject?.discountPercentage !== undefined && product.priceObject.discountPercentage > 0
      ? product.priceObject.discountPercentage
      : regularPrice > effectivePrice
      ? Math.round(((regularPrice - effectivePrice) / regularPrice) * 100)
      : null;
  const hasSpecialOffer = product.priceObject?.offer !== null && product.priceObject?.offer !== undefined;

  // Add-to-Cart Readiness
  const requiresConfig = Boolean(
    product.requiresConfiguration ??
      ((product.variants && product.variants.length > 1) || Boolean(product.modifierGroups?.length))
  );

  const handleQuickAdd = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    await addItem({
      productId: product.id,
      variantId: selectedVariant.id === "default" ? undefined : selectedVariant.id,
      name: product.name,
      price: selectedVariant.price || effectivePrice,
      compareAtPrice: selectedVariant.compareAtPrice || regularPrice,
      size: selectedVariant.size,
      colorName: selectedVariant.colorName,
      colorHex: selectedVariant.colorHex,
      imageUrl: currentImg || resolvedImages.primary || undefined,
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

    if (!isAuthenticated) {
      const currentPath = typeof window !== "undefined" ? window.location.pathname : "/products";
      router.push(`/login?redirect=${encodeURIComponent(currentPath)}`);
      return;
    }

    storeToggleWishlist(product.id);
  };

  return (
    <>
      <div className="group flex flex-col bg-white rounded-3xl p-3 shadow-sm hover:shadow-xl transition-all duration-300 border border-amber-100/60">
        
        {/* Curvy Rounded Image Container */}
        <div
          className="relative aspect-[3/4] bg-neutral-100 rounded-2xl overflow-hidden"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          <Link href={`/products/${product.slug}`} className="block w-full h-full">
            {displayImg ? (
              <img
                src={displayImg}
                alt={product.name}
                loading="lazy"
                onError={handleImageError}
                className="w-full h-full object-cover object-top transition-transform duration-500 group-hover:scale-105"
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-b from-neutral-50 to-neutral-200/80 p-4 text-center">
                <Sparkles className="w-6 h-6 mb-2 text-amber-600/60" />
                <span className="text-[10px] uppercase font-bold tracking-widest text-neutral-500">{product.brand || "Atelier"}</span>
                <span className="text-xs font-heading font-medium text-neutral-800 line-clamp-2 mt-1">{product.name}</span>
              </div>
            )}
          </Link>

          {/* Badges: Special Offer or Discount */}
          {hasSpecialOffer ? (
            <div className="absolute top-3 left-3 bg-amber-600 text-white text-[10px] font-bold px-2.5 py-1 rounded-full shadow-sm flex items-center gap-1 uppercase tracking-wider">
              <Sparkles className="w-3 h-3" />
              <span>Special Deal</span>
            </div>
          ) : discountPercentage ? (
            <div className="absolute top-3 left-3 bg-rose-600 text-white text-[11px] font-bold px-2.5 py-1 rounded-full shadow-sm">
              -{discountPercentage}% OFF
            </div>
          ) : null}

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

          {/* Quick View Link: Direct navigation to respective product URL page */}
          <Link
            href={`/products/${product.slug}`}
            onClick={(e) => e.stopPropagation()}
            className="absolute bottom-3 inset-x-3 py-2 bg-white/95 backdrop-blur-md text-neutral-900 text-xs font-bold uppercase rounded-xl opacity-0 group-hover:opacity-100 transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer hover:bg-neutral-900 hover:text-white"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Quick View</span>
          </Link>
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
                {effectivePrice.toLocaleString()}
              </span>
              {regularPrice > effectivePrice && (
                <span className="text-xs text-neutral-400 line-through">
                  {storeConfig.currency.symbol}
                  {regularPrice.toLocaleString()}
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

          {/* Action Button: Choose Options vs Add to Bag based on requiresConfiguration */}
          {requiresConfig ? (
            <Link
              href={`/products/${product.slug}`}
              onClick={(e) => e.stopPropagation()}
              className="w-full py-2.5 rounded-xl text-xs font-bold tracking-wider uppercase flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-sm bg-neutral-900 text-white hover:bg-amber-700"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>Choose Options</span>
            </Link>
          ) : (
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
          )}
        </div>

      </div>

      {/* Quick View Modal */}
      {isQuickViewOpen && (
        <QuickViewModal
          product={product}
          isOpen={isQuickViewOpen}
          onClose={() => setIsQuickViewOpen(false)}
        />
      )}
    </>
  );
}

