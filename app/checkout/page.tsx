"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ShieldCheck,
  Truck,
  CreditCard,
  Banknote,
  Lock,
  ArrowLeft,
  Tag,
  CheckCircle2,
} from "lucide-react";
import { useCartStore } from "@/stores/cart.store";
import { useAuthStore } from "@/stores/auth.store";
import { storeConfig } from "@/config/store.config";
import { featureConfig } from "@/config/feature.config";
import { paymentConfig } from "@/config/payment.config";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export default function CheckoutPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const {
    items,
    apiCart,
    fetchCart,
    getSubtotal,
    getModifiersTotal,
    getShippingAmount,
    getDiscountAmount,
    getTotal,
    appliedCoupon,
    applyCoupon,
    removeCoupon,
    clearCart,
  } = useCartStore();

  const [isMounted, setIsMounted] = useState(false);

  React.useEffect(() => {
    setIsMounted(true);
    fetchCart().catch(() => {});
  }, [fetchCart]);

  // Redirect unauthenticated guests to login only if guest checkout is disabled
  React.useEffect(() => {
    if (!featureConfig.guestCheckout && !isAuthenticated) {
      router.push("/login?redirect=/checkout");
    }
  }, [isAuthenticated, router]);

  const subtotal = getSubtotal();
  const modifiersTotal = getModifiersTotal();
  const shipping = getShippingAmount();
  const discount = getDiscountAmount();
  const total = getTotal();

  // Checkout Form State
  const [formData, setFormData] = useState({
    email: user?.email || "",
    firstName: user?.name?.split(" ")[0] || "",
    lastName: user?.name?.split(" ").slice(1).join(" ") || "",
    phone: user?.phone || "",
    street: "102, Skyline Residency, Bandra West",
    city: "Mumbai",
    state: "Maharashtra",
    postalCode: "400050",
    country: "India",
    paymentMethod: "razorpay" as "razorpay" | "cod",
  });

  // Sync form data when user logs in
  React.useEffect(() => {
    if (user) {
      setFormData((prev) => ({
        ...prev,
        email: prev.email || user.email || "",
        firstName: prev.firstName || user.name?.split(" ")[0] || "",
        lastName: prev.lastName || user.name?.split(" ").slice(1).join(" ") || "",
        phone: prev.phone || user.phone || "",
      }));
    }
  }, [user]);

  const [couponInput, setCouponInput] = useState("");
  const [couponError, setCouponError] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    setCouponError("");
    const code = couponInput.trim().toUpperCase();
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
      setCouponError("Invalid coupon code.");
    }
  };

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) return;

    setIsProcessing(true);

    try {
      const orderId = `ORD-${Date.now().toString().slice(-6)}`;
      const finalAmount = total;

      // Simulate network latency for payment gateway handshake
      await new Promise((resolve) => setTimeout(resolve, 1500));

      clearCart();
      router.push(
        `/order-success/${orderId}?method=${formData.paymentMethod}&amount=${finalAmount}&email=${encodeURIComponent(
          formData.email
        )}&phone=${encodeURIComponent(formData.phone)}`
      );
    } catch (error) {
      console.error("Payment processing error:", error);
      setIsProcessing(false);
    }
  };

  if (!isMounted) {
    return (
      <div className="py-24 text-center max-w-md mx-auto space-y-4 min-h-[50vh] flex flex-col items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-neutral-300 border-t-neutral-900 animate-spin" />
        <p className="text-xs text-[var(--muted-foreground)] uppercase tracking-wider">
          Initializing Checkout...
        </p>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="py-24 text-center max-w-md mx-auto space-y-6">
        <h1 className="font-heading text-2xl font-bold uppercase tracking-tight text-[var(--foreground)]">
          YOUR SHOPPING BAG IS EMPTY
        </h1>
        <p className="text-xs text-[var(--muted-foreground)]">
          Add items to your cart before proceeding to the checkout portal.
        </p>
        <Link href="/products">
          <Button variant="primary" size="md">
            RETURN TO COLLECTION
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="py-12 bg-[var(--background)] min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Back Link */}
        <Link
          href="/products"
          className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[var(--muted-foreground)] hover:text-[var(--foreground)] mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Continue Browsing</span>
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          
          {/* Left Column: Multi-step Customer & Shipping Form (7 cols) */}
          <div className="lg:col-span-7 space-y-10">
            <form onSubmit={handlePlaceOrder} className="space-y-10">
              
              {/* Step 1: Contact Details */}
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
                  <h2 className="font-heading text-lg font-bold uppercase tracking-wider text-[var(--foreground)]">
                    1. CONTACT INFORMATION
                  </h2>
                  {!featureConfig.guestCheckout && (
                    <span className="text-[11px] text-[var(--secondary)] font-bold">
                      Account Required
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <Input
                      label="Email Address"
                      type="email"
                      name="email"
                      required
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="e.g. client@domain.com"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <Input
                      label="Phone Number (For Delivery & WhatsApp updates)"
                      type="tel"
                      name="phone"
                      required
                      value={formData.phone}
                      onChange={handleInputChange}
                      placeholder="+91 98765 00000"
                    />
                  </div>
                </div>
              </div>

              {/* Step 2: Shipping Destination */}
              <div className="space-y-4">
                <div className="border-b border-[var(--border)] pb-3">
                  <h2 className="font-heading text-lg font-bold uppercase tracking-wider text-[var(--foreground)]">
                    2. SHIPPING DESTINATION
                  </h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="First Name"
                    name="firstName"
                    required
                    value={formData.firstName}
                    onChange={handleInputChange}
                  />
                  <Input
                    label="Last Name"
                    name="lastName"
                    required
                    value={formData.lastName}
                    onChange={handleInputChange}
                  />
                  <div className="sm:col-span-2">
                    <Input
                      label="Street Address / Suite / Apartment"
                      name="street"
                      required
                      value={formData.street}
                      onChange={handleInputChange}
                    />
                  </div>
                  <Input
                    label="City"
                    name="city"
                    required
                    value={formData.city}
                    onChange={handleInputChange}
                  />
                  <Input
                    label="State / Province"
                    name="state"
                    required
                    value={formData.state}
                    onChange={handleInputChange}
                  />
                  <Input
                    label="Postal Code (PIN)"
                    name="postalCode"
                    required
                    value={formData.postalCode}
                    onChange={handleInputChange}
                  />
                  <Input
                    label="Country"
                    name="country"
                    required
                    disabled
                    value={formData.country}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              {/* Step 3: Payment Method Selection */}
              <div className="space-y-4">
                <div className="border-b border-[var(--border)] pb-3">
                  <h2 className="font-heading text-lg font-bold uppercase tracking-wider text-[var(--foreground)]">
                    3. PAYMENT METHOD
                  </h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  
                  {/* Online Payment (Razorpay / Cards / UPI) */}
                  {paymentConfig.onlinePaymentEnabled && (
                    <label
                      className={`p-5 rounded-[var(--radius)] border cursor-pointer flex flex-col justify-between transition-all ${
                        formData.paymentMethod === "razorpay"
                          ? "border-[var(--foreground)] bg-[var(--muted)] ring-1 ring-[var(--foreground)]"
                          : "border-[var(--border)] hover:border-[var(--foreground)]"
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          <CreditCard className="w-5 h-5 text-[var(--foreground)]" />
                          <span className="text-xs font-bold uppercase tracking-wider text-[var(--foreground)]">
                            Online Payment
                          </span>
                        </div>
                        <input
                          type="radio"
                          name="paymentMethod"
                          value="razorpay"
                          checked={formData.paymentMethod === "razorpay"}
                          onChange={handleInputChange}
                          className="accent-[var(--foreground)]"
                        />
                      </div>
                      <p className="text-[11px] text-[var(--muted-foreground)] mt-3">
                        Cards, UPI, NetBanking via Razorpay 256-bit Encrypted Gateway.
                      </p>
                    </label>
                  )}

                  {/* Cash On Delivery (Respecting feature flag) */}
                  {featureConfig.cashOnDelivery && paymentConfig.codEnabled && (
                    <label
                      className={`p-5 rounded-[var(--radius)] border cursor-pointer flex flex-col justify-between transition-all ${
                        formData.paymentMethod === "cod"
                          ? "border-[var(--foreground)] bg-[var(--muted)] ring-1 ring-[var(--foreground)]"
                          : "border-[var(--border)] hover:border-[var(--foreground)]"
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          <Banknote className="w-5 h-5 text-[var(--foreground)]" />
                          <span className="text-xs font-bold uppercase tracking-wider text-[var(--foreground)]">
                            Cash On Delivery
                          </span>
                        </div>
                        <input
                          type="radio"
                          name="paymentMethod"
                          value="cod"
                          checked={formData.paymentMethod === "cod"}
                          onChange={handleInputChange}
                          className="accent-[var(--foreground)]"
                        />
                      </div>
                      <p className="text-[11px] text-[var(--muted-foreground)] mt-3">
                        Pay in cash upon physical receipt at your doorstep.
                      </p>
                    </label>
                  )}

                </div>
              </div>

              {/* Submit CTA */}
              <Button
                type="submit"
                variant="primary"
                size="lg"
                isLoading={isProcessing}
                className="w-full"
                leftIcon={<Lock className="w-4 h-4" />}
              >
                COMPLETE ORDER • {storeConfig.currency.symbol}{total.toLocaleString()}
              </Button>

              <div className="flex items-center justify-center gap-2 text-[11px] text-[var(--muted-foreground)]">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>SSL Encrypted Checkout • Compliant Payment Handling</span>
              </div>
            </form>
          </div>

          {/* Right Column: Order Summary (5 cols) */}
          <div className="lg:col-span-5 bg-[var(--muted)] p-6 sm:p-8 rounded-[var(--radius)] border border-[var(--border)] space-y-6 h-fit">
            <h3 className="font-heading text-lg font-bold uppercase tracking-wider text-[var(--foreground)] border-b border-[var(--border)] pb-3">
              ORDER SUMMARY ({items.reduce((acc, i) => acc + i.quantity, 0)})
            </h3>

            {/* Item List */}
            <div className="space-y-4 max-h-72 overflow-y-auto pr-2 scrollbar-none divide-y divide-[var(--border)]">
              {items.map((item) => {
                const lineTotal = item.pricing?.lineTotal ?? item.price * item.quantity;
                return (
                  <div key={item.id} className="pt-3 first:pt-0 flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <img
                        src={item.imageUrl}
                        alt={item.name}
                        className="w-12 h-16 object-cover rounded-[var(--radius)] flex-shrink-0"
                      />
                      <div>
                        <h4 className="text-xs font-bold uppercase tracking-wide text-[var(--foreground)] line-clamp-1">
                          {item.name}
                        </h4>
                        <p className="text-[11px] text-[var(--muted-foreground)]">
                          Size: {item.size} • Qty: {item.quantity}
                        </p>
                        {item.selectedModifiers && item.selectedModifiers.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {item.selectedModifiers.map((mod) => (
                              <span
                                key={mod.id}
                                className="text-[9px] text-amber-800 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded font-medium"
                              >
                                +{mod.name} (+{storeConfig.currency.symbol}{mod.priceDelta})
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    <span className="text-xs font-bold text-[var(--foreground)] whitespace-nowrap">
                      {storeConfig.currency.symbol}{lineTotal.toLocaleString()}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Coupon Application (Respecting feature flag) */}
            {featureConfig.coupons && (
              <div className="pt-4 border-t border-[var(--border)] space-y-2">
                {appliedCoupon ? (
                  <div className="flex items-center justify-between bg-emerald-100 text-emerald-950 px-3 py-2 text-xs rounded-[var(--radius)]">
                    <span className="font-bold">Code {appliedCoupon.code} applied!</span>
                    <button onClick={removeCoupon} className="underline text-xs cursor-pointer">Remove</button>
                  </div>
                ) : (
                  <form onSubmit={handleApplyCoupon} className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Promo Code (LUXE10)"
                      value={couponInput}
                      onChange={(e) => setCouponInput(e.target.value)}
                      className="flex-1 px-3 py-2 text-xs uppercase bg-[var(--background)] text-[var(--foreground)] border border-[var(--border)] rounded-[var(--radius)] focus:outline-none"
                    />
                    <Button variant="outline" size="sm" type="submit">
                      APPLY
                    </Button>
                  </form>
                )}
                {couponError && <p className="text-[11px] text-red-600">{couponError}</p>}
              </div>
            )}

            {/* Cost Breakdown */}
            <div className="pt-4 border-t border-[var(--border)] space-y-2.5 text-xs">
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
                <span>Express Shipping</span>
                <span>{shipping === 0 ? "COMPLIMENTARY" : `${storeConfig.currency.symbol}${shipping}`}</span>
              </div>

              <div className="flex justify-between text-sm font-bold text-[var(--foreground)] pt-3 border-t border-[var(--border)]">
                <span>Total Due</span>
                <span>{storeConfig.currency.symbol}{total.toLocaleString()}</span>
              </div>
            </div>

          </div>

        </div>
      </div>
    </div>
  );
}
