"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuthStore } from "@/stores/auth.store";
import { useWishlistStore } from "@/stores/wishlist.store";
import { useCartStore } from "@/stores/cart.store";
import { WishlistService } from "@/services/wishlist.service";
import { storeConfig } from "@/config/store.config";
import {
  WishlistItem,
  WishlistVariant,
  WishlistSortOption,
  WishlistInStockFilter,
} from "@/types/wishlist.types";
import {
  Heart,
  ShoppingBag,
  Trash2,
  Search,
  SlidersHorizontal,
  Check,
  AlertTriangle,
  ArrowRight,
  X,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/Button";

export function WishlistClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated } = useAuthStore();
  const { wishlistIds, removeFromWishlist: storeRemove, clearWishlist: storeClear } = useWishlistStore();

  const [isMounted, setIsMounted] = useState(false);
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isActionLoading, setIsActionLoading] = useState(false);

  // Filters & Pagination State
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<WishlistSortOption>("newest");
  const [inStockFilter, setInStockFilter] = useState<WishlistInStockFilter>("all");
  const [page, setPage] = useState(1);
  const [limit] = useState(12);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  // Toast State
  const [toastMessage, setToastMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Variant Picker Modal State
  const [variantModalItem, setVariantModalItem] = useState<WishlistItem | null>(null);
  const [selectedVariantId, setSelectedVariantId] = useState<string>("");
  const [selectedQuantity, setSelectedQuantity] = useState<number>(1);
  const [isMoveToCartIntent, setIsMoveToCartIntent] = useState<boolean>(false);

  const showToast = (text: string, type: "success" | "error" = "success") => {
    setToastMessage({ type, text });
    setTimeout(() => {
      setToastMessage((prev) => (prev?.text === text ? null : prev));
    }, 4000);
  };

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (isMounted && !isAuthenticated) {
      router.replace("/login?redirect=/wishlist");
    }
  }, [isMounted, isAuthenticated, router]);

  // Fetch paginated wishlist
  const fetchWishlist = useCallback(async () => {
    if (!isAuthenticated) return;
    setIsLoading(true);
    try {
      const res = await WishlistService.getWishlist({
        page,
        limit,
        search,
        sort,
        inStock: inStockFilter,
      });

      if (res.success && Array.isArray(res.data)) {
        setItems(res.data);
        setTotalPages(res.pagination.totalPages || 1);
        setTotalItems(res.pagination.total || 0);
      }
    } catch (err) {
      console.warn("Failed to load wishlist items:", err);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, page, limit, search, sort, inStockFilter]);

  useEffect(() => {
    if (isMounted && isAuthenticated) {
      fetchWishlist();
    }
  }, [isMounted, isAuthenticated, fetchWishlist]);

  // Handle Remove Single Item
  const handleRemoveItem = async (item: WishlistItem) => {
    try {
      await storeRemove(item.productId);
      setItems((prev) => prev.filter((i) => i.productId !== item.productId));
      setTotalItems((prev) => Math.max(0, prev - 1));
      showToast(`Removed "${item.name}" from your wishlist.`);
    } catch {
      showToast("Failed to remove item. Please try again.", "error");
    }
  };

  // Handle Clear Entire Wishlist
  const handleClearAll = async () => {
    if (!confirm("Are you sure you want to clear your entire wishlist?")) return;
    try {
      await storeClear();
      setItems([]);
      setTotalItems(0);
      showToast("Wishlist cleared successfully.");
    } catch {
      showToast("Failed to clear wishlist.", "error");
    }
  };

  // Open Variant Picker Modal or Add Directly
  const initiateAddToCart = (item: WishlistItem, moveToCart: boolean = false) => {
    if (item.isOutOfStock) {
      showToast("This item is currently out of stock.", "error");
      return;
    }

    if (item.hasVariants && item.variants && item.variants.length > 0) {
      // Find first in-stock variant
      const firstInStock = item.variants.find((v) => v.stockQuantity > 0) || item.variants[0];
      setVariantModalItem(item);
      setSelectedVariantId(firstInStock?.id || "");
      setSelectedQuantity(1);
      setIsMoveToCartIntent(moveToCart);
    } else {
      // Direct add for single-variant products
      executeAddToCart(item.productId, null, 1, moveToCart, item.name);
    }
  };

  // Execute Add to Cart via Service
  const executeAddToCart = async (
    productId: string,
    variantId: string | null,
    quantity: number,
    moveToCart: boolean,
    productName: string
  ) => {
    setIsActionLoading(true);
    try {
      const res = await WishlistService.addToCart(productId, {
        variantId,
        quantity,
        moveToCart,
      });

      if (res.success) {
        if (moveToCart) {
          setItems((prev) => prev.filter((i) => i.productId !== productId));
          setTotalItems((prev) => Math.max(0, prev - 1));
          showToast(`"${productName}" moved to your shopping bag!`);
        } else {
          showToast(`"${productName}" added to your shopping bag!`);
        }
        setVariantModalItem(null);
      } else {
        showToast(res.message || "Failed to add to bag.", "error");
      }
    } catch (err: any) {
      if (err.message === "VARIANT_SELECTION_REQUIRED") {
        showToast("Please select a variant to proceed.", "error");
      } else {
        showToast(err.message || "Failed to add to shopping bag.", "error");
      }
    } finally {
      setIsActionLoading(false);
    }
  };

  if (!isMounted || !isAuthenticated) {
    return (
      <div className="py-24 bg-[var(--background)] min-h-[70vh] flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 rounded-full border-2 border-neutral-300 border-t-neutral-900 animate-spin mx-auto" />
          <p className="text-xs text-neutral-400 font-medium">Loading your wishlist...</p>
        </div>
      </div>
    );
  }

  const selectedVariant = variantModalItem?.variants.find((v) => v.id === selectedVariantId);

  return (
    <div className="py-12 bg-[var(--background)] min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        
        {/* Floating Toast Notification */}
        {toastMessage && (
          <div className="fixed top-20 right-4 sm:right-8 z-50 max-w-md bg-neutral-950 text-white px-5 py-3.5 rounded-2xl shadow-2xl flex items-center justify-between gap-3 border border-neutral-800 animate-in fade-in slide-in-from-top-2">
            <div className="flex items-center gap-2.5">
              {toastMessage.type === "success" ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0" />
              )}
              <p className="text-xs font-medium">{toastMessage.text}</p>
            </div>
            <button
              onClick={() => setToastMessage(null)}
              className="text-neutral-400 hover:text-white p-1 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-[var(--border)] pb-8">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[var(--secondary)]">
              <Heart className="w-4 h-4 fill-[var(--primary)] text-[var(--primary)]" />
              <span>Personal Wardrobe Curation</span>
            </div>
            <h1 className="font-heading text-3xl sm:text-4xl font-bold uppercase tracking-tight text-[var(--foreground)]">
              YOUR SAVED WISHLIST
            </h1>
            <p className="text-xs sm:text-sm text-[var(--muted-foreground)] max-w-xl">
              Reserved garments, artisanal creations, and bespoke bridal inspirations saved to your private atelier catalog.
            </p>
          </div>

          {items.length > 0 && (
            <div className="flex items-center gap-3">
              <span className="text-xs font-mono font-bold text-[var(--muted-foreground)] bg-[var(--muted)] px-3 py-1.5 rounded-full border border-[var(--border)]">
                {totalItems} {totalItems === 1 ? "Garment" : "Garments"} Saved
              </span>
              <button
                onClick={handleClearAll}
                className="text-xs font-bold uppercase tracking-wider text-neutral-400 hover:text-rose-600 transition-colors px-3 py-1.5 border border-dashed border-[var(--border)] rounded-full cursor-pointer hover:border-rose-400"
              >
                Clear Entire List
              </button>
            </div>
          )}
        </div>

        {/* Control Bar: Search, In-Stock Filters, and Sort */}
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-4 sm:p-5 flex flex-col lg:flex-row items-center justify-between gap-4 shadow-sm">
          {/* Search Input */}
          <div className="relative w-full lg:w-80">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]" />
            <input
              type="text"
              placeholder="Search by name, brand, or SKU..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] focus:outline-none focus:ring-1 focus:ring-[var(--foreground)] transition-all"
            />
          </div>

          {/* In-Stock Filter Chips & Sorting Dropdown */}
          <div className="flex flex-wrap items-center justify-between lg:justify-end gap-3 w-full lg:w-auto">
            {/* Filter Tabs */}
            <div className="inline-flex p-1 bg-[var(--muted)] rounded-xl border border-[var(--border)] text-xs font-semibold">
              <button
                onClick={() => {
                  setInStockFilter("all");
                  setPage(1);
                }}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  inStockFilter === "all"
                    ? "bg-[var(--background)] text-[var(--foreground)] shadow-xs"
                    : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                }`}
              >
                All
              </button>
              <button
                onClick={() => {
                  setInStockFilter("true");
                  setPage(1);
                }}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  inStockFilter === "true"
                    ? "bg-[var(--background)] text-[var(--foreground)] shadow-xs"
                    : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                }`}
              >
                In Stock Only
              </button>
              <button
                onClick={() => {
                  setInStockFilter("false");
                  setPage(1);
                }}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  inStockFilter === "false"
                    ? "bg-[var(--background)] text-[var(--foreground)] shadow-xs"
                    : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                }`}
              >
                Out of Stock
              </button>
            </div>

            {/* Sort Select */}
            <div className="flex items-center gap-2 text-xs">
              <span className="text-[var(--muted-foreground)] hidden sm:inline">Sort:</span>
              <select
                value={sort}
                onChange={(e) => {
                  setSort(e.target.value as WishlistSortOption);
                  setPage(1);
                }}
                className="px-3 py-2 rounded-xl border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] font-medium text-xs focus:outline-none cursor-pointer"
              >
                <option value="newest">Recently Saved</option>
                <option value="oldest">Earliest Saved</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
                <option value="name_asc">Name: A to Z</option>
                <option value="name_desc">Name: Z to A</option>
              </select>
            </div>
          </div>
        </div>

        {/* Wishlist Grid or Empty State */}
        {isLoading ? (
          <div className="py-24 text-center space-y-4">
            <div className="w-10 h-10 rounded-full border-2 border-neutral-300 border-t-neutral-900 animate-spin mx-auto" />
            <p className="text-xs uppercase tracking-wider text-[var(--muted-foreground)]">
              Loading your saved garments...
            </p>
          </div>
        ) : items.length === 0 ? (
          <div className="py-20 text-center space-y-5 max-w-md mx-auto bg-[var(--card)] border border-[var(--border)] rounded-3xl p-8 shadow-sm">
            <div className="w-16 h-16 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto border border-rose-100">
              <Heart className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <h3 className="font-heading text-lg font-bold uppercase tracking-wider text-[var(--foreground)]">
                {search ? "No Matching Garments Found" : "Your Wishlist is Empty"}
              </h3>
              <p className="text-xs text-[var(--muted-foreground)] leading-relaxed">
                {search
                  ? `No wishlisted items match "${search}". Try clearing your search keyword.`
                  : "Explore our newest couture collections and click the heart icon on any gown or saree to save it for later."}
              </p>
            </div>
            {search ? (
              <Button variant="outline" size="sm" onClick={() => setSearch("")}>
                CLEAR SEARCH FILTER
              </Button>
            ) : (
              <Link href="/products">
                <Button variant="primary" size="md" rightIcon={<ArrowRight className="w-4 h-4" />}>
                  EXPLORE COLLECTIONS
                </Button>
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {items.map((item) => {
              const regularPrice = item.pricing.regularPrice;
              const effectivePrice = item.pricing.effectivePrice;
              const hasDiscount = regularPrice > effectivePrice;

              return (
                <div
                  key={item.wishlistItemId || item.productId}
                  className="group bg-[var(--card)] border border-[var(--border)] rounded-3xl p-4 flex flex-col justify-between hover:shadow-xl hover:border-amber-200/80 transition-all duration-300 relative"
                >
                  {/* Top Image Card */}
                  <div className="relative aspect-[3/4] bg-[var(--muted)] rounded-2xl overflow-hidden mb-4">
                    <Link href={`/products/${item.slug}`} className="block w-full h-full">
                      <img
                        src={item.thumbnail || item.images[0]?.url || "https://images.unsplash.com/photo-1610030469983-98e550d6193c?q=80&w=800"}
                        alt={item.name}
                        className="w-full h-full object-cover object-top transition-transform duration-500 group-hover:scale-105"
                      />
                    </Link>

                    {/* Stock & Discount Badges */}
                    <div className="absolute top-3 left-3 flex flex-col gap-1.5">
                      {item.isOutOfStock ? (
                        <span className="bg-neutral-900/90 text-white text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full backdrop-blur-sm">
                          Out of Stock
                        </span>
                      ) : hasDiscount ? (
                        <span className="bg-rose-600 text-white text-[10px] font-bold px-2.5 py-1 rounded-full shadow-sm">
                          -{item.pricing.discountPercentage}% OFF
                        </span>
                      ) : null}
                    </div>

                    {/* Delete / Remove Action */}
                    <button
                      onClick={() => handleRemoveItem(item)}
                      title="Remove from Wishlist"
                      className="absolute top-3 right-3 p-2 rounded-full bg-white/90 backdrop-blur-md text-neutral-600 hover:text-rose-600 hover:bg-white transition-all shadow-sm cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>

                    {/* Sizes Pill Preview */}
                    {item.availableSizes && item.availableSizes.length > 0 && (
                      <div className="absolute bottom-2.5 inset-x-2.5 py-1.5 px-3 bg-white/90 backdrop-blur-md rounded-xl text-[10px] font-semibold text-neutral-800 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity">
                        <span className="text-neutral-500 uppercase tracking-wider">Sizes:</span>
                        <span className="font-mono">{item.availableSizes.join(", ")}</span>
                      </div>
                    )}
                  </div>

                  {/* Body Details */}
                  <div className="space-y-3 flex-1 flex flex-col justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-[11px] text-[var(--muted-foreground)]">
                        <span className="uppercase tracking-wider font-semibold">{item.category?.name || "Couture"}</span>
                        <span className="font-mono text-[10px]">SKU: {item.sku}</span>
                      </div>
                      <Link href={`/products/${item.slug}`}>
                        <h3 className="font-heading text-sm font-bold uppercase tracking-tight text-[var(--foreground)] hover:text-amber-800 transition-colors line-clamp-1">
                          {item.name}
                        </h3>
                      </Link>
                    </div>

                    {/* Pricing */}
                    <div className="flex items-baseline gap-2 pt-1">
                      <span className="font-mono text-base font-bold text-[var(--foreground)]">
                        {storeConfig.currency.symbol}{effectivePrice.toLocaleString()}
                      </span>
                      {hasDiscount && (
                        <span className="font-mono text-xs text-[var(--muted-foreground)] line-through">
                          {storeConfig.currency.symbol}{regularPrice.toLocaleString()}
                        </span>
                      )}
                    </div>

                    {/* Dual Action Buttons: Add to Bag vs Move to Bag */}
                    <div className="pt-3 border-t border-[var(--border)] grid grid-cols-2 gap-2">
                      <Button
                        variant="primary"
                        size="sm"
                        disabled={item.isOutOfStock || isActionLoading}
                        onClick={() => initiateAddToCart(item, false)}
                        className="text-[11px] font-bold uppercase tracking-wider py-2.5"
                      >
                        ADD TO BAG
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={item.isOutOfStock || isActionLoading}
                        onClick={() => initiateAddToCart(item, true)}
                        className="text-[11px] font-bold uppercase tracking-wider py-2.5 hover:border-[var(--foreground)]"
                      >
                        MOVE TO BAG
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination Bar */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 pt-8 border-t border-[var(--border)]">
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="p-2 rounded-xl border border-[var(--border)] text-[var(--foreground)] hover:bg-[var(--muted)] disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-mono font-bold text-[var(--muted-foreground)] px-4">
              Page {page} of {totalPages}
            </span>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="p-2 rounded-xl border border-[var(--border)] text-[var(--foreground)] hover:bg-[var(--muted)] disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}

      </div>

      {/* Quick Variant Picker Modal */}
      {variantModalItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
          <div className="bg-[var(--background)] border border-[var(--border)] rounded-3xl p-6 sm:p-8 max-w-md w-full space-y-6 shadow-2xl relative">
            {/* Header */}
            <div className="flex items-start justify-between border-b border-[var(--border)] pb-4">
              <div className="space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--secondary)]">
                  {isMoveToCartIntent ? "MOVE TO BAG • CHOOSE VARIANT" : "ADD TO BAG • CHOOSE VARIANT"}
                </span>
                <h3 className="font-heading text-lg font-bold uppercase text-[var(--foreground)]">
                  {variantModalItem.name}
                </h3>
              </div>
              <button
                onClick={() => setVariantModalItem(null)}
                className="text-[var(--muted-foreground)] hover:text-[var(--foreground)] p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Item Details */}
            <div className="flex items-center gap-4 p-3 bg-[var(--muted)]/50 rounded-2xl border border-[var(--border)]">
              <img
                src={variantModalItem.thumbnail || variantModalItem.images[0]?.url}
                alt={variantModalItem.name}
                className="w-16 h-20 object-cover rounded-xl flex-shrink-0"
              />
              <div className="space-y-1 text-xs">
                <p className="font-bold text-[var(--foreground)]">
                  {storeConfig.currency.symbol}
                  {(selectedVariant?.price?.sale || variantModalItem.pricing.effectivePrice).toLocaleString()}
                </p>
                <p className="text-[11px] text-[var(--muted-foreground)]">
                  {selectedVariant ? `SKU: ${selectedVariant.sku}` : `SKU: ${variantModalItem.sku}`}
                </p>
                {selectedVariant && (
                  <p className={`text-[11px] font-semibold ${selectedVariant.stockQuantity > 0 ? "text-emerald-600" : "text-rose-600"}`}>
                    {selectedVariant.stockQuantity > 0
                      ? `${selectedVariant.stockQuantity} in stock`
                      : "Variant out of stock"}
                  </p>
                )}
              </div>
            </div>

            {/* Variant Selector Form */}
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-[var(--foreground)]">
                  Select Size & Color Variant:
                </label>
                <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto pr-1">
                  {variantModalItem.variants.map((variant) => {
                    const isSelected = variant.id === selectedVariantId;
                    const isOut = variant.stockQuantity <= 0;

                    return (
                      <button
                        key={variant.id}
                        type="button"
                        disabled={isOut}
                        onClick={() => setSelectedVariantId(variant.id)}
                        className={`p-3 rounded-xl border text-left text-xs transition-all flex items-center justify-between cursor-pointer ${
                          isSelected
                            ? "border-[var(--foreground)] bg-[var(--muted)] ring-1 ring-[var(--foreground)] font-bold"
                            : isOut
                            ? "border-[var(--border)] opacity-40 cursor-not-allowed bg-[var(--muted)]/20"
                            : "border-[var(--border)] hover:border-[var(--foreground)]"
                        }`}
                      >
                        <div>
                          <p className="text-[var(--foreground)]">{variant.name}</p>
                          <p className="text-[10px] text-[var(--muted-foreground)]">
                            {isOut ? "Out of Stock" : `${variant.stockQuantity} available`}
                          </p>
                        </div>
                        <span className="font-mono text-[var(--foreground)]">
                          {storeConfig.currency.symbol}{variant.price.sale.toLocaleString()}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Quantity Picker */}
              <div className="flex items-center justify-between pt-2">
                <label className="text-xs font-bold uppercase tracking-wider text-[var(--foreground)]">
                  Quantity:
                </label>
                <div className="flex items-center border border-[var(--border)] rounded-xl overflow-hidden bg-[var(--background)]">
                  <button
                    type="button"
                    disabled={selectedQuantity <= 1}
                    onClick={() => setSelectedQuantity((q) => Math.max(1, q - 1))}
                    className="px-3 py-1.5 text-xs text-[var(--foreground)] hover:bg-[var(--muted)] disabled:opacity-30 cursor-pointer"
                  >
                    -
                  </button>
                  <span className="px-3 py-1.5 text-xs font-mono font-bold text-[var(--foreground)]">
                    {selectedQuantity}
                  </span>
                  <button
                    type="button"
                    disabled={Boolean(selectedVariant && selectedQuantity >= Math.min(10, selectedVariant.stockQuantity))}
                    onClick={() => setSelectedQuantity((q) => q + 1)}
                    className="px-3 py-1.5 text-xs text-[var(--foreground)] hover:bg-[var(--muted)] disabled:opacity-30 cursor-pointer"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="pt-4 border-t border-[var(--border)] flex items-center justify-end gap-3">
              <Button
                variant="ghost"
                size="md"
                onClick={() => setVariantModalItem(null)}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="md"
                disabled={isActionLoading || !selectedVariantId || (selectedVariant && selectedVariant.stockQuantity <= 0)}
                onClick={() => {
                  if (variantModalItem && selectedVariantId) {
                    executeAddToCart(
                      variantModalItem.productId,
                      selectedVariantId,
                      selectedQuantity,
                      isMoveToCartIntent,
                      variantModalItem.name
                    );
                  }
                }}
              >
                {isActionLoading
                  ? "Adding..."
                  : isMoveToCartIntent
                  ? "CONFIRM MOVE TO BAG"
                  : "CONFIRM ADD TO BAG"}
              </Button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
