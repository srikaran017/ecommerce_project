"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ShoppingBag,
  Trash2,
  Plus,
  Minus,
  ArrowRight,
  ArrowLeft,
  Tag,
  Gift,
  ShieldCheck,
  Truck,
  RotateCcw,
  Sparkles,
} from "lucide-react";
import { useCartStore } from "@/stores/cart.store";
import { storeConfig } from "@/config/store.config";
import { featureConfig } from "@/config/feature.config";
import { useAuthStore } from "@/stores/auth.store";
import { Button } from "@/components/ui/Button";

export default function CartPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const [isMounted, setIsMounted] = useState(false);

  const {
    items,
    apiCart,
    fetchCart,
    removeItem,
    updateQuantity,
    clearCart,
    getSubtotal,
    getModifiersTotal,
    getShippingAmount,
    getDiscountAmount,
    getTotal,
    appliedCoupon,
    applyCoupon,
    removeCoupon,
    getAvailabilityIssues,
    saveGiftMessage,
  } = useCartStore();

  const [couponInput, setCouponInput] = useState("");
  const [couponError, setCouponError] = useState("");
  const [isGiftNoteOpen, setIsGiftNoteOpen] = useState(false);
  const [giftNote, setGiftNote] = useState("");
  const [giftNoteSaved, setGiftNoteSaved] = useState(false);
  const hasCheckedRef = React.useRef(false);

  useEffect(() => {
    setIsMounted(true);
    if (!hasCheckedRef.current) {
      hasCheckedRef.current = true;
      if (items.length === 0) {
        fetchCart().catch(() => {});
      }
    }
  }, [fetchCart, items.length]);

  // Sync gift note from apiCart metafields if present
  useEffect(() => {
    if (apiCart?.metafields) {
      const note = apiCart.metafields.find(
        (m) => m.namespace === "checkout" && m.key === "gift_message"
      )?.value;
      if (note) setGiftNote(note);
    }
  }, [apiCart]);

  if (!isMounted) {
    return (
      <div className="min-h-[70vh] bg-[var(--background)] flex flex-col items-center justify-center space-y-4">
        <div className="w-10 h-10 border-2 border-[var(--primary)] border-t-transparent rounded-full animate-spin" />
        <p className="text-xs font-semibold uppercase tracking-widest text-[var(--muted-foreground)]">
          Loading Shopping Bag...
        </p>
      </div>
    );
  }

  const subtotal = getSubtotal();
  const modifiersTotal = getModifiersTotal();
  const shipping = getShippingAmount();
  const discount = getDiscountAmount();
  const total = getTotal();
  const { hasOutOfStock } = getAvailabilityIssues();

  const freeShippingThreshold = storeConfig.shipping.freeShippingThreshold;
  const progressToFreeShipping = Math.min(
    100,
    Math.round((subtotal / freeShippingThreshold) * 100)
  );
  const amountNeededForFreeShipping = Math.max(0, freeShippingThreshold - subtotal);

  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    setCouponError("");
    const code = couponInput.trim().toUpperCase();

    if (!code) {
      setCouponError("Please enter a promotion code.");
      return;
    }

    const merchandiseBase = subtotal + modifiersTotal;

    if (code === "LUXE10") {
      applyCoupon({
        code: "LUXE10",
        discountType: "PERCENTAGE",
        discountValue: 10,
        calculatedDiscount: Math.round((merchandiseBase * 10) / 100),
      });
      setCouponInput("");
    } else if (code === "WELCOME1000") {
      applyCoupon({
        code: "WELCOME1000",
        discountType: "FIXED",
        discountValue: 1000,
        calculatedDiscount: Math.min(1000, merchandiseBase),
      });
      setCouponInput("");
    } else {
      setCouponError("Invalid promo code. Try LUXE10 or WELCOME1000.");
    }
  };

  const handleSaveGiftNote = async () => {
    if (!giftNote.trim()) return;
    try {
      const ok = await saveGiftMessage(giftNote.trim());
      if (ok) {
        setGiftNoteSaved(true);
        setTimeout(() => setGiftNoteSaved(false), 3000);
      }
    } catch (err) {
      console.error("Failed to save gift note:", err);
    }
  };

  // Empty Cart State
  if (items.length === 0) {
    return (
      <div className="py-24 bg-[var(--background)] min-h-[75vh] flex flex-col items-center justify-center px-4">
        <div className="max-w-md w-full text-center space-y-6">
          <div className="w-20 h-20 rounded-full bg-[var(--muted)] text-[var(--muted-foreground)] flex items-center justify-center mx-auto">
            <ShoppingBag className="w-10 h-10 stroke-[1.25]" />
          </div>

          <div className="space-y-2">
            <h1 className="font-heading text-2xl sm:text-3xl font-bold uppercase tracking-tight text-[var(--foreground)]">
              Your Shopping Bag Is Empty
            </h1>
            <p className="text-xs sm:text-sm text-[var(--muted-foreground)] leading-relaxed">
              Discover our handcrafted haute couture, royal sarees, and bespoke capsule edits.
            </p>
          </div>

          <div className="pt-2">
            <Link href="/products">
              <Button variant="primary" size="lg" className="w-full sm:w-auto px-8">
                EXPLORE COLLECTION
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="py-10 bg-[var(--background)] min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Breadcrumb Navigation */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">
            <Link href="/" className="hover:text-[var(--foreground)] transition-colors">
              Home
            </Link>
            <span>/</span>
            <span className="text-[var(--foreground)] font-bold">Shopping Bag</span>
          </div>

          <Link
            href="/products"
            className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Continue Shopping</span>
          </Link>
        </div>

        {/* Page Heading */}
        <div className="mb-8 border-b border-[var(--border)] pb-4 flex items-baseline justify-between flex-wrap gap-2">
          <h1 className="font-heading text-2xl sm:text-4xl font-bold uppercase tracking-tight text-[var(--foreground)]">
            Shopping Bag
          </h1>
          <span className="text-xs font-bold uppercase tracking-widest text-[var(--muted-foreground)]">
            {items.reduce((acc, it) => acc + it.quantity, 0)} Items Selected
          </span>
        </div>

        {/* Free Shipping Progress Notification Banner */}
        <div className="mb-8 p-4 rounded-2xl bg-[var(--muted)]/50 border border-[var(--border)] space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold">
            <span className="flex items-center gap-2 text-[var(--foreground)]">
              <Truck className="w-4 h-4 text-amber-600" />
              {amountNeededForFreeShipping === 0 ? (
                <span className="text-emerald-700 font-bold">
                  Complimentary Express Delivery Unlocked!
                </span>
              ) : (
                <span>
                  Add{" "}
                  <strong className="text-[var(--foreground)]">
                    {storeConfig.currency.symbol}
                    {amountNeededForFreeShipping.toLocaleString()}
                  </strong>{" "}
                  more for Free Shipping
                </span>
              )}
            </span>
            <span className="text-[var(--muted-foreground)]">{progressToFreeShipping}%</span>
          </div>
          <div className="w-full bg-[var(--border)] h-2 rounded-full overflow-hidden">
            <div
              className="h-full bg-[var(--primary)] transition-all duration-500 rounded-full"
              style={{ width: `${progressToFreeShipping}%` }}
            />
          </div>
        </div>

        {/* Grid Layout: Bag Items (8 cols) + Order Summary (4 cols) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          
          {/* Left Column: Bag Items List */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* Items Header */}
            <div className="hidden sm:grid grid-cols-12 text-[11px] font-bold uppercase tracking-widest text-[var(--muted-foreground)] pb-3 border-b border-[var(--border)]">
              <span className="col-span-6">Garment</span>
              <span className="col-span-2 text-center">Quantity</span>
              <span className="col-span-2 text-right">Price</span>
              <span className="col-span-2 text-right">Total</span>
            </div>

            {/* Items Rows */}
            <div className="divide-y divide-[var(--border)]">
              {items.map((item) => {
                const unitPrice = item.price || item.pricing?.unitPrice || 0;
                const lineTotal =
                  item.pricing?.lineTotal && item.pricing.lineTotal > 0
                    ? item.pricing.lineTotal
                    : unitPrice * item.quantity;
                const isOutOfStock =
                  item.availability?.status === "OUT_OF_STOCK";

                return (
                  <div
                    key={item.id}
                    className={`py-6 flex flex-col sm:grid sm:grid-cols-12 gap-4 items-start sm:items-center ${
                      isOutOfStock ? "opacity-60" : ""
                    }`}
                  >
                    {/* Item Thumbnail & Details (col 6) */}
                    <div className="sm:col-span-6 flex gap-4 w-full">
                      <div className="w-24 h-32 bg-[var(--muted)] flex-shrink-0 rounded-xl overflow-hidden relative border border-[var(--border)]">
                        <img
                          src={item.imageUrl}
                          alt={item.name}
                          className="w-full h-full object-cover object-top"
                        />
                        {isOutOfStock && (
                          <div className="absolute inset-0 bg-black/60 flex items-center justify-center p-1 text-center">
                            <span className="text-[9px] font-bold uppercase text-white bg-rose-600 px-1.5 py-0.5 rounded">
                              Sold Out
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0 space-y-1.5">
                        <h3 className="text-sm font-bold uppercase tracking-wider text-[var(--foreground)] line-clamp-1">
                          {item.name}
                        </h3>

                        <div className="flex items-center gap-2 text-xs text-[var(--muted-foreground)]">
                          <span className="px-2 py-0.5 rounded bg-[var(--muted)] font-medium">
                            Size: {item.size}
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-1.5 font-medium">
                            Color: {item.colorName}
                            {item.colorHex && (
                              <span
                                className="w-2.5 h-2.5 rounded-full border border-black/20"
                                style={{ backgroundColor: item.colorHex }}
                              />
                            )}
                          </span>
                        </div>

                        {/* Modifiers / Add-ons chips */}
                        {item.selectedModifiers && item.selectedModifiers.length > 0 && (
                          <div className="flex flex-wrap gap-1 pt-1">
                            {item.selectedModifiers.map((mod) => (
                              <span
                                key={mod.id}
                                className="text-[10px] text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded font-medium"
                              >
                                +{mod.name} (+{storeConfig.currency.symbol}{mod.priceDelta})
                              </span>
                            ))}
                          </div>
                        )}

                        <div className="pt-2 sm:hidden flex items-center justify-between">
                          <span className="text-xs font-semibold text-[var(--foreground)]">
                            {storeConfig.currency.symbol}{unitPrice.toLocaleString()} each
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Quantity Stepper (col 2) */}
                    <div className="sm:col-span-2 flex items-center justify-between sm:justify-center w-full sm:w-auto">
                      <div className="flex items-center border border-[var(--border)] rounded-full bg-[var(--background)]">
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.id, Math.max(1, item.quantity - 1))}
                          className="p-1.5 hover:text-[var(--primary)] transition-colors cursor-pointer"
                          aria-label="Decrease quantity"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="px-3 text-xs font-bold min-w-[28px] text-center">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="p-1.5 hover:text-[var(--primary)] transition-colors cursor-pointer"
                          aria-label="Increase quantity"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => removeItem(item.id)}
                        className="sm:hidden text-[var(--muted-foreground)] hover:text-rose-600 transition-colors p-1"
                        title="Remove garment"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Unit Price (col 2 - desktop only) */}
                    <div className="hidden sm:block sm:col-span-2 text-right">
                      <span className="text-xs font-medium text-[var(--muted-foreground)]">
                        {storeConfig.currency.symbol}{unitPrice.toLocaleString()}
                      </span>
                    </div>

                    {/* Line Total & Remove (col 2) */}
                    <div className="sm:col-span-2 flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-0 border-[var(--border)]">
                      <div className="text-right">
                        <span className="text-sm font-bold text-[var(--foreground)]">
                          {storeConfig.currency.symbol}{lineTotal.toLocaleString()}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => removeItem(item.id)}
                        className="hidden sm:inline-flex text-[var(--muted-foreground)] hover:text-rose-600 transition-colors p-1.5 rounded-lg hover:bg-rose-50 cursor-pointer"
                        title="Remove from bag"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Bottom Actions: Clear Bag & Gift Message Accordion */}
            <div className="pt-6 border-t border-[var(--border)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <button
                type="button"
                onClick={() => {
                  if (confirm("Are you sure you want to empty your entire bag?")) {
                    clearCart();
                  }
                }}
                className="text-xs font-semibold text-[var(--muted-foreground)] hover:text-rose-600 transition-colors uppercase tracking-wider"
              >
                Clear Entire Bag
              </button>

              <button
                type="button"
                onClick={() => setIsGiftNoteOpen(!isGiftNoteOpen)}
                className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-700 hover:text-amber-800 transition-colors"
              >
                <Gift className="w-4 h-4" />
                <span>
                  {isGiftNoteOpen ? "Close Gift Message" : "Add Personalized Gift Note / Packaging"}
                </span>
              </button>
            </div>

            {/* Gift Note Input Box */}
            {isGiftNoteOpen && (
              <div className="p-5 rounded-2xl bg-amber-50/50 border border-amber-200/60 space-y-3 animate-in fade-in">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-900">
                  <Sparkles className="w-4 h-4 text-amber-600" />
                  <span>Complimentary Luxury Keepsake Card</span>
                </div>
                <textarea
                  rows={3}
                  value={giftNote}
                  onChange={(e) => setGiftNote(e.target.value)}
                  placeholder="Enter your personalized gift message for the recipient..."
                  className="w-full text-xs p-3 rounded-xl bg-white border border-amber-200 text-neutral-800 focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-amber-800/80">
                    Hand-inscribed on gold-embossed artisanal parchment.
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleSaveGiftNote}
                    className="border-amber-300 hover:bg-amber-100 text-amber-950 font-bold"
                  >
                    {giftNoteSaved ? "Saved!" : "Save Gift Note"}
                  </Button>
                </div>
              </div>
            )}

            {/* Atelier Assurance Guarantee */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6 border-t border-[var(--border)] text-xs text-[var(--muted-foreground)]">
              <div className="flex items-center gap-3">
                <ShieldCheck className="w-5 h-5 text-[var(--primary)] flex-shrink-0" />
                <span>Guaranteed Authentic & Handcrafted</span>
              </div>
              <div className="flex items-center gap-3">
                <Truck className="w-5 h-5 text-[var(--primary)] flex-shrink-0" />
                <span>Express Insured White-Glove Shipping</span>
              </div>
              <div className="flex items-center gap-3">
                <RotateCcw className="w-5 h-5 text-[var(--primary)] flex-shrink-0" />
                <span>Complimentary 7-Day Boutique Returns</span>
              </div>
            </div>

          </div>

          {/* Right Column: Order Summary (Sticky 4 cols) */}
          <div className="lg:col-span-4 lg:sticky lg:top-28">
            <div className="bg-[var(--card)] border border-[var(--border)] rounded-3xl p-6 sm:p-8 space-y-6 shadow-sm">
              <h2 className="font-heading text-lg font-bold uppercase tracking-wider text-[var(--foreground)] border-b border-[var(--border)] pb-4">
                Order Summary
              </h2>

              {/* Coupon Code Section */}
              {featureConfig.coupons && (
                <div className="space-y-2">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-[var(--muted-foreground)] block">
                    Promotional Code
                  </label>
                  {appliedCoupon ? (
                    <div className="flex items-center justify-between bg-emerald-50 text-emerald-950 border border-emerald-200 px-3.5 py-2.5 rounded-xl text-xs">
                      <div className="flex items-center gap-2 font-bold">
                        <Tag className="w-4 h-4 text-emerald-700" />
                        <span>Code {appliedCoupon.code} Applied</span>
                      </div>
                      <button
                        onClick={removeCoupon}
                        className="text-xs font-semibold text-emerald-800 underline cursor-pointer hover:text-emerald-950"
                      >
                        Remove
                      </button>
                    </div>
                  ) : (
                    <form onSubmit={handleApplyCoupon} className="flex gap-2">
                      <input
                        type="text"
                        placeholder="e.g. LUXE10"
                        value={couponInput}
                        onChange={(e) => setCouponInput(e.target.value)}
                        className="flex-1 px-3.5 py-2.5 text-xs uppercase bg-[var(--background)] text-[var(--foreground)] border border-[var(--border)] rounded-xl focus:outline-none focus:border-[var(--primary)]"
                      />
                      <Button variant="outline" size="sm" type="submit" className="font-bold">
                        APPLY
                      </Button>
                    </form>
                  )}
                  {couponError && (
                    <p className="text-[11px] text-rose-600 font-medium">{couponError}</p>
                  )}
                </div>
              )}

              {/* Price Breakdown */}
              <div className="space-y-3 pt-2 border-t border-[var(--border)] text-xs">
                <div className="flex justify-between text-[var(--muted-foreground)]">
                  <span>Product Subtotal</span>
                  <span>{storeConfig.currency.symbol}{subtotal.toLocaleString()}</span>
                </div>

                {modifiersTotal > 0 && (
                  <div className="flex justify-between text-amber-800 font-medium">
                    <span>Add-ons & Packaging</span>
                    <span>+{storeConfig.currency.symbol}{modifiersTotal.toLocaleString()}</span>
                  </div>
                )}

                {discount > 0 && (
                  <div className="flex justify-between text-emerald-700 font-semibold">
                    <span>Coupon Discount</span>
                    <span>-{storeConfig.currency.symbol}{discount.toLocaleString()}</span>
                  </div>
                )}

                <div className="flex justify-between text-[var(--muted-foreground)]">
                  <span>Estimated Delivery</span>
                  <span>
                    {shipping === 0 ? "COMPLIMENTARY" : `${storeConfig.currency.symbol}${shipping}`}
                  </span>
                </div>

                <div className="pt-4 border-t border-[var(--border)] flex justify-between text-base font-bold text-[var(--foreground)]">
                  <span>Estimated Total</span>
                  <span>{storeConfig.currency.symbol}{total.toLocaleString()}</span>
                </div>
              </div>

              {/* Stock Warning */}
              {hasOutOfStock && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl font-medium text-center">
                  Please remove sold-out garments before proceeding to checkout.
                </div>
              )}

              {/* Checkout Primary Button */}
              <Link
                href={
                  hasOutOfStock
                    ? "#"
                    : featureConfig.guestCheckout || isAuthenticated
                    ? "/checkout"
                    : "/login?redirect=/checkout"
                }
                onClick={(e) => {
                  if (hasOutOfStock) e.preventDefault();
                }}
                className="block w-full"
              >
                <Button
                  variant="primary"
                  size="lg"
                  disabled={hasOutOfStock}
                  className="w-full text-xs font-bold uppercase tracking-widest py-4 rounded-xl flex items-center justify-center gap-2"
                >
                  <span>PROCEED TO CHECKOUT</span>
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>

              {/* Payment Trust Micro-Banner */}
              <div className="pt-2 text-center text-[10px] uppercase tracking-widest text-[var(--muted-foreground)]">
                Complimentary Worldwide Shipping On Orders Over {storeConfig.currency.symbol}
                {freeShippingThreshold.toLocaleString()}
              </div>

            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
