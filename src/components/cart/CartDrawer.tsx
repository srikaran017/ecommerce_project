"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  X,
  Trash2,
  Plus,
  Minus,
  ShoppingBag,
  ArrowRight,
  Tag,
  AlertTriangle,
  Gift,
  Check,
  Sparkles,
} from "lucide-react";
import { useCartStore } from "@/stores/cart.store";
import { useAuthStore } from "@/stores/auth.store";
import { storeConfig } from "@/config/store.config";
import { featureConfig } from "@/config/feature.config";
import { Button } from "@/components/ui/Button";

export function CartDrawer() {
  const {
    items,
    apiCart,
    isOpen,
    closeCart,
    updateQuantity,
    removeItem,
    getSubtotal,
    getModifiersTotal,
    getShippingAmount,
    getDiscountAmount,
    getTotal,
    getAvailabilityIssues,
    appliedCoupon,
    applyCoupon,
    removeCoupon,
    saveGiftMessage,
  } = useCartStore();

  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  const [couponCode, setCouponCode] = useState("");
  const [couponError, setCouponError] = useState("");

  // Gift note state
  const [isGiftNoteOpen, setIsGiftNoteOpen] = useState(false);
  const existingGiftNote =
    apiCart?.metafields?.find(
      (m) => m.namespace === "checkout" && m.key === "gift_message"
    )?.value || "";
  const [giftNote, setGiftNote] = useState(existingGiftNote);
  const [giftNoteSaved, setGiftNoteSaved] = useState(false);

  if (!isOpen) return null;

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

  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    setCouponError("");

    const code = couponCode.trim().toUpperCase();
    if (code === "LUXE10") {
      applyCoupon({
        code: "LUXE10",
        discountType: "PERCENTAGE",
        discountValue: 10,
        calculatedDiscount: Math.round((subtotal * 10) / 100),
      });
      setCouponCode("");
    } else if (code === "WELCOME1000") {
      applyCoupon({
        code: "WELCOME1000",
        discountType: "FIXED",
        discountValue: 1000,
        calculatedDiscount: Math.min(1000, subtotal),
      });
      setCouponCode("");
    } else {
      setCouponError("Invalid coupon code. Try LUXE10 or WELCOME1000.");
    }
  };

  const handleSaveGiftNote = async () => {
    if (!giftNote.trim()) return;
    const success = await saveGiftMessage(giftNote.trim());
    if (success) {
      setGiftNoteSaved(true);
      setTimeout(() => setGiftNoteSaved(false), 2500);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={closeCart}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-[var(--background)] border-l border-[var(--border)] shadow-2xl flex flex-col">
          
          {/* Drawer Header */}
          <div className="p-6 border-b border-[var(--border)] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <ShoppingBag className="w-5 h-5 text-[var(--foreground)]" />
              <h2 className="font-heading text-lg font-bold uppercase tracking-widest text-[var(--foreground)]">
                YOUR BAG ({items.reduce((acc, i) => acc + i.quantity, 0)})
              </h2>
            </div>
            <button
              onClick={closeCart}
              className="p-2 text-[var(--foreground)] hover:opacity-70 transition-opacity cursor-pointer"
              aria-label="Close bag drawer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Free Shipping Progress Indicator */}
          <div className="bg-[var(--muted)] px-6 py-3 border-b border-[var(--border)] text-xs">
            {subtotal >= freeShippingThreshold ? (
              <p className="text-emerald-700 font-semibold uppercase tracking-wider text-center">
                ✨ Complimentary Express Delivery Unlocked!
              </p>
            ) : (
              <div>
                <p className="text-[var(--foreground)] mb-1.5 font-medium text-[11px] uppercase tracking-wider text-center">
                  Add {storeConfig.currency.symbol}
                  {(freeShippingThreshold - subtotal).toLocaleString()} more for Complimentary Shipping
                </p>
                <div className="w-full h-1.5 bg-black/10 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[var(--primary)] transition-all duration-300"
                    style={{ width: `${progressToFreeShipping}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Drawer Body - Items List */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {items.length === 0 ? (
              <div className="py-16 text-center space-y-4">
                <ShoppingBag className="w-12 h-12 mx-auto text-[var(--muted-foreground)] opacity-40" />
                <p className="text-sm font-semibold uppercase tracking-widest text-[var(--muted-foreground)]">
                  Your shopping bag is empty
                </p>
                <Button variant="outline" size="sm" onClick={closeCart}>
                  EXPLORE COLLECTION
                </Button>
              </div>
            ) : (
              items.map((item) => {
                const linePrice =
                  item.pricing?.lineTotal ?? item.price * item.quantity;
                const regLinePrice = item.pricing?.regularPrice
                  ? item.pricing.regularPrice * item.quantity
                  : item.compareAtPrice
                  ? item.compareAtPrice * item.quantity
                  : null;

                const isOutOfStock =
                  item.availability?.status === "OUT_OF_STOCK";
                const isInsufficient =
                  item.availability?.status === "INSUFFICIENT_STOCK";

                return (
                  <div
                    key={item.id}
                    className={`flex gap-4 pb-6 border-b border-[var(--border)] last:border-0 ${
                      isOutOfStock ? "opacity-75" : ""
                    }`}
                  >
                    {/* Image */}
                    <div className="w-20 h-26 bg-[var(--muted)] flex-shrink-0 rounded-[var(--radius)] overflow-hidden relative">
                      <img
                        src={item.imageUrl}
                        alt={item.name}
                        className="w-full h-full object-cover object-top"
                      />
                      {isOutOfStock && (
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center p-1 text-center">
                          <span className="text-[9px] font-bold uppercase text-white bg-rose-600 px-1 py-0.5 rounded">
                            Sold Out
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Product Details */}
                    <div className="flex-1 flex flex-col justify-between">
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--foreground)] line-clamp-1">
                            {item.name}
                          </h4>
                          <button
                            onClick={() => removeItem(item.id)}
                            className="text-[var(--muted-foreground)] hover:text-red-600 transition-colors p-1 cursor-pointer"
                            title="Remove from bag"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                        {/* Variant Attributes */}
                        <div className="flex items-center gap-3 text-[11px] text-[var(--muted-foreground)] mt-1 font-medium">
                          <span>Size: {item.size}</span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            Color: {item.colorName}
                            {item.colorHex && (
                              <span
                                className="w-2.5 h-2.5 rounded-full inline-block border border-black/20"
                                style={{ backgroundColor: item.colorHex }}
                              />
                            )}
                          </span>
                        </div>

                        {/* Selected Modifiers / Custom Add-ons */}
                        {item.selectedModifiers &&
                          item.selectedModifiers.length > 0 && (
                            <div className="mt-1.5 space-y-1">
                              {item.selectedModifiers.map((mod) => (
                                <div
                                  key={mod.id}
                                  className="inline-flex items-center gap-1 text-[10px] text-amber-900 bg-amber-50 border border-amber-200/80 px-2 py-0.5 rounded-full font-medium mr-1"
                                >
                                  <Sparkles className="w-2.5 h-2.5 text-amber-700" />
                                  <span>{mod.name}</span>
                                  {mod.priceDelta > 0 && (
                                    <span className="text-amber-800 font-bold">
                                      (+{storeConfig.currency.symbol}
                                      {mod.priceDelta})
                                    </span>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}

                        {/* Stock Warnings */}
                        {isInsufficient && (
                          <div className="mt-1.5 flex items-center gap-1 text-[10px] font-semibold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                            <AlertTriangle className="w-3 h-3 text-amber-700 flex-shrink-0" />
                            <span>
                              Only {item.availability?.availableQuantity} left in stock
                            </span>
                          </div>
                        )}

                        {isOutOfStock && (
                          <div className="mt-1.5 text-[10px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                            Currently Out of Stock. Remove to proceed.
                          </div>
                        )}
                      </div>

                      <div className="flex items-center justify-between mt-3">
                        {/* Quantity Controls */}
                        <div className="flex items-center border border-[var(--border)] rounded-[var(--radius)]">
                          <button
                            onClick={() =>
                              updateQuantity(item.id, item.quantity - 1)
                            }
                            className="p-1.5 hover:bg-[var(--muted)] text-[var(--foreground)] cursor-pointer"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="px-3 text-xs font-bold text-[var(--foreground)]">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() =>
                              updateQuantity(item.id, item.quantity + 1)
                            }
                            disabled={
                              isOutOfStock ||
                              (item.availability &&
                                item.quantity >=
                                  item.availability.availableQuantity)
                            }
                            className="p-1.5 hover:bg-[var(--muted)] text-[var(--foreground)] disabled:opacity-30 cursor-pointer"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>

                        {/* Authoritative 3-Tier Price Snapshot */}
                        <div className="text-right">
                          <div className="text-xs font-bold text-[var(--foreground)]">
                            {storeConfig.currency.symbol}
                            {linePrice.toLocaleString()}
                          </div>
                          {regLinePrice && regLinePrice > linePrice && (
                            <div className="text-[10px] text-[var(--muted-foreground)] line-through">
                              {storeConfig.currency.symbol}
                              {regLinePrice.toLocaleString()}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Drawer Footer - Metafields, Coupon & Totals */}
          {items.length > 0 && (
            <div className="p-6 border-t border-[var(--border)] bg-[var(--background)] space-y-4">
              
              {/* Gift Note / Order Customization Metafield */}
              <div className="border border-[var(--border)] rounded-xl p-3 bg-neutral-50/50">
                <button
                  onClick={() => setIsGiftNoteOpen(!isGiftNoteOpen)}
                  className="flex items-center justify-between w-full text-xs font-semibold text-[var(--foreground)] cursor-pointer"
                >
                  <div className="flex items-center gap-1.5 text-amber-800">
                    <Gift className="w-3.5 h-3.5" />
                    <span>Complimentary Gift Note & Instructions</span>
                  </div>
                  <span className="text-[11px] text-[var(--muted-foreground)]">
                    {isGiftNoteOpen ? "Hide" : "Add"}
                  </span>
                </button>

                {isGiftNoteOpen && (
                  <div className="mt-3 space-y-2">
                    <textarea
                      rows={2}
                      placeholder="Write your personal gift message or special delivery instructions..."
                      value={giftNote}
                      onChange={(e) => setGiftNote(e.target.value)}
                      className="w-full p-2 text-xs bg-white text-[var(--foreground)] border border-[var(--border)] rounded-lg focus:outline-none focus:border-amber-600"
                    />
                    <div className="flex items-center justify-between">
                      {giftNoteSaved ? (
                        <span className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1">
                          <Check className="w-3 h-3" /> Saved to Order
                        </span>
                      ) : (
                        <span className="text-[10px] text-[var(--muted-foreground)]">
                          Attached to cart session
                        </span>
                      )}
                      <button
                        onClick={handleSaveGiftNote}
                        className="px-3 py-1 bg-neutral-900 text-white text-[11px] font-bold uppercase rounded-md hover:bg-neutral-800 cursor-pointer"
                      >
                        Save Note
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Coupon Form */}
              {featureConfig.coupons && (
                <div className="space-y-2">
                  {appliedCoupon ? (
                    <div className="flex items-center justify-between bg-emerald-50 text-emerald-900 px-3 py-2 text-xs rounded-[var(--radius)] border border-emerald-200">
                      <div className="flex items-center gap-1.5 font-semibold">
                        <Tag className="w-3.5 h-3.5" />
                        <span>Code {appliedCoupon.code} Applied</span>
                      </div>
                      <button
                        onClick={removeCoupon}
                        className="text-xs underline text-emerald-700 hover:text-emerald-900 cursor-pointer"
                      >
                        Remove
                      </button>
                    </div>
                  ) : (
                    <form onSubmit={handleApplyCoupon} className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Coupon code (e.g. LUXE10)"
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value)}
                        className="flex-1 px-3 py-2 text-xs bg-[var(--background)] text-[var(--foreground)] border border-[var(--border)] rounded-[var(--radius)] uppercase focus:outline-none focus:border-[var(--primary)]"
                      />
                      <Button variant="outline" size="sm" type="submit">
                        APPLY
                      </Button>
                    </form>
                  )}
                  {couponError && (
                    <p className="text-[11px] text-red-600 font-medium">{couponError}</p>
                  )}
                </div>
              )}

              {/* Subtotal, Modifiers, Delivery & Total Lines */}
              <div className="space-y-2 text-xs">
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
                  <div className="flex justify-between text-emerald-700 font-medium">
                    <span>Discount</span>
                    <span>-{storeConfig.currency.symbol}{discount.toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between text-[var(--muted-foreground)]">
                  <span>Estimated Delivery</span>
                  <span>
                    {shipping === 0 ? "FREE" : `${storeConfig.currency.symbol}${shipping}`}
                  </span>
                </div>
                <div className="flex justify-between text-sm font-bold text-[var(--foreground)] pt-2 border-t border-[var(--border)]">
                  <span>Total Amount</span>
                  <span>{storeConfig.currency.symbol}{total.toLocaleString()}</span>
                </div>
              </div>

              {/* Stock Warning Banner if checkout is blocked */}
              {hasOutOfStock && (
                <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-xs text-center font-medium">
                  Please remove out-of-stock garments to proceed to checkout.
                </div>
              )}

              {/* Checkout CTA */}
              <Link
                href={
                  hasOutOfStock
                    ? "#"
                    : featureConfig.guestCheckout || isAuthenticated
                    ? "/checkout"
                    : "/login?redirect=/checkout"
                }
                onClick={(e) => {
                  if (hasOutOfStock) {
                    e.preventDefault();
                    return;
                  }
                  closeCart();
                }}
                className={`block w-full ${
                  hasOutOfStock ? "cursor-not-allowed opacity-50" : ""
                }`}
              >
                <Button
                  variant="primary"
                  size="lg"
                  disabled={hasOutOfStock}
                  className="w-full"
                  rightIcon={<ArrowRight className="w-4 h-4" />}
                >
                  PROCEED TO CHECKOUT
                </Button>
              </Link>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
