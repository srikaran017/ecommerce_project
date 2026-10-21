"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { X, ShoppingBag, Check, ArrowRight, Sparkles } from "lucide-react";
import { storeConfig } from "@/config/store.config";
import { useCartStore } from "@/stores/cart.store";
import { useAuthStore } from "@/stores/auth.store";
import { ProductData, ProductVariantData } from "@/data/products.data";

interface QuickViewModalProps {
  product: ProductData;
  isOpen: boolean;
  onClose: () => void;
}

export function QuickViewModal({ product, isOpen, onClose }: QuickViewModalProps) {
  const router = useRouter();

  const defaultVariant = product.variants?.[0] || {
    id: "default",
    sku: `${product.slug}-default`,
    price: product.price,
    compareAtPrice: product.compareAtPrice,
    stock: product.stock,
    size: "Free Size",
    colorName: "Standard",
    colorHex: "#000000",
  };

  const [selectedVariant, setSelectedVariant] = useState<ProductVariantData>(defaultVariant);
  const [activeImg, setActiveImg] = useState(
    product.images?.[0]?.url || product.thumbnail || ""
  );
  const [addedAnimation, setAddedAnimation] = useState(false);
  const addItem = useCartStore((state) => state.addItem);
  const { isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (isOpen) {
      setSelectedVariant(defaultVariant);
      setActiveImg(product.images?.[0]?.url || product.thumbnail || "");
    }
  }, [isOpen, product.id]);

  const availableSizes = Array.from(
    new Set(product.variants?.map((v) => v.size).filter(Boolean) || ["S", "M", "L"])
  );

  if (!isOpen) return null;

  const handleAddToCart = async () => {
    if (selectedVariant.stock <= 0) return;

    await addItem({
      productId: product.id,
      variantId: selectedVariant.id === "default" ? undefined : selectedVariant.id,
      name: product.name,
      price: selectedVariant.price,
      compareAtPrice: selectedVariant.compareAtPrice || undefined,
      size: selectedVariant.size,
      colorName: selectedVariant.colorName,
      colorHex: selectedVariant.colorHex,
      imageUrl: activeImg,
      sku: selectedVariant.sku,
      quantity: 1,
      maxStock: selectedVariant.stock,
    });

    setAddedAnimation(true);
    setTimeout(() => {
      setAddedAnimation(false);
    }, 2000);
  };

  const handleBuyNow = async () => {
    if (selectedVariant.stock <= 0) return;

    await addItem({
      productId: product.id,
      variantId: selectedVariant.id === "default" ? undefined : selectedVariant.id,
      name: product.name,
      price: selectedVariant.price,
      compareAtPrice: selectedVariant.compareAtPrice || undefined,
      size: selectedVariant.size,
      colorName: selectedVariant.colorName,
      colorHex: selectedVariant.colorHex,
      imageUrl: activeImg,
      sku: selectedVariant.sku,
      quantity: 1,
      maxStock: selectedVariant.stock,
    });

    onClose();
    router.push("/cart");
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="fixed inset-0" onClick={onClose} />

      <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 relative z-10 shadow-2xl overflow-hidden border border-neutral-100">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-neutral-400 hover:text-neutral-900 rounded-full hover:bg-neutral-100 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-center">
          
          {/* Left Curvy Photo */}
          <div className="aspect-[3/4] bg-neutral-100 rounded-2xl overflow-hidden shadow-inner">
            {activeImg ? (
              <img
                src={activeImg}
                alt={product.name}
                className="w-full h-full object-cover object-top"
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-b from-neutral-50 to-neutral-200/80 p-4 text-center">
                <Sparkles className="w-8 h-8 mb-2 text-amber-600/60" />
                <span className="text-[10px] uppercase font-bold tracking-widest text-neutral-500">{product.brand || "Maison"}</span>
                <span className="text-sm font-heading font-medium text-neutral-800 line-clamp-2 mt-1">{product.name}</span>
              </div>
            )}
          </div>

          {/* Right Product Details */}
          <div className="space-y-4">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-amber-700 block">
                {product.categoryName}
              </span>
              <h3 className="font-bold text-lg sm:text-xl text-neutral-900 mt-1">
                {product.name}
              </h3>

              <div className="flex items-center gap-2 mt-2">
                <span className="text-xl font-extrabold text-neutral-900">
                  {storeConfig.currency.symbol}{selectedVariant.price.toLocaleString()}
                </span>
                {selectedVariant.compareAtPrice && selectedVariant.compareAtPrice > selectedVariant.price && (
                  <span className="text-xs text-neutral-400 line-through">
                    {storeConfig.currency.symbol}{selectedVariant.compareAtPrice.toLocaleString()}
                  </span>
                )}
              </div>
            </div>

            <p className="text-xs text-neutral-500 line-clamp-2 leading-relaxed">
              {product.shortDescription || product.description}
            </p>

            {/* Sizes */}
            {availableSizes.length > 0 && (
              <div className="space-y-1.5 pt-1">
                <span className="text-xs font-bold text-neutral-800 block">Select Size:</span>
                <div className="flex flex-wrap gap-1.5">
                  {availableSizes.map((size) => {
                    const match = product.variants?.find((v) => v.size === size);
                    const isSelected = selectedVariant.size === size;
                    return (
                      <button
                        key={size}
                        type="button"
                        onClick={() => match && setSelectedVariant(match)}
                        className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                          isSelected
                            ? "bg-neutral-900 text-white shadow-sm"
                            : "bg-neutral-100 text-neutral-700 hover:bg-neutral-200"
                        }`}
                      >
                        {size}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Add to Bag and Buy Now Buttons */}
            <div className="pt-2 space-y-2">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleAddToCart}
                  className={`flex-1 py-3 rounded-2xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md ${
                    addedAnimation
                      ? "bg-emerald-600 text-white"
                      : "bg-neutral-900 text-white hover:bg-neutral-800"
                  }`}
                >
                  {addedAnimation ? (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Added to Bag!</span>
                    </>
                  ) : (
                    <>
                      <ShoppingBag className="w-4 h-4" />
                      <span>Add to Bag</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleBuyNow}
                  className="flex-1 py-3 rounded-2xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold"
                >
                  <span>Buy Now</span>
                </button>
              </div>

              <Link
                href={`/products/${product.slug}`}
                onClick={onClose}
                className="block text-center text-xs font-bold text-amber-700 hover:underline pt-1"
              >
                View Full Product Details →
              </Link>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
