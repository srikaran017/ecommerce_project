"use client";

import React, { useState } from "react";
import Link from "next/link";
import { X, Trash2, Plus, Minus, ShoppingBag, ArrowRight, Tag } from "lucide-react";
import { useCartStore } from "@/stores/cart.store";
import { useAuthStore } from "@/stores/auth.store";
import { storeConfig } from "@/config/store.config";
import { featureConfig } from "@/config/feature.config";
import { Button } from "@/components/ui/Button";

export function CartDrawer() {
  const {
    items,
    isOpen,
    closeCart,
    updateQuantity,
    removeItem,
    getSubtotal,
    getShippingAmount,
    getDiscountAmount,
    getTotal,
    appliedCoupon,
    applyCoupon,
    removeCoupon,
  } = useCartStore();

  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  const [couponCode, setCouponCode] = useState("");
  const [couponError, setCouponError] = useState("");

  if (!isOpen) return null;

  const subtotal = getSubtotal();
  const shipping = getShippingAmount();
  const discount = getDiscountAmount();
  const total = getTotal();
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
              className="p-2 text-[var(--foreground)] hover:opacity-70 transition-opacity"
              aria-label="Close bag drawer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Free Shipping Progress Indicator */}
          <div className="bg-[var(--muted)] px-6 py-3 border-b border-[var(--border)] text-xs">
            {subtotal >= freeShippingThreshold ? (
              <p className="text-emerald-700 font-semibold uppercase tracking-wider text-center">
                ✨ You unlocked Complimentary Express Shipping!
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
              items.map((item) => (
                <div
                  key={item.id}
                  className="flex gap-4 pb-6 border-b border-[var(--border)] last:border-0"
                >
                  {/* Image */}
                  <div className="w-20 h-24 bg-[var(--muted)] flex-shrink-0 rounded-[var(--radius)] overflow-hidden">
                    <img
                      src={item.imageUrl}
                      alt={item.name}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* Product Details */}
                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--foreground)]">
                          {item.name}
                        </h4>
                        <button
                          onClick={() => removeItem(item.id)}
                          className="text-[var(--muted-foreground)] hover:text-red-600 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

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
                    </div>

                    <div className="flex items-center justify-between mt-3">
                      {/* Quantity Controls */}
                      <div className="flex items-center border border-[var(--border)] rounded-[var(--radius)]">
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="p-1.5 hover:bg-[var(--muted)] text-[var(--foreground)]"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="px-3 text-xs font-bold text-[var(--foreground)]">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="p-1.5 hover:bg-[var(--muted)] text-[var(--foreground)]"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      {/* Price */}
                      <span className="text-xs font-bold text-[var(--foreground)]">
                        {storeConfig.currency.symbol}
                        {(item.price * item.quantity).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Drawer Footer - Coupon & Totals */}
          {items.length > 0 && (
            <div className="p-6 border-t border-[var(--border)] bg-[var(--background)] space-y-4">
              
              {/* Coupon Form (Respecting feature flag) */}
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
                        className="text-xs underline text-emerald-700 hover:text-emerald-900"
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

              {/* Subtotal & Total Lines */}
              <div className="space-y-2 text-xs">
                <div className="flex justify-between text-[var(--muted-foreground)]">
                  <span>Subtotal</span>
                  <span>{storeConfig.currency.symbol}{subtotal.toLocaleString()}</span>
                </div>
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

              {/* Checkout CTA - Auth Guarded */}
              <Link
                href={isAuthenticated ? "/checkout" : "/login?redirect=/checkout"}
                onClick={closeCart}
                className="block w-full"
              >
                <Button variant="primary" size="lg" className="w-full" rightIcon={<ArrowRight className="w-4 h-4" />}>
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
