"use client";

import React, { useState, useEffect, useRef } from "react";
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
  AlertCircle,
  MapPin,
  Plus,
  Info,
} from "lucide-react";
import { useCartStore } from "@/stores/cart.store";
import { useAuthStore } from "@/stores/auth.store";
import { storeConfig } from "@/config/store.config";
import { featureConfig } from "@/config/feature.config";
import { paymentConfig } from "@/config/payment.config";
import { CustomerService, CustomerAddress } from "@/services/customer.service";
import { CheckoutService, loadRazorpayScript } from "@/services/checkout.service";
import { CheckoutSummaryData } from "@/types/checkout.types";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export default function CheckoutPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const {
    items,
    fetchCart,
    clearCart,
  } = useCartStore();

  const [isMounted, setIsMounted] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isOrderPlaced, setIsOrderPlaced] = useState(false);
  const [generalError, setGeneralError] = useState<string | null>(null);

  // Saved Addresses State
  const [savedAddresses, setSavedAddresses] = useState<CustomerAddress[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | "new">("new");
  const [isLoadingAddresses, setIsLoadingAddresses] = useState(false);

  // Address Form State
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    company: "",
    address1: "",
    address2: "",
    city: "",
    state: "",
    postalCode: "",
    country: "India",
    paymentMethod: "RAZORPAY" as "RAZORPAY" | "COD",
    customerNotes: "",
  });

  // Pre-Checkout Authoritative Summary State
  const [summaryData, setSummaryData] = useState<CheckoutSummaryData | null>(null);
  const [isSummaryLoading, setIsSummaryLoading] = useState(false);

  // Coupon State
  const [couponInput, setCouponInput] = useState("");
  const [appliedCouponCode, setAppliedCouponCode] = useState<string>("");
  const [couponError, setCouponError] = useState("");
  const [isCouponValidating, setIsCouponValidating] = useState(false);

  // Emulation Modal State (used if Razorpay CDN is blocked or unavailable in dev)
  const [showSandboxModal, setShowSandboxModal] = useState(false);
  const [pendingRazorpayPayload, setPendingRazorpayPayload] = useState<any>(null);

  const hasCheckedCartRef = useRef(false);

  // Initialize page & sync user data
  useEffect(() => {
    setIsMounted(true);
    if (!hasCheckedCartRef.current) {
      hasCheckedCartRef.current = true;
      if (items.length === 0) {
        fetchCart().catch(() => {});
      }
    }
  }, [fetchCart, items.length]);

  // Redirect guest if guest checkout disabled
  useEffect(() => {
    if (!featureConfig.guestCheckout && !isAuthenticated) {
      router.push("/login?redirect=/checkout");
    }
  }, [isAuthenticated, router]);

  // Load Saved Addresses for logged-in customer
  useEffect(() => {
    if (isAuthenticated) {
      setIsLoadingAddresses(true);
      CustomerService.getAddresses()
        .then((addresses) => {
          setSavedAddresses(addresses);
          const defaultAddr = addresses.find((a) => a.isDefault) || addresses[0];
          if (defaultAddr) {
            setSelectedAddressId(defaultAddr.id);
            setFormData((prev) => ({
              ...prev,
              firstName: defaultAddr.firstName,
              lastName: defaultAddr.lastName,
              company: defaultAddr.company || "",
              address1: defaultAddr.address1,
              address2: defaultAddr.address2 || "",
              city: defaultAddr.city,
              state: defaultAddr.state,
              postalCode: defaultAddr.postalCode,
              country: defaultAddr.country || "India",
              phone: defaultAddr.phoneNumber || prev.phone,
            }));
          }
        })
        .catch((err) => {
          console.warn("Failed to load customer saved addresses:", err);
        })
        .finally(() => {
          setIsLoadingAddresses(false);
        });
    }
  }, [isAuthenticated]);

  // Sync user info to form if empty
  useEffect(() => {
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

  // Recalculate Authoritative Checkout Summary
  const refreshSummary = React.useCallback(async (coupon?: string) => {
    if (items.length === 0) return;
    setIsSummaryLoading(true);
    setGeneralError(null);

    const activeCoupon = coupon !== undefined ? coupon : appliedCouponCode;

    try {
      const payload: any = {
        couponCode: activeCoupon || undefined,
      };

      if (selectedAddressId !== "new") {
        payload.shippingAddressId = selectedAddressId;
      } else if (formData.address1 && formData.city) {
        payload.shippingAddress = {
          firstName: formData.firstName,
          lastName: formData.lastName,
          company: formData.company || undefined,
          address1: formData.address1,
          address2: formData.address2 || undefined,
          city: formData.city,
          state: formData.state,
          postalCode: formData.postalCode,
          country: formData.country,
          phoneNumber: formData.phone || undefined,
        };
      }

      const res = await CheckoutService.getCheckoutSummary(payload);
      if (res.success && res.data) {
        setSummaryData(res.data);
      } else if (res.error?.code === "CART_EMPTY") {
        setSummaryData(null);
      } else if (res.message) {
        setGeneralError(res.message);
      }
    } catch (err: any) {
      console.warn("Summary recalculation error:", err);
    } finally {
      setIsSummaryLoading(false);
    }
  }, [items.length, appliedCouponCode, selectedAddressId, formData]);

  // Trigger summary recalculation on item or coupon changes
  useEffect(() => {
    if (items.length > 0) {
      refreshSummary();
    }
  }, [items.length, appliedCouponCode, selectedAddressId, refreshSummary]);

  // Handle Saved Address Selection
  const handleSelectAddress = (id: string) => {
    setSelectedAddressId(id);
    if (id === "new") {
      setFormData((prev) => ({
        ...prev,
        address1: "",
        address2: "",
        city: "",
        state: "",
        postalCode: "",
      }));
    } else {
      const selected = savedAddresses.find((a) => a.id === id);
      if (selected) {
        setFormData((prev) => ({
          ...prev,
          firstName: selected.firstName,
          lastName: selected.lastName,
          company: selected.company || "",
          address1: selected.address1,
          address2: selected.address2 || "",
          city: selected.city,
          state: selected.state,
          postalCode: selected.postalCode,
          country: selected.country || "India",
          phone: selected.phoneNumber || prev.phone,
        }));
      }
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Coupon Application
  const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    setCouponError("");
    const code = couponInput.trim().toUpperCase();
    if (!code) return;

    setIsCouponValidating(true);
    try {
      const currentSubtotal = summaryData?.pricing.subtotal || items.reduce((acc, it) => acc + (it.price * it.quantity), 0);
      const res = await CheckoutService.validateCoupon({
        code,
        subtotal: currentSubtotal,
      });

      if (!res.success || !res.data?.isValid) {
        setCouponError(res.message || "Invalid or ineligible promotional code.");
        setIsCouponValidating(false);
        return;
      }

      setAppliedCouponCode(res.data.code);
      setCouponInput("");
      await refreshSummary(res.data.code);
    } catch {
      setCouponError("Unable to validate coupon at this time.");
    } finally {
      setIsCouponValidating(false);
    }
  };

  const handleRemoveCoupon = async () => {
    setAppliedCouponCode("");
    await refreshSummary("");
  };

  // Order Submission & Payment Flow
  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setGeneralError(null);

    if (items.length === 0) return;

    // Contact telephone number is mandatory for COD orders
    if (formData.paymentMethod === "COD" && !formData.phone?.trim()) {
      setGeneralError("A contact telephone number is mandatory for Cash on Delivery (COD) orders.");
      return;
    }

    // Cash on Delivery is capped at ₹25,000
    const currentTotal = summaryData?.pricing.totalAmount ?? 0;
    if (formData.paymentMethod === "COD" && currentTotal > 25000) {
      setGeneralError(
        `Cash on Delivery (COD) orders are capped at ${storeConfig.currency.symbol}25,000. Your order total is ${storeConfig.currency.symbol}${currentTotal.toLocaleString()}. Please select Online Payment via Razorpay.`
      );
      return;
    }

    setIsProcessing(true);

    try {
      const shippingAddressPayload = {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        company: formData.company?.trim() || undefined,
        address1: formData.address1.trim(),
        address2: formData.address2?.trim() || undefined,
        city: formData.city.trim(),
        state: formData.state.trim(),
        postalCode: formData.postalCode.trim(),
        country: formData.country,
        phoneNumber: formData.phone?.trim() || undefined,
      };

      const placeOrderPayload: any = {
        paymentMethod: formData.paymentMethod,
        billingAddressSameAsShipping: true,
        couponCode: appliedCouponCode || undefined,
        customerNotes: formData.customerNotes?.trim() || undefined,
        customerEmail: formData.email.trim(),
      };

      if (selectedAddressId !== "new") {
        placeOrderPayload.shippingAddressId = selectedAddressId;
      }
      placeOrderPayload.shippingAddress = shippingAddressPayload;

      const res = await CheckoutService.placeOrder(placeOrderPayload);

      if (!res.success || !res.data) {
        setIsProcessing(false);
        setGeneralError(res.message || "Failed to process order placement.");
        return;
      }

      const { order, razorpay } = res.data;

      // Handle Cash on Delivery (COD) -> Directly redirect to confirmation screen
      if (formData.paymentMethod === "COD") {
        setIsOrderPlaced(true);
        await clearCart();
        router.replace(
          `/order-success/${order.orderNumber}?method=cod&amount=${order.totalAmount}&email=${encodeURIComponent(
            formData.email
          )}&phone=${encodeURIComponent(formData.phone)}`
        );
        return;
      }

      // Handle Online Payment (RAZORPAY)
      if (formData.paymentMethod === "RAZORPAY" && razorpay) {
        const isScriptLoaded = await loadRazorpayScript();

        if (isScriptLoaded && (window as any).Razorpay) {
          const rzpOptions = {
            key: razorpay.keyId,
            amount: razorpay.amount,
            currency: razorpay.currency || "INR",
            name: storeConfig.name,
            description: `Order #${order.orderNumber} Atelier Checkout`,
            image: "https://images.unsplash.com/photo-1566174053879-31528523f8ae?q=80&w=200",
            order_id: razorpay.orderId.startsWith("order_") && !razorpay.orderId.includes("mock") ? razorpay.orderId : undefined,
            prefill: {
              name: `${formData.firstName} ${formData.lastName}`.trim(),
              email: formData.email,
              contact: formData.phone,
            },
            theme: {
              color: "#18181b",
            },
            modal: {
              ondismiss: () => {
                setIsProcessing(false);
                setGeneralError("Payment process was cancelled. You may retry payment or select Cash on Delivery.");
              },
            },
            handler: async (response: any) => {
              try {
                const verifyRes = await CheckoutService.verifyPayment({
                  orderId: order.id,
                  razorpayOrderId: response.razorpay_order_id || razorpay.orderId,
                  razorpayPaymentId: response.razorpay_payment_id || `pay_${Date.now()}`,
                  razorpaySignature: response.razorpay_signature || "verified_sig",
                });

                if (verifyRes.success) {
                  setIsOrderPlaced(true);
                  await clearCart();
                  router.replace(
                    `/order-success/${order.orderNumber}?method=razorpay&amount=${order.totalAmount}&email=${encodeURIComponent(
                      formData.email
                    )}&phone=${encodeURIComponent(formData.phone)}`
                  );
                } else {
                  setIsProcessing(false);
                  setGeneralError(verifyRes.message || "Payment verification failed. Please contact concierge support.");
                }
              } catch (verifyErr: any) {
                setIsProcessing(false);
                setGeneralError(verifyErr.message || "Error verifying payment signature.");
              }
            },
          };

          const rzp = new (window as any).Razorpay(rzpOptions);
          rzp.open();
        } else {
          // Fallback Sandbox Modal if Razorpay script CDN is blocked
          setPendingRazorpayPayload({ order, razorpay });
          setShowSandboxModal(true);
          setIsProcessing(false);
        }
      }
    } catch (err: any) {
      console.error("Order processing error:", err);
      setIsProcessing(false);
      setGeneralError(err.message || "Unexpected error while placing order.");
    }
  };

  // Complete Sandbox Fallback Payment
  const handleCompleteSandboxPayment = async () => {
    if (!pendingRazorpayPayload) return;
    const { order, razorpay } = pendingRazorpayPayload;
    setIsProcessing(true);
    setShowSandboxModal(false);

    try {
      const verifyRes = await CheckoutService.verifyPayment({
        orderId: order.id,
        razorpayOrderId: razorpay.orderId,
        razorpayPaymentId: `pay_sandbox_${Date.now()}`,
        razorpaySignature: `sig_sandbox_${Date.now()}`,
      });

      if (verifyRes.success) {
        setIsOrderPlaced(true);
        await clearCart();
        router.replace(
          `/order-success/${order.orderNumber}?method=razorpay&amount=${order.totalAmount}&email=${encodeURIComponent(
            formData.email
          )}&phone=${encodeURIComponent(formData.phone)}`
        );
      } else {
        setIsProcessing(false);
        setGeneralError("Payment verification failed.");
      }
    } catch (err: any) {
      setIsProcessing(false);
      setGeneralError(err.message || "Sandbox payment verification failed.");
    }
  };

  // Pricing calculations
  const displaySubtotal = summaryData?.pricing.subtotal ?? items.reduce((acc, it) => acc + (it.price * it.quantity), 0);
  const displayDiscount = summaryData?.pricing.discountAmount ?? 0;
  const displayShipping = summaryData?.pricing.shippingAmount ?? (displaySubtotal >= 2999 ? 0 : 150);
  const displayTax = summaryData?.pricing.taxAmount ?? Math.round((displaySubtotal - displayDiscount) * 0.12 * 100) / 100;
  const displayTotal = summaryData?.pricing.totalAmount ?? Math.round((displaySubtotal - displayDiscount + displayShipping + displayTax) * 100) / 100;
  const isCodBlockedByCap = displayTotal > 25000;

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

  if (isOrderPlaced) {
    return (
      <div className="py-24 text-center max-w-md mx-auto space-y-6 min-h-[60vh] flex flex-col items-center justify-center">
        <div className="w-12 h-12 rounded-full border-3 border-[var(--primary)] border-t-transparent animate-spin" />
        <div className="space-y-2">
          <h2 className="font-heading text-xl font-bold uppercase tracking-wider text-[var(--foreground)]">
            Securing Your Order...
          </h2>
          <p className="text-xs text-[var(--muted-foreground)]">
            Generating order confirmation and dispatching receipt. Please do not refresh.
          </p>
        </div>
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
          href="/cart"
          className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[var(--muted-foreground)] hover:text-[var(--foreground)] mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return to Shopping Bag</span>
        </Link>

        {/* Global Error Notice */}
        {generalError && (
          <div className="mb-8 p-4 bg-red-50 border border-red-200 rounded-[var(--radius)] text-xs text-red-700 flex items-start gap-3">
            <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0 text-red-600" />
            <div className="space-y-1">
              <p className="font-bold uppercase tracking-wider">Checkout Notice</p>
              <p>{generalError}</p>
            </div>
          </div>
        )}

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
                  {!isAuthenticated && !featureConfig.guestCheckout && (
                    <span className="text-[11px] text-[var(--secondary)] font-bold">
                      Account Required
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <Input
                      label="Email Address (For Invoicing & Order Updates)"
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
                      label="Phone Number (Mandatory for Delivery & Cash on Delivery Verification)"
                      type="tel"
                      name="phone"
                      required
                      value={formData.phone}
                      onChange={handleInputChange}
                      placeholder="+91 98765 43210"
                      helperText="Used for courier dispatch, delivery pin, and COD verification calls."
                    />
                  </div>
                </div>
              </div>

              {/* Step 2: Shipping Destination */}
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
                  <h2 className="font-heading text-lg font-bold uppercase tracking-wider text-[var(--foreground)]">
                    2. SHIPPING DESTINATION
                  </h2>
                  {isAuthenticated && savedAddresses.length > 0 && (
                    <span className="text-xs text-[var(--muted-foreground)]">
                      {savedAddresses.length} Saved Address{savedAddresses.length > 1 ? "es" : ""}
                    </span>
                  )}
                </div>

                {/* Saved Address Selector */}
                {isAuthenticated && savedAddresses.length > 0 && (
                  <div className="space-y-3 mb-6">
                    <p className="text-xs font-bold uppercase tracking-wider text-[var(--muted-foreground)]">
                      Select Saved Address
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {savedAddresses.map((addr) => {
                        const isSelected = selectedAddressId === addr.id;
                        return (
                          <div
                            key={addr.id}
                            onClick={() => handleSelectAddress(addr.id)}
                            className={`p-4 border rounded-[var(--radius)] cursor-pointer text-xs space-y-1 transition-all ${
                              isSelected
                                ? "border-[var(--foreground)] bg-[var(--muted)] ring-1 ring-[var(--foreground)]"
                                : "border-[var(--border)] hover:border-neutral-400 bg-[var(--background)]"
                            }`}
                          >
                            <div className="flex items-center justify-between font-bold text-[var(--foreground)]">
                              <span>
                                {addr.firstName} {addr.lastName}
                              </span>
                              {addr.isDefault && (
                                <span className="text-[10px] bg-neutral-200 dark:bg-neutral-800 px-1.5 py-0.5 rounded uppercase">
                                  Default
                                </span>
                              )}
                            </div>
                            <p className="text-[var(--muted-foreground)] line-clamp-1">{addr.address1}</p>
                            <p className="text-[var(--muted-foreground)]">
                              {addr.city}, {addr.state} - {addr.postalCode}
                            </p>
                          </div>
                        );
                      })}
                      <div
                        onClick={() => handleSelectAddress("new")}
                        className={`p-4 border border-dashed rounded-[var(--radius)] cursor-pointer text-xs flex items-center justify-center gap-2 transition-all ${
                          selectedAddressId === "new"
                            ? "border-[var(--foreground)] bg-[var(--muted)] ring-1 ring-[var(--foreground)]"
                            : "border-[var(--border)] hover:border-neutral-400 text-[var(--muted-foreground)]"
                        }`}
                      >
                        <Plus className="w-4 h-4" />
                        <span className="font-bold uppercase tracking-wider">Use Different Address</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Address Form Inputs */}
                {(selectedAddressId === "new" || savedAddresses.length === 0) && (
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
                        label="Company / Atelier (Optional)"
                        name="company"
                        value={formData.company}
                        onChange={handleInputChange}
                        placeholder="e.g. Maison Atelier"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <Input
                        label="Street Address / Suite / Apartment"
                        name="address1"
                        required
                        value={formData.address1}
                        onChange={handleInputChange}
                        placeholder="e.g. 42 Crescent Avenue, Suite 4B"
                      />
                    </div>
                    <Input
                      label="City"
                      name="city"
                      required
                      value={formData.city}
                      onChange={handleInputChange}
                      placeholder="e.g. Mumbai"
                    />
                    <Input
                      label="State / Province"
                      name="state"
                      required
                      value={formData.state}
                      onChange={handleInputChange}
                      placeholder="e.g. Maharashtra"
                    />
                    <Input
                      label="Postal Code (PIN)"
                      name="postalCode"
                      required
                      value={formData.postalCode}
                      onChange={handleInputChange}
                      placeholder="e.g. 400001"
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
                )}

                {/* Concierge Notes */}
                <div className="pt-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-[var(--foreground)] opacity-90 block mb-1.5">
                    Concierge Notes & Delivery Instructions (Optional)
                  </label>
                  <textarea
                    name="customerNotes"
                    rows={2}
                    value={formData.customerNotes}
                    onChange={handleInputChange}
                    placeholder="e.g. Ring the bell upon arrival, or leave with security reception."
                    className="w-full px-4 py-3 text-sm bg-[var(--background)] text-[var(--foreground)] border border-[var(--border)] rounded-[var(--radius)] focus:outline-none focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)]"
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
                        formData.paymentMethod === "RAZORPAY"
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
                          value="RAZORPAY"
                          checked={formData.paymentMethod === "RAZORPAY"}
                          onChange={() => setFormData({ ...formData, paymentMethod: "RAZORPAY" })}
                          className="accent-[var(--foreground)]"
                        />
                      </div>
                      <p className="text-[11px] text-[var(--muted-foreground)] mt-3">
                        Cards, UPI, NetBanking via Razorpay 256-bit Encrypted Gateway.
                      </p>
                    </label>
                  )}

                  {/* Cash On Delivery (Respecting feature flag & ₹25k limit) */}
                  {featureConfig.cashOnDelivery && paymentConfig.codEnabled && (
                    <label
                      className={`p-5 rounded-[var(--radius)] border transition-all ${
                        isCodBlockedByCap
                          ? "opacity-60 cursor-not-allowed border-dashed bg-neutral-50 dark:bg-neutral-900/40"
                          : formData.paymentMethod === "COD"
                          ? "border-[var(--foreground)] bg-[var(--muted)] ring-1 ring-[var(--foreground)] cursor-pointer"
                          : "border-[var(--border)] hover:border-[var(--foreground)] cursor-pointer"
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
                          value="COD"
                          disabled={isCodBlockedByCap}
                          checked={formData.paymentMethod === "COD"}
                          onChange={() => {
                            if (!isCodBlockedByCap) {
                              setFormData({ ...formData, paymentMethod: "COD" });
                            }
                          }}
                          className="accent-[var(--foreground)]"
                        />
                      </div>
                      <p className="text-[11px] text-[var(--muted-foreground)] mt-3">
                        {isCodBlockedByCap ? (
                          <span className="text-amber-700 font-semibold flex items-center gap-1">
                            <Info className="w-3.5 h-3.5 inline" /> Capped at ₹25,000. Please choose Online Payment.
                          </span>
                        ) : (
                          "Pay upon doorstep delivery. Phone verification required."
                        )}
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
                disabled={items.length === 0 || displayTotal === 0 || isProcessing}
                className="w-full"
                leftIcon={<Lock className="w-4 h-4" />}
              >
                {isProcessing
                  ? "PROCESSING TRANSACTION..."
                  : formData.paymentMethod === "RAZORPAY"
                  ? `PAY VIA RAZORPAY • ${storeConfig.currency.symbol}${displayTotal.toLocaleString()}`
                  : `CONFIRM CASH ON DELIVERY • ${storeConfig.currency.symbol}${displayTotal.toLocaleString()}`}
              </Button>

              <div className="flex items-center justify-center gap-2 text-[11px] text-[var(--muted-foreground)]">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>SSL Encrypted Checkout • Compliant Razorpay & COD Fulfillment</span>
              </div>
            </form>
          </div>

          {/* Right Column: Pre-Checkout Order Summary (5 cols) */}
          <div className="lg:col-span-5 bg-[var(--muted)] p-6 sm:p-8 rounded-[var(--radius)] border border-[var(--border)] space-y-6 h-fit">
            <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
              <h3 className="font-heading text-lg font-bold uppercase tracking-wider text-[var(--foreground)]">
                ORDER SUMMARY ({items.reduce((acc, i) => acc + i.quantity, 0)})
              </h3>
              {isSummaryLoading && (
                <div className="w-3.5 h-3.5 rounded-full border-2 border-neutral-400 border-t-neutral-800 animate-spin" />
              )}
            </div>

            {/* Authoritative Line Items List */}
            <div className="space-y-4 max-h-72 overflow-y-auto pr-2 scrollbar-none divide-y divide-[var(--border)]">
              {(summaryData?.items || items).map((item: any) => {
                const title = item.title || item.name;
                const unitPrice = item.unitPrice || item.price || 0;
                const lineTotal = item.lineTotal || unitPrice * item.quantity;

                return (
                  <div key={item.cartItemId || item.id} className="pt-3 first:pt-0 flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <img
                        src={item.imageUrl}
                        alt={title}
                        className="w-12 h-16 object-cover rounded-[var(--radius)] flex-shrink-0"
                      />
                      <div>
                        <h4 className="text-xs font-bold uppercase tracking-wide text-[var(--foreground)] line-clamp-1">
                          {title}
                        </h4>
                        <p className="text-[11px] text-[var(--muted-foreground)]">
                          Size: {item.size} • Qty: {item.quantity}
                        </p>
                        {item.modifiers && item.modifiers.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {item.modifiers.map((mod: any) => (
                              <span
                                key={mod.id || mod.name}
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

            {/* Promo Coupon Application */}
            {featureConfig.coupons && (
              <div className="pt-4 border-t border-[var(--border)] space-y-2">
                {appliedCouponCode ? (
                  <div className="flex items-center justify-between bg-emerald-100 text-emerald-950 px-3 py-2 text-xs rounded-[var(--radius)]">
                    <div className="flex items-center gap-1.5 font-bold">
                      <Tag className="w-3.5 h-3.5 text-emerald-800" />
                      <span>Coupon {appliedCouponCode} applied!</span>
                    </div>
                    <button
                      onClick={handleRemoveCoupon}
                      className="underline text-xs cursor-pointer text-emerald-900 hover:text-red-600 transition-colors"
                    >
                      Remove
                    </button>
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
                    <Button variant="outline" size="sm" type="submit" isLoading={isCouponValidating}>
                      APPLY
                    </Button>
                  </form>
                )}
                {couponError && <p className="text-[11px] text-red-600">{couponError}</p>}
              </div>
            )}

            {/* Authoritative Itemized Bill Breakdown */}
            <div className="pt-4 border-t border-[var(--border)] space-y-2.5 text-xs">
              <div className="flex justify-between text-[var(--muted-foreground)]">
                <span>Merchandise Subtotal</span>
                <span>{storeConfig.currency.symbol}{displaySubtotal.toLocaleString()}</span>
              </div>

              {displayDiscount > 0 && (
                <div className="flex justify-between text-emerald-700 font-semibold">
                  <span>Coupon Discount</span>
                  <span>-{storeConfig.currency.symbol}{displayDiscount.toLocaleString()}</span>
                </div>
              )}

              <div className="flex justify-between text-[var(--muted-foreground)]">
                <span>12% GST Luxury Garment Tax</span>
                <span>{storeConfig.currency.symbol}{displayTax.toLocaleString()}</span>
              </div>

              <div className="flex justify-between text-[var(--muted-foreground)]">
                <span>Express White-Glove Shipping</span>
                <span>
                  {displayShipping === 0 ? (
                    <span className="text-emerald-700 font-bold uppercase">COMPLIMENTARY</span>
                  ) : (
                    `${storeConfig.currency.symbol}${displayShipping}`
                  )}
                </span>
              </div>

              <div className="flex justify-between text-sm font-bold text-[var(--foreground)] pt-3 border-t border-[var(--border)]">
                <span>Authoritative Total Due</span>
                <span>{storeConfig.currency.symbol}{displayTotal.toLocaleString()}</span>
              </div>
            </div>

          </div>

        </div>
      </div>

      {/* Fallback Sandbox Payment Modal (when Razorpay CDN is blocked in development) */}
      {showSandboxModal && pendingRazorpayPayload && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-[var(--background)] border border-[var(--border)] rounded-[var(--radius)] max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-2 text-emerald-600 font-bold text-sm uppercase tracking-wider">
              <CheckCircle2 className="w-5 h-5" />
              <span>Razorpay Sandbox Handshake</span>
            </div>
            <p className="text-xs text-[var(--muted-foreground)]">
              Order #{pendingRazorpayPayload.order.orderNumber} created successfully. The Razorpay SDK was simulated for testing.
            </p>
            <div className="bg-[var(--muted)] p-3 rounded text-xs space-y-1 border border-[var(--border)]">
              <p><strong>Razorpay Order ID:</strong> {pendingRazorpayPayload.razorpay.orderId}</p>
              <p><strong>Amount:</strong> {storeConfig.currency.symbol}{(pendingRazorpayPayload.razorpay.amount / 100).toLocaleString()}</p>
              <p><strong>Currency:</strong> {pendingRazorpayPayload.razorpay.currency}</p>
            </div>
            <div className="flex gap-3 pt-2">
              <Button
                variant="primary"
                size="md"
                className="w-full"
                onClick={handleCompleteSandboxPayment}
              >
                COMPLETE PAYMENT & VERIFY SIGNATURE
              </Button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
