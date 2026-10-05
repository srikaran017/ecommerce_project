"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Heart,
  ShoppingBag,
  Ruler,
  Truck,
  RotateCcw,
  Sparkles,
  Check,
  ChevronRight,
  ShieldCheck,
  Star,
  MessageSquarePlus,
  AlertTriangle,
  Layers,
  Sparkle,
} from "lucide-react";
import { storeConfig } from "@/config/store.config";
import { featureConfig } from "@/config/feature.config";
import { useCartStore } from "@/stores/cart.store";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { ProductCard } from "@/components/product/ProductCard";
import { ProductData, ProductVariantData } from "@/data/products.data";

interface ProductDetailClientProps {
  product: ProductData;
  relatedProducts: ProductData[];
}

export function ProductDetailClient({ product, relatedProducts }: ProductDetailClientProps) {
  const router = useRouter();
  const addItem = useCartStore((state) => state.addItem);

  const images = product.images.length > 0
    ? product.images.map((img) => img.url)
    : ["https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=1000"];

  const [activeImage, setActiveImage] = useState(images[0]);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariantData>(
    product.variants?.[0] || {
      id: "default",
      sku: `${product.slug}-default`,
      price: product.price,
      compareAtPrice: product.compareAtPrice,
      stock: product.stock,
      lowStockThreshold: 5,
      size: "M",
      colorName: "Standard",
      colorHex: "#000000",
      isActive: true,
    }
  );

  const [quantity, setQuantity] = useState(1);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [isSizeChartOpen, setIsSizeChartOpen] = useState(false);
  const [unitSystem, setUnitSystem] = useState<"inches" | "cm">("inches");
  const [activeTab, setActiveTab] = useState<"fabric" | "care" | "shipping">("fabric");
  const [addedAnimation, setAddedAnimation] = useState(false);

  // Reviews state
  const [reviews, setReviews] = useState([
    {
      id: "rev_1",
      author: "Priya Sengupta",
      rating: 5,
      date: "3 weeks ago",
      title: "Impeccable silk drape and craftsmanship",
      comment: "The fabric weight is substantial yet breathes wonderfully. Wore this to an evening gala in Mumbai and received endless compliments. Sizing is true to standard bespoke.",
    },
    {
      id: "rev_2",
      author: "Rajeshwar Rao",
      rating: 5,
      date: "1 month ago",
      title: "Finest quality linen I have ever owned",
      comment: "Mother-of-pearl buttons and single-needle stitching confirm the high atelier standards. Looks exceptionally sharp even in warm coastal weather.",
    },
  ]);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [newRating, setNewRating] = useState(5);
  const [newTitle, setNewTitle] = useState("");
  const [newComment, setNewComment] = useState("");
  const [newAuthor, setNewAuthor] = useState("");

  // Selected modifier options: { [groupId: string]: optionId }
  const [selectedModifiers, setSelectedModifiers] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    if (product.modifierGroups) {
      product.modifierGroups.forEach((g) => {
        const defaultOpt = g.options.find((o) => o.isDefault) || g.options[0];
        if (defaultOpt) {
          initial[g.id] = defaultOpt.id;
        }
      });
    }
    return initial;
  });

  // Calculate modifier price delta
  const modifierDelta = Object.entries(selectedModifiers).reduce((sum, [groupId, optId]) => {
    const group = product.modifierGroups?.find((g) => g.id === groupId);
    const option = group?.options.find((o) => o.id === optId);
    return sum + (option?.priceDelta || 0);
  }, 0);

  // Group unique colors & sizes
  const uniqueColors = Array.from(
    new Map(product.variants?.map((v) => [v.colorName, v])).values()
  );

  const uniqueSizes = Array.from(
    new Set(product.variants?.map((v) => v.size) || ["S", "M", "L", "XL"])
  );

  // 3-Tier Active Pricing
  const activePrice = selectedVariant.priceObject || {
    regular: selectedVariant.compareAtPrice || selectedVariant.price,
    sale: selectedVariant.price,
    offer: null,
    effective: selectedVariant.price,
    discountPercentage:
      selectedVariant.compareAtPrice && selectedVariant.compareAtPrice > selectedVariant.price
        ? Math.round(((selectedVariant.compareAtPrice - selectedVariant.price) / selectedVariant.compareAtPrice) * 100)
        : 0,
  };

  const finalDisplayPrice = activePrice.effective + modifierDelta;
  const hasOffer = activePrice.offer !== null && activePrice.offer !== undefined;

  // Update active image when variant color changes
  const handleColorSelect = (colorVariant: ProductVariantData) => {
    // Find matching variant with current size and this color, or default to first of that color
    const matchingVariant =
      product.variants.find(
        (v) => v.colorName === colorVariant.colorName && v.size === selectedVariant.size
      ) || colorVariant;

    setSelectedVariant(matchingVariant);
    if (matchingVariant.imageUrl) {
      setActiveImage(matchingVariant.imageUrl);
    }
  };

  const handleSizeSelect = (size: string) => {
    const matchingVariant =
      product.variants.find(
        (v) => v.size === size && v.colorName === selectedVariant.colorName
      ) || product.variants.find((v) => v.size === size);

    if (matchingVariant) {
      setSelectedVariant(matchingVariant);
    }
  };

  const handleAddToCart = () => {
    if (selectedVariant.stock <= 0) return;

    addItem({
      productId: product.id,
      variantId: selectedVariant.id,
      name: product.name,
      price: finalDisplayPrice,
      compareAtPrice: activePrice.regular > finalDisplayPrice ? activePrice.regular : undefined,
      size: selectedVariant.size,
      colorName: selectedVariant.colorName,
      colorHex: selectedVariant.colorHex,
      imageUrl: activeImage,
      sku: selectedVariant.sku,
      quantity,
      maxStock: selectedVariant.stock,
      modifierOptionIds: Object.values(selectedModifiers).filter(Boolean),
    });

    setAddedAnimation(true);
    setTimeout(() => setAddedAnimation(false), 2000);
  };

  const handleBuyNow = () => {
    handleAddToCart();
    router.push("/checkout");
  };

  const handleAddReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAuthor || !newComment) return;

    setReviews([
      {
        id: `rev_${Date.now()}`,
        author: newAuthor,
        rating: newRating,
        date: "Just now",
        title: newTitle || "Verified Customer Review",
        comment: newComment,
      },
      ...reviews,
    ]);

    setNewAuthor("");
    setNewTitle("");
    setNewComment("");
    setIsReviewModalOpen(false);
  };

  const isLowStock =
    selectedVariant.stock > 0 &&
    selectedVariant.stock <= (selectedVariant.lowStockThreshold || 5);
  const isOutOfStock = selectedVariant.stock <= 0;

  return (
    <div className="py-10 bg-[var(--background)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Breadcrumb Navigation with Hierarchy */}
        <nav className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-widest text-[var(--muted-foreground)] mb-8 flex-wrap">
          <Link href="/" className="hover:text-[var(--foreground)]">Home</Link>
          <ChevronRight className="w-3 h-3" />
          <Link href="/products" className="hover:text-[var(--foreground)]">Collections</Link>
          {product.categoryData?.parent?.parent && (
            <>
              <ChevronRight className="w-3 h-3" />
              <Link href={`/products?category=${product.categoryData.parent.parent.slug}`} className="hover:text-[var(--foreground)]">
                {product.categoryData.parent.parent.name}
              </Link>
            </>
          )}
          {product.categoryData?.parent && (
            <>
              <ChevronRight className="w-3 h-3" />
              <Link href={`/products?category=${product.categoryData.parent.slug}`} className="hover:text-[var(--foreground)]">
                {product.categoryData.parent.name}
              </Link>
            </>
          )}
          <ChevronRight className="w-3 h-3" />
          <Link href={`/products?category=${product.categorySlug}`} className="hover:text-[var(--foreground)]">
            {product.categoryName}
          </Link>
          <ChevronRight className="w-3 h-3" />
          <span className="text-[var(--foreground)] truncate max-w-xs">{product.name}</span>
        </nav>

        {/* Product Showcase Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16">
          
          {/* Left Column: Image Gallery (7 cols) */}
          <div className="lg:col-span-7 flex flex-col-reverse md:flex-row gap-4">
            
            {/* Thumbnail Strip */}
            {images.length > 1 && (
              <div className="flex md:flex-col gap-3 overflow-x-auto md:overflow-y-auto max-h-[600px] scrollbar-none">
                {images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveImage(img)}
                    className={`w-16 h-20 md:w-20 md:h-28 flex-shrink-0 rounded-[var(--radius)] overflow-hidden border transition-all cursor-pointer ${
                      activeImage === img
                        ? "border-[var(--primary)] ring-2 ring-[var(--primary)]"
                        : "border-[var(--border)] opacity-70 hover:opacity-100"
                    }`}
                  >
                    <img src={img} alt={`View ${idx + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}

            {/* Main Stage Image */}
            <div className="flex-1 aspect-[3/4] bg-[var(--muted)] rounded-[var(--radius)] overflow-hidden border border-[var(--border)] relative group">
              <img
                src={activeImage}
                alt={product.name}
                className="w-full h-full object-cover object-top transition-transform duration-700 group-hover:scale-105"
              />
              {activePrice.discountPercentage > 0 && (
                <div className="absolute top-4 left-4">
                  <Badge variant="sale">
                    SAVE {activePrice.discountPercentage}%
                  </Badge>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Product Purchasing Panel (5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-[0.25em] text-[var(--secondary)] block mb-1">
                  {product.brand || storeConfig.name} • {product.gender}
                </span>
                {/* Rating Badge */}
                <div className="flex items-center gap-1 text-amber-500 text-xs font-bold">
                  <Star className="w-3.5 h-3.5 fill-amber-500" />
                  <span>{product.averageRating || 4.9}</span>
                  <span className="text-[var(--muted-foreground)] font-normal">({reviews.length})</span>
                </div>
              </div>

              <h1 className="font-heading text-2xl sm:text-3xl font-bold uppercase tracking-tight text-[var(--foreground)]">
                {product.name}
              </h1>

              {/* 3-Tier Price Display */}
              <div className="flex items-baseline gap-3 mt-3 flex-wrap">
                <span className="text-xl sm:text-2xl font-bold text-[var(--foreground)]">
                  {storeConfig.currency.symbol}{finalDisplayPrice.toLocaleString()}
                </span>
                {activePrice.regular > activePrice.effective && (
                  <span className="text-sm text-[var(--muted-foreground)] line-through">
                    {storeConfig.currency.symbol}{activePrice.regular.toLocaleString()}
                  </span>
                )}
                {activePrice.discountPercentage > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-rose-600 text-white shadow-sm">
                    -{activePrice.discountPercentage}% OFF
                  </span>
                )}
                {hasOffer && (
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-600 text-white shadow-sm uppercase tracking-wider flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    Special Deal
                  </span>
                )}
                <span className="text-[11px] text-[var(--muted-foreground)] ml-auto">
                  SKU: <strong className="font-mono text-[var(--foreground)]">{selectedVariant.sku}</strong>
                </span>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-[var(--muted-foreground)] leading-relaxed">
              {product.shortDescription || product.description}
            </p>

            {/* Color Swatches */}
            {uniqueColors.length > 0 && (
              <div className="space-y-2.5 pt-2 border-t border-[var(--border)]">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold uppercase tracking-wider text-[var(--foreground)]">
                    Color: <span className="font-normal text-[var(--muted-foreground)]">{selectedVariant.colorName}</span>
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  {uniqueColors.map((colorV) => (
                    <button
                      key={colorV.id}
                      onClick={() => handleColorSelect(colorV)}
                      className={`flex items-center gap-2 px-3.5 py-2 rounded-[var(--radius)] border text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer ${
                        selectedVariant.colorName === colorV.colorName
                          ? "border-[var(--foreground)] bg-[var(--muted)] text-[var(--foreground)] ring-1 ring-[var(--foreground)]"
                          : "border-[var(--border)] text-[var(--muted-foreground)] hover:border-[var(--foreground)]"
                      }`}
                    >
                      <span
                        className="w-3.5 h-3.5 rounded-full inline-block border border-black/20"
                        style={{ backgroundColor: colorV.colorHex || "#000000" }}
                      />
                      <span>{colorV.colorName}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Size Selector & Size Chart Trigger */}
            <div className="space-y-2.5 pt-2 border-t border-[var(--border)]">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold uppercase tracking-wider text-[var(--foreground)]">
                  Select Size: <span className="font-normal text-[var(--muted-foreground)]">{selectedVariant.size}</span>
                </span>
                {featureConfig.sizeChart && (
                  <button
                    onClick={() => setIsSizeChartOpen(true)}
                    className="inline-flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-[var(--secondary)] hover:underline cursor-pointer"
                  >
                    <Ruler className="w-3.5 h-3.5" />
                    <span>Size Guide</span>
                  </button>
                )}
              </div>

              <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
                {uniqueSizes.map((size) => {
                  const variantForSize = product.variants?.find(
                    (v) => v.size === size && v.colorName === selectedVariant.colorName
                  ) || product.variants?.find((v) => v.size === size);

                  const isSelected = selectedVariant.size === size;
                  const isSoldOut = variantForSize ? variantForSize.stock <= 0 : false;

                  return (
                    <button
                      key={size}
                      disabled={isSoldOut}
                      onClick={() => handleSizeSelect(size)}
                      className={`py-3 text-xs font-bold uppercase tracking-wider rounded-[var(--radius)] border transition-all cursor-pointer ${
                        isSelected
                          ? "bg-[var(--foreground)] text-[var(--background)] border-[var(--foreground)] shadow-sm"
                          : isSoldOut
                          ? "border-dashed border-[var(--border)] text-[var(--muted-foreground)] opacity-40 cursor-not-allowed line-through"
                          : "border-[var(--border)] text-[var(--foreground)] hover:border-[var(--foreground)] bg-[var(--background)]"
                      }`}
                    >
                      {size}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Modifier Groups (e.g. Luxury Gift Box, Custom Tailoring) */}
            {product.modifierGroups && product.modifierGroups.length > 0 && (
              <div className="space-y-4 pt-4 border-t border-[var(--border)]">
                {product.modifierGroups.map((group) => (
                  <div key={group.id} className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold uppercase tracking-wider text-[var(--foreground)] flex items-center gap-1.5">
                        <span>{group.name}</span>
                        {group.isRequired && (
                          <span className="text-rose-500 font-normal">*Required</span>
                        )}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {group.options.map((opt) => {
                        const isSelected = selectedModifiers[group.id] === opt.id;
                        return (
                          <button
                            key={opt.id}
                            type="button"
                            onClick={() =>
                              setSelectedModifiers((prev) => ({
                                ...prev,
                                [group.id]: opt.id,
                              }))
                            }
                            className={`p-3 rounded-[var(--radius)] border text-left text-xs transition-all cursor-pointer flex items-center justify-between ${
                              isSelected
                                ? "border-[var(--foreground)] bg-[var(--muted)]/50 ring-1 ring-[var(--foreground)] shadow-sm"
                                : "border-[var(--border)] hover:border-[var(--foreground)]"
                            }`}
                          >
                            <span className="font-medium text-[var(--foreground)]">{opt.name}</span>
                            <span className="text-[11px] font-bold text-amber-700">
                              {opt.priceDelta > 0 ? `+${storeConfig.currency.symbol}${opt.priceDelta}` : "Included"}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Dynamic Product Attributes (Fabric, Occasion, Material, etc.) */}
            {product.dynamicAttributes && product.dynamicAttributes.length > 0 && (
              <div className="pt-4 border-t border-[var(--border)]">
                <span className="text-xs font-bold uppercase tracking-wider text-[var(--foreground)] block mb-2.5">
                  Garment Attributes
                </span>
                <div className="grid grid-cols-2 gap-2.5">
                  {product.dynamicAttributes.map((attr, idx) => (
                    <div key={idx} className="p-2.5 rounded-xl bg-[var(--muted)]/30 border border-[var(--border)] text-xs">
                      <span className="text-[10px] uppercase tracking-wider text-[var(--muted-foreground)] block">
                        {attr.attribute}
                      </span>
                      <span className="font-semibold text-[var(--foreground)] mt-0.5 block">
                        {attr.value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Dynamic Stock Notification Banner */}
            {isLowStock && (
              <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-[var(--radius)] flex items-center gap-2.5 text-amber-900 text-xs font-bold">
                <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                <span>Low Stock Alert: Only {selectedVariant.stock} pieces remaining in Size {selectedVariant.size}!</span>
              </div>
            )}

            {isOutOfStock && (
              <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-[var(--radius)] flex items-center gap-2.5 text-red-900 text-xs font-bold">
                <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0" />
                <span>Out of Stock in Size {selectedVariant.size}. Select another size or color.</span>
              </div>
            )}

            {/* Quantity Selector & Action Buttons */}
            <div className="space-y-3 pt-4 border-t border-[var(--border)]">
              <div className="flex items-center gap-4">
                <Button
                  variant="primary"
                  size="lg"
                  disabled={isOutOfStock}
                  onClick={handleAddToCart}
                  className="flex-1"
                  leftIcon={
                    addedAnimation ? (
                      <Check className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <ShoppingBag className="w-4 h-4" />
                    )
                  }
                >
                  {addedAnimation
                    ? "ADDED TO BAG"
                    : isOutOfStock
                    ? "OUT OF STOCK"
                    : "ADD TO BAG"}
                </Button>

                {/* Wishlist Button */}
                {featureConfig.wishlist && (
                  <button
                    onClick={() => setIsWishlisted(!isWishlisted)}
                    aria-label="Toggle Wishlist"
                    className="p-3.5 rounded-[var(--radius)] border border-[var(--border)] hover:bg-[var(--muted)] text-[var(--foreground)] transition-colors cursor-pointer"
                  >
                    <Heart className={`w-5 h-5 ${isWishlisted ? "fill-red-600 text-red-600" : ""}`} />
                  </button>
                )}
              </div>

              {/* Buy Now Button */}
              {!isOutOfStock && (
                <Button
                  variant="secondary"
                  size="lg"
                  onClick={handleBuyNow}
                  className="w-full"
                >
                  BUY IT NOW
                </Button>
              )}
            </div>

            {/* Key Atelier Assurances */}
            <div className="grid grid-cols-2 gap-4 pt-6 border-t border-[var(--border)] text-xs text-[var(--muted-foreground)]">
              <div className="flex items-center gap-2">
                <Truck className="w-4 h-4 text-[var(--foreground)]" />
                <span>Complimentary Delivery</span>
              </div>
              <div className="flex items-center gap-2">
                <RotateCcw className="w-4 h-4 text-[var(--foreground)]" />
                <span>7-Day Return Guarantee</span>
              </div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[var(--foreground)]" />
                <span>Silk Mark Authenticity</span>
              </div>
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[var(--foreground)]" />
                <span>Bespoke Tailoring Available</span>
              </div>
            </div>

            {/* Garment Details Accordion Tabs */}
            <div className="pt-6 border-t border-[var(--border)]">
              <div className="flex border-b border-[var(--border)] text-xs font-bold uppercase tracking-wider">
                <button
                  onClick={() => setActiveTab("fabric")}
                  className={`pb-3 pr-4 transition-colors cursor-pointer ${
                    activeTab === "fabric"
                      ? "text-[var(--foreground)] border-b-2 border-[var(--foreground)]"
                      : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                  }`}
                >
                  Fabric & Fit
                </button>
                <button
                  onClick={() => setActiveTab("care")}
                  className={`pb-3 px-4 transition-colors cursor-pointer ${
                    activeTab === "care"
                      ? "text-[var(--foreground)] border-b-2 border-[var(--foreground)]"
                      : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                  }`}
                >
                  Care Guide
                </button>
                <button
                  onClick={() => setActiveTab("shipping")}
                  className={`pb-3 pl-4 transition-colors cursor-pointer ${
                    activeTab === "shipping"
                      ? "text-[var(--foreground)] border-b-2 border-[var(--foreground)]"
                      : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                  }`}
                >
                  Delivery
                </button>
              </div>

              <div className="py-4 text-xs text-[var(--muted-foreground)] leading-relaxed">
                {activeTab === "fabric" && (
                  <div className="space-y-2">
                    <p><strong className="text-[var(--foreground)]">Fabric Composition:</strong> {product.fabricInfo || "100% Organic Natural Fibers"}</p>
                    <p><strong className="text-[var(--foreground)]">Fit & Cut:</strong> {product.fitInfo || "Contemporary tailored fit."}</p>
                    {product.modelInfo && <p><strong className="text-[var(--foreground)]">Model Note:</strong> {product.modelInfo}</p>}
                  </div>
                )}
                {activeTab === "care" && (
                  <p>{product.careInstructions || "Specialist dry clean recommended. Store on padded hangers."}</p>
                )}
                {activeTab === "shipping" && (
                  <p>{product.shippingInfo || `Dispatched via express insured courier within ${storeConfig.shipping.estimatedDeliveryDays}.`}</p>
                )}
              </div>
            </div>

          </div>
        </div>

        {/* Customer Reviews Section */}
        {featureConfig.reviews && (
          <div className="mt-20 pt-16 border-t border-[var(--border)]">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-10">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-[0.25em] text-[var(--secondary)]">
                  CLIENT EXPERIENCES
                </span>
                <h2 className="font-heading text-2xl sm:text-3xl font-bold uppercase tracking-tight text-[var(--foreground)] mt-1">
                  CUSTOMER REVIEWS ({reviews.length})
                </h2>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsReviewModalOpen(true)}
                leftIcon={<MessageSquarePlus className="w-4 h-4" />}
              >
                WRITE A REVIEW
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {reviews.map((rev) => (
                <div
                  key={rev.id}
                  className="p-6 rounded-[var(--radius)] bg-[var(--muted)] border border-[var(--border)] space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={`w-3.5 h-3.5 ${
                            i < rev.rating ? "fill-amber-500 text-amber-500" : "text-[var(--border)]"
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-[11px] text-[var(--muted-foreground)]">{rev.date}</span>
                  </div>

                  <h4 className="text-xs font-bold uppercase tracking-wide text-[var(--foreground)]">
                    {rev.title}
                  </h4>
                  <p className="text-xs text-[var(--muted-foreground)] leading-relaxed">
                    {rev.comment}
                  </p>
                  <div className="pt-2 flex items-center gap-2 text-[11px] font-semibold text-[var(--foreground)]">
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span>{rev.author} (Verified Client)</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Related Product Recommendations */}
        {featureConfig.recommendations && relatedProducts.length > 0 && (
          <div className="mt-24 pt-16 border-t border-[var(--border)]">
            <div className="text-center mb-12 space-y-2">
              <span className="text-[11px] font-bold uppercase tracking-[0.25em] text-[var(--secondary)]">
                COMPLETE THE LOOK
              </span>
              <h2 className="font-heading text-3xl font-bold uppercase tracking-tight text-[var(--foreground)]">
                PAIR WITH THESE SILHOUETTES
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {relatedProducts.map((relProduct) => (
                <ProductCard key={relProduct.id} product={relProduct as any} />
              ))}
            </div>
          </div>
        )}

      </div>

      {/* Interactive Size Guide Modal */}
      {isSizeChartOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-[var(--background)] max-w-xl w-full p-6 sm:p-8 rounded-[var(--radius)] border border-[var(--border)] shadow-2xl relative">
            <div className="flex items-center justify-between mb-6 border-b border-[var(--border)] pb-4">
              <div className="flex items-center gap-2">
                <Ruler className="w-5 h-5 text-[var(--foreground)]" />
                <h3 className="font-heading text-lg font-bold uppercase tracking-wide text-[var(--foreground)]">
                  ATELIER SIZE & FIT GUIDE
                </h3>
              </div>
              <button
                onClick={() => setIsSizeChartOpen(false)}
                className="text-xs font-bold uppercase text-[var(--muted-foreground)] hover:text-[var(--foreground)] cursor-pointer"
              >
                CLOSE
              </button>
            </div>

            {/* Units toggle */}
            <div className="flex justify-end gap-2 mb-4 text-xs font-bold uppercase">
              <button
                onClick={() => setUnitSystem("inches")}
                className={`px-3 py-1 rounded border ${
                  unitSystem === "inches" ? "bg-[var(--foreground)] text-[var(--background)]" : "text-[var(--muted-foreground)]"
                }`}
              >
                Inches
              </button>
              <button
                onClick={() => setUnitSystem("cm")}
                className={`px-3 py-1 rounded border ${
                  unitSystem === "cm" ? "bg-[var(--foreground)] text-[var(--background)]" : "text-[var(--muted-foreground)]"
                }`}
              >
                Centimeters
              </button>
            </div>

            <div className="overflow-x-auto text-xs">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[var(--border)] text-[var(--foreground)] font-bold uppercase">
                    <th className="py-2.5">Size</th>
                    <th className="py-2.5">Bust / Chest</th>
                    <th className="py-2.5">Waist</th>
                    <th className="py-2.5">Hip</th>
                    <th className="py-2.5">Garment Length</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)] text-[var(--muted-foreground)]">
                  {unitSystem === "inches" ? (
                    <>
                      <tr><td className="py-2.5 font-bold text-[var(--foreground)]">XS (34)</td><td>34" - 36"</td><td>26" - 28"</td><td>36" - 38"</td><td>27.5"</td></tr>
                      <tr><td className="py-2.5 font-bold text-[var(--foreground)]">S (36)</td><td>36" - 38"</td><td>28" - 30"</td><td>38" - 40"</td><td>28.5"</td></tr>
                      <tr><td className="py-2.5 font-bold text-[var(--foreground)]">M (38)</td><td>38" - 40"</td><td>30" - 32"</td><td>40" - 42"</td><td>29.5"</td></tr>
                      <tr><td className="py-2.5 font-bold text-[var(--foreground)]">L (40)</td><td>40" - 42"</td><td>32" - 34"</td><td>42" - 44"</td><td>30.5"</td></tr>
                      <tr><td className="py-2.5 font-bold text-[var(--foreground)]">XL (42)</td><td>42" - 44"</td><td>34" - 36"</td><td>44" - 46"</td><td>31.5"</td></tr>
                      <tr><td className="py-2.5 font-bold text-[var(--foreground)]">XXL (44)</td><td>44" - 46"</td><td>36" - 38"</td><td>46" - 48"</td><td>32.5"</td></tr>
                    </>
                  ) : (
                    <>
                      <tr><td className="py-2.5 font-bold text-[var(--foreground)]">XS (34)</td><td>86 - 91 cm</td><td>66 - 71 cm</td><td>91 - 96 cm</td><td>70 cm</td></tr>
                      <tr><td className="py-2.5 font-bold text-[var(--foreground)]">S (36)</td><td>91 - 96 cm</td><td>71 - 76 cm</td><td>96 - 101 cm</td><td>72 cm</td></tr>
                      <tr><td className="py-2.5 font-bold text-[var(--foreground)]">M (38)</td><td>96 - 101 cm</td><td>76 - 81 cm</td><td>101 - 106 cm</td><td>75 cm</td></tr>
                      <tr><td className="py-2.5 font-bold text-[var(--foreground)]">L (40)</td><td>101 - 106 cm</td><td>81 - 86 cm</td><td>106 - 111 cm</td><td>77 cm</td></tr>
                      <tr><td className="py-2.5 font-bold text-[var(--foreground)]">XL (42)</td><td>106 - 111 cm</td><td>86 - 91 cm</td><td>111 - 116 cm</td><td>80 cm</td></tr>
                      <tr><td className="py-2.5 font-bold text-[var(--foreground)]">XXL (44)</td><td>111 - 116 cm</td><td>91 - 96 cm</td><td>116 - 121 cm</td><td>82 cm</td></tr>
                    </>
                  )}
                </tbody>
              </table>
            </div>

            <p className="mt-6 text-[11px] text-[var(--muted-foreground)] leading-relaxed">
              * Dimensions represent standard tailored body measurements. For a relaxed or oversized drape, our stylists recommend selecting one size larger.
            </p>
          </div>
        </div>
      )}

      {/* Write a Review Modal */}
      {isReviewModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-[var(--background)] max-w-lg w-full p-6 sm:p-8 rounded-[var(--radius)] border border-[var(--border)] shadow-2xl relative">
            <div className="flex items-center justify-between mb-6 border-b border-[var(--border)] pb-4">
              <h3 className="font-heading text-lg font-bold uppercase tracking-wide text-[var(--foreground)]">
                WRITE A CLIENT REVIEW
              </h3>
              <button
                onClick={() => setIsReviewModalOpen(false)}
                className="text-xs font-bold uppercase text-[var(--muted-foreground)] hover:text-[var(--foreground)] cursor-pointer"
              >
                CLOSE
              </button>
            </div>

            <form onSubmit={handleAddReview} className="space-y-4 text-xs">
              <div>
                <label className="font-bold uppercase tracking-wider text-[var(--foreground)] block mb-1">
                  Overall Rating
                </label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      type="button"
                      key={star}
                      onClick={() => setNewRating(star)}
                      className="cursor-pointer"
                    >
                      <Star
                        className={`w-6 h-6 ${
                          star <= newRating ? "fill-amber-500 text-amber-500" : "text-[var(--border)]"
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="font-bold uppercase tracking-wider text-[var(--foreground)] block mb-1">
                  Your Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Victoria S."
                  value={newAuthor}
                  onChange={(e) => setNewAuthor(e.target.value)}
                  className="w-full px-3 py-2 bg-[var(--background)] text-[var(--foreground)] border border-[var(--border)] rounded-[var(--radius)]"
                />
              </div>

              <div>
                <label className="font-bold uppercase tracking-wider text-[var(--foreground)] block mb-1">
                  Review Headline
                </label>
                <input
                  type="text"
                  placeholder="e.g. Stunning fabric and fit"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-[var(--background)] text-[var(--foreground)] border border-[var(--border)] rounded-[var(--radius)]"
                />
              </div>

              <div>
                <label className="font-bold uppercase tracking-wider text-[var(--foreground)] block mb-1">
                  Detailed Experience
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder="Share details regarding fit, fabric quality, and styling..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  className="w-full px-3 py-2 bg-[var(--background)] text-[var(--foreground)] border border-[var(--border)] rounded-[var(--radius)]"
                />
              </div>

              <div className="pt-2 flex justify-end gap-3">
                <Button variant="outline" size="sm" type="button" onClick={() => setIsReviewModalOpen(false)}>
                  CANCEL
                </Button>
                <Button variant="primary" size="sm" type="submit">
                  SUBMIT REVIEW
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
