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
  ArrowRight,
  QrCode,
  Smartphone,
  Copy,
  Check,
  ExternalLink,
} from "lucide-react";
import { useCartStore } from "@/stores/cart.store";
import { useAuthStore } from "@/stores/auth.store";
import { storeConfig } from "@/config/store.config";
import { featureConfig } from "@/config/feature.config";
import { paymentConfig, getStorePaymentConfig, PaymentMethodsConfig } from "@/config/payment.config";
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

  // Dynamic Payment Gateways Configuration State
  const [paymentSettings, setPaymentSettings] = useState<PaymentMethodsConfig>(getStorePaymentConfig());
  const [upiReference, setUpiReference] = useState("");
  const [upiRefError, setUpiRefError] = useState("");
  const [copiedUpi, setCopiedUpi] = useState(false);

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
    paymentMethod: "RAZORPAY" as "RAZORPAY" | "COD" | "UPI_QR",
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

  // Load and listen to payment config changes in real-time
  useEffect(() => {
    const config = getStorePaymentConfig();
    setPaymentSettings(config);

    if (formData.paymentMethod === "RAZORPAY" && !config.enableRazorpay) {
      if (config.enableUpiQr) setFormData((prev) => ({ ...prev, paymentMethod: "UPI_QR" }));
      else if (config.enableCod) setFormData((prev) => ({ ...prev, paymentMethod: "COD" }));
    } else if (formData.paymentMethod === "COD" && !config.enableCod) {
      if (config.enableRazorpay) setFormData((prev) => ({ ...prev, paymentMethod: "RAZORPAY" }));
      else if (config.enableUpiQr) setFormData((prev) => ({ ...prev, paymentMethod: "UPI_QR" }));
    } else if (formData.paymentMethod === "UPI_QR" && !config.enableUpiQr) {
      if (config.enableRazorpay) setFormData((prev) => ({ ...prev, paymentMethod: "RAZORPAY" }));
      else if (config.enableCod) setFormData((prev) => ({ ...prev, paymentMethod: "COD" }));
    }

    const handleUpdate = () => {
      const updated = getStorePaymentConfig();
      setPaymentSettings(updated);
    };

    window.addEventListener("payment-config-updated", handleUpdate);
    window.addEventListener("storage", handleUpdate);
    return () => {
      window.removeEventListener("payment-config-updated", handleUpdate);
      window.removeEventListener("storage", handleUpdate);
    };
  }, []);

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

  // Guide unauthenticated users to login since backend checkout requires authentication
  useEffect(() => {
    if (isMounted && !isAuthenticated) {
      setGeneralError("Authentication required. Redirecting you to login to complete checkout...");
      const timer = setTimeout(() => {
        router.push("/login?redirect=/checkout");
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [isMounted, isAuthenticated, router]);

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
      } else if (
        res.statusCode === 401 ||
        res.error?.code === "UNAUTHORIZED" ||
        res.message?.toLowerCase().includes("authentication required")
      ) {
        setGeneralError("Authentication required. Redirecting you to login to complete checkout...");
        setTimeout(() => {
          router.push("/login?redirect=/checkout");
        }, 1200);
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

    // Cash on Delivery is capped at configured limit
    const currentTotal = summaryData?.pricing.totalAmount ?? 0;
    const codLimit = paymentSettings.codMaxLimit || 25000;
    if (formData.paymentMethod === "COD" && currentTotal > codLimit) {
      setGeneralError(
        `Cash on Delivery (COD) orders are capped at ${storeConfig.currency.symbol}${codLimit.toLocaleString()}. Your order total is ${storeConfig.currency.symbol}${currentTotal.toLocaleString()}. Please select Online Payment via Razorpay or UPI QR.`
      );
      return;
    }

    // UPI Reference is mandatory for Direct UPI QR payments
    if (formData.paymentMethod === "UPI_QR") {
      const cleanRef = upiReference.trim();
      if (!cleanRef) {
        setUpiRefError("Please enter your 12-digit UPI Reference / UTR Number after completing payment.");
        setGeneralError("UPI Reference / UTR Number is required to confirm your UPI payment.");
        return;
      }
      if (cleanRef.length < 6) {
        setUpiRefError("Please enter a valid reference number (at least 6 digits).");
        return;
      }
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
        upiReference: formData.paymentMethod === "UPI_QR" ? upiReference.trim() : undefined,
      };

      if (selectedAddressId !== "new") {
        placeOrderPayload.shippingAddressId = selectedAddressId;
      }
      placeOrderPayload.shippingAddress = shippingAddressPayload;

      const res = await CheckoutService.placeOrder(placeOrderPayload);

      if (!res.success || !res.data) {
        setIsProcessing(false);
        if (
          res.statusCode === 401 ||
          res.error?.code === "UNAUTHORIZED" ||
          res.message?.toLowerCase().includes("authentication required")
        ) {
          setGeneralError("Authentication required. Redirecting you to login to complete checkout...");
          setTimeout(() => {
            router.push("/login?redirect=/checkout");
          }, 1200);
          return;
        }
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

      // Handle Direct UPI QR Payment -> Redirect to confirmation screen with UTR
      if (formData.paymentMethod === "UPI_QR") {
        setIsOrderPlaced(true);
        await clearCart();
        router.replace(
          `/order-success/${order.orderNumber}?method=upi_qr&amount=${order.totalAmount}&email=${encodeURIComponent(
            formData.email
          )}&phone=${encodeURIComponent(formData.phone)}&utr=${encodeURIComponent(upiReference.trim())}`
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
  const displayShipping = 150; // Statically 150 delivery charge for all customers
  const displayTax = 0; // Tax is inclusive in product price; no additional tax charged
  const displayTotal = summaryData?.pricing.totalAmount ?? Math.round((displaySubtotal - displayDiscount + displayShipping) * 100) / 100;
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

  if (isMounted && !isAuthenticated) {
    return (
      <div className="py-24 max-w-xl mx-auto px-4 text-center space-y-6">
        <div className="w-16 h-16 rounded-full bg-amber-50 text-amber-700 flex items-center justify-center mx-auto border border-amber-200 shadow-sm">
          <Lock className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <span className="text-[11px] font-bold uppercase tracking-[0.25em] text-[var(--secondary)]">
            SECURE ATELIER CHECKOUT
          </span>
          <h1 className="font-heading text-3xl font-bold uppercase tracking-tight text-[var(--foreground)]">
            AUTHENTICATION REQUIRED
          </h1>
          <p className="text-xs sm:text-sm text-[var(--muted-foreground)] max-w-md mx-auto leading-relaxed">
            Please log in or register an account to review your order summary and complete your luxury purchase. Redirecting you to login...
          </p>
        </div>
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link href="/login?redirect=/checkout">
            <Button variant="primary" size="md" rightIcon={<ArrowRight className="w-4 h-4" />}>
              LOG IN TO PROCEED
            </Button>
          </Link>
          <Link href="/cart">
            <Button variant="outline" size="md">
              RETURN TO SHOPPING BAG
            </Button>
          </Link>
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
          <div
            className={`mb-8 p-5 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 border shadow-sm ${
              generalError.toLowerCase().includes("authentication") || generalError.toLowerCase().includes("log in")
                ? "bg-amber-500/10 border-amber-500/30 text-amber-900"
                : "bg-red-50 border-red-200 text-red-700"
            }`}
          >
            <div className="flex items-start gap-3.5">
              <AlertCircle
                className={`w-5 h-5 mt-0.5 flex-shrink-0 ${
                  generalError.toLowerCase().includes("authentication") || generalError.toLowerCase().includes("log in")
                    ? "text-amber-600"
                    : "text-red-600"
                }`}
              />
              <div className="space-y-1">
                <p className="font-bold text-xs uppercase tracking-wider">
                  {generalError.toLowerCase().includes("authentication") || generalError.toLowerCase().includes("log in")
                    ? "Authentication Required"
                    : "Checkout Notice"}
                </p>
                <p className="text-xs">{generalError}</p>
              </div>
            </div>

            {(generalError.toLowerCase().includes("authentication") || generalError.toLowerCase().includes("log in")) && (
              <Link href="/login?redirect=/checkout" className="shrink-0">
                <Button variant="primary" size="sm" rightIcon={<ArrowRight className="w-3.5 h-3.5" />}>
                  LOG IN TO PROCEED
                </Button>
              </Link>
            )}
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

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  
                  {/* 1. Online Payment (Razorpay / Cards / Wallets) */}
                  {paymentSettings.enableRazorpay && (
                    <label
                      className={`p-4 rounded-[var(--radius)] border cursor-pointer flex flex-col justify-between transition-all ${
                        formData.paymentMethod === "RAZORPAY"
                          ? "border-[var(--foreground)] bg-[var(--muted)] ring-1 ring-[var(--foreground)]"
                          : "border-[var(--border)] hover:border-[var(--foreground)]"
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          <CreditCard className="w-4 h-4 text-[var(--foreground)]" />
                          <span className="text-xs font-bold uppercase tracking-wider text-[var(--foreground)]">
                            Razorpay
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
                      <p className="text-[11px] text-[var(--muted-foreground)] mt-2.5">
                        Cards, UPI, NetBanking via Razorpay Gateway.
                      </p>
                    </label>
                  )}

                  {/* 2. Direct UPI & QR Code Payment */}
                  {paymentSettings.enableUpiQr && (
                    <label
                      className={`p-4 rounded-[var(--radius)] border cursor-pointer flex flex-col justify-between transition-all ${
                        formData.paymentMethod === "UPI_QR"
                          ? "border-[var(--foreground)] bg-[var(--muted)] ring-1 ring-[var(--foreground)]"
                          : "border-[var(--border)] hover:border-[var(--foreground)]"
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          <QrCode className="w-4 h-4 text-amber-500" />
                          <span className="text-xs font-bold uppercase tracking-wider text-[var(--foreground)]">
                            UPI QR Code
                          </span>
                        </div>
                        <input
                          type="radio"
                          name="paymentMethod"
                          value="UPI_QR"
                          checked={formData.paymentMethod === "UPI_QR"}
                          onChange={() => setFormData({ ...formData, paymentMethod: "UPI_QR" })}
                          className="accent-[var(--foreground)]"
                        />
                      </div>
                      <p className="text-[11px] text-[var(--muted-foreground)] mt-2.5">
                        Dynamic QR + 1-Tap GPay / PhonePe / Paytm.
                      </p>
                    </label>
                  )}

                  {/* 3. Cash On Delivery (COD) */}
                  {paymentSettings.enableCod && featureConfig.cashOnDelivery && (
                    <label
                      className={`p-4 rounded-[var(--radius)] border transition-all ${
                        isCodBlockedByCap
                          ? "opacity-60 cursor-not-allowed border-dashed bg-neutral-50 dark:bg-neutral-900/40"
                          : formData.paymentMethod === "COD"
                          ? "border-[var(--foreground)] bg-[var(--muted)] ring-1 ring-[var(--foreground)] cursor-pointer"
                          : "border-[var(--border)] hover:border-[var(--foreground)] cursor-pointer"
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          <Banknote className="w-4 h-4 text-[var(--foreground)]" />
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
                      <p className="text-[11px] text-[var(--muted-foreground)] mt-2.5">
                        {isCodBlockedByCap ? (
                          <span className="text-amber-700 font-semibold flex items-center gap-1">
                            <Info className="w-3.5 h-3.5 inline" /> Capped at ₹{(paymentSettings.codMaxLimit || 25000).toLocaleString()}.
                          </span>
                        ) : (
                          "Pay upon doorstep delivery."
                        )}
                      </p>
                    </label>
                  )}

                </div>

                {/* Direct UPI Dynamic QR Drawer */}
                {formData.paymentMethod === "UPI_QR" && (
                  <div className="mt-4 p-5 sm:p-6 rounded-[var(--radius)] border border-amber-500/40 bg-amber-500/5 space-y-5 animate-in fade-in duration-200">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--foreground)] flex items-center gap-2">
                          <QrCode className="w-4 h-4 text-amber-500" />
                          <span>Direct UPI Instant Payment</span>
                          <span className="text-[9px] font-bold text-emerald-600 bg-emerald-100 dark:bg-emerald-950/60 dark:text-emerald-400 px-1.5 py-0.5 rounded">
                            0% Fee
                          </span>
                        </h3>
                        <p className="text-[11px] text-[var(--muted-foreground)] mt-0.5">
                          {paymentSettings.instructions || "Scan the QR code or tap 'Pay via UPI App', then enter your 12-digit UPI Reference / UTR Number below to confirm."}
                        </p>
                      </div>
                    </div>

                    {/* NPCI UPI URI and scannable visual layout */}
                    {(() => {
                      const dynamicUpiUri = `upi://pay?pa=${encodeURIComponent(
                        paymentSettings.upiId || "maison@okhdfcbank"
                      )}&pn=${encodeURIComponent(
                        paymentSettings.payeeName || "Maison De Élégance"
                      )}&am=${displayTotal.toFixed(2)}&cu=INR&tn=Order%20Payment`;

                      const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(
                        dynamicUpiUri
                      )}&margin=6`;

                      return (
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-center">
                          {/* Desktop QR Display */}
                          <div className="md:col-span-5 flex flex-col items-center justify-center p-3 bg-white rounded-xl border border-slate-200 shadow-sm mx-auto w-fit">
                            <img
                              src={qrCodeUrl}
                              alt="Order UPI QR Code"
                              className="w-40 h-40 object-contain"
                            />
                            <span className="text-[10px] font-mono font-bold text-slate-800 mt-2">
                              Scan to pay {storeConfig.currency.symbol}{displayTotal.toLocaleString()}
                            </span>
                          </div>

                          {/* Mobile 1-Tap Payment & Details */}
                          <div className="md:col-span-7 space-y-3.5">
                            {/* 1-Tap App Trigger (Mobile Friendly, No Screenshot Required) */}
                            <div>
                              <a
                                href={dynamicUpiUri}
                                className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs uppercase tracking-wider rounded-[var(--radius)] shadow-md transition-all active:scale-[0.99] text-center"
                              >
                                <Smartphone className="w-4 h-4" />
                                <span>Pay {storeConfig.currency.symbol}{displayTotal.toLocaleString()} via UPI App</span>
                                <ExternalLink className="w-3.5 h-3.5 opacity-80" />
                              </a>
                              <p className="text-[10px] text-[var(--muted-foreground)] mt-1.5 flex items-center gap-1.5">
                                <span className="text-amber-500 font-bold">●</span>
                                <span>Tap button above to open GPay, PhonePe, Paytm, or BHIM directly without taking screenshots.</span>
                              </p>
                            </div>

                            {/* VPA Details Box */}
                            <div className="p-3 bg-[var(--background)] border border-[var(--border)] rounded-[var(--radius)] text-xs space-y-1.5">
                              <div className="flex items-center justify-between">
                                <span className="text-[var(--muted-foreground)] text-[11px]">Payee Name:</span>
                                <span className="font-bold text-[var(--foreground)]">{paymentSettings.payeeName}</span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-[var(--muted-foreground)] text-[11px]">Merchant UPI ID:</span>
                                <div className="flex items-center gap-1.5 font-mono font-bold text-[var(--foreground)]">
                                  <span>{paymentSettings.upiId}</span>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      if (typeof navigator !== "undefined" && navigator.clipboard) {
                                        navigator.clipboard.writeText(paymentSettings.upiId);
                                        setCopiedUpi(true);
                                        setTimeout(() => setCopiedUpi(false), 2000);
                                      }
                                    }}
                                    className="p-1 hover:bg-[var(--muted)] rounded text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors cursor-pointer"
                                    title="Copy UPI ID"
                                  >
                                    {copiedUpi ? (
                                      <Check className="w-3 h-3 text-emerald-500" />
                                    ) : (
                                      <Copy className="w-3 h-3" />
                                    )}
                                  </button>
                                </div>
                              </div>
                              <div className="flex justify-between border-t border-[var(--border)] pt-1">
                                <span className="text-[var(--muted-foreground)] text-[11px]">Amount:</span>
                                <strong className="font-mono text-amber-500">{storeConfig.currency.symbol}{displayTotal.toLocaleString()}</strong>
                              </div>
                            </div>

                            {/* 12-Digit UTR Entry Field */}
                            <div className="space-y-1 pt-1">
                              <label className="text-xs font-bold uppercase tracking-wider text-[var(--foreground)] flex items-center justify-between">
                                <span>
                                  12-Digit UPI Reference / UTR Number <span className="text-rose-500">*</span>
                                </span>
                                <span className="text-[10px] text-[var(--muted-foreground)] font-normal">
                                  From UPI payment receipt
                                </span>
                              </label>
                              <input
                                type="text"
                                required
                                value={upiReference}
                                onChange={(e) => {
                                  setUpiReference(e.target.value);
                                  if (upiRefError) setUpiRefError("");
                                }}
                                placeholder="e.g. 428901234567"
                                className="w-full px-3.5 py-2.5 text-xs font-mono bg-[var(--background)] text-[var(--foreground)] border border-[var(--border)] rounded-[var(--radius)] focus:outline-none focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)]"
                              />
                              {upiRefError && (
                                <p className="text-[11px] text-rose-600 font-medium flex items-center gap-1 mt-1">
                                  <AlertCircle className="w-3.5 h-3.5 inline shrink-0" />
                                  <span>{upiRefError}</span>
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                )}
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
                  : formData.paymentMethod === "UPI_QR"
                  ? `CONFIRM ORDER VIA UPI • ${storeConfig.currency.symbol}${displayTotal.toLocaleString()}`
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
                <span>Taxes & Duties</span>
                <span className="text-emerald-700 font-semibold uppercase text-[11px]">Included in price</span>
              </div>

              <div className="flex justify-between text-[var(--muted-foreground)]">
                <span>Express Courier Delivery</span>
                <span>
                  {storeConfig.currency.symbol}{displayShipping}
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
