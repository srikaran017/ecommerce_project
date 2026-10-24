"use client";

import React, { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuthStore } from "@/stores/auth.store";
import { useWishlistStore } from "@/stores/wishlist.store";
import { CustomerService, AccountDetails } from "@/services/customer.service";
import { AdminOrder } from "@/types/admin.types";
import { storeConfig } from "@/config/store.config";
import { OrderTrackingModal } from "./components/OrderTrackingModal";
import { compileTrackingTimeline } from "@/utils/tracking.utils";
import {
  Package,
  MapPin,
  Heart,
  ChevronRight,
  LogOut,
  ShieldCheck,
  User,
  LogIn,
  Contact2,
  Lock,
  ArrowRight,
  ShoppingBag,
  ExternalLink,
  Truck,
  Search,
  Clock,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  X,
  Star,
  RotateCcw,
} from "lucide-react";

function AccountCenterContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isAuthenticated, logout } = useAuthStore();
  const { wishlistIds } = useWishlistStore();

  const [account, setAccount] = useState<AccountDetails | null>(null);
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [orderCount, setOrderCount] = useState<number>(0);
  const [addressCount, setAddressCount] = useState<number>(0);
  const [reviewsCount, setReviewsCount] = useState<number>(0);
  const [defaultAddress, setDefaultAddress] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isMounted, setIsMounted] = useState(false);

  // Tracking Modal & Quick Lookup State
  const [selectedOrderForTracking, setSelectedOrderForTracking] = useState<AdminOrder | null>(null);
  const [quickLookupNum, setQuickLookupNum] = useState("");
  const [isSearchingOrder, setIsSearchingOrder] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (isMounted && !isAuthenticated) {
      router.replace("/login?redirect=/account");
    }
  }, [isMounted, isAuthenticated, router]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 4000);
  };

  useEffect(() => {
    async function loadAccountData() {
      if (!isAuthenticated) {
        setIsLoading(false);
        return;
      }
      try {
        // 1. Fetch account profile
        const accRes = await CustomerService.getAccountDetails();
        if (accRes.success && accRes.data) {
          setAccount(accRes.data);
        }

        // 2. Fetch addresses count and default
        const addrs = await CustomerService.getAddresses();
        setAddressCount(addrs.length);
        const def = addrs.find((a) => a.isDefault) || addrs[0];
        if (def) {
          setDefaultAddress(
            `${def.address1 || def.addressLine1 || ""}, ${def.city}, ${def.state} ${def.postalCode}`
          );
        }

        // 3. Fetch customer orders
        let fetchedOrders: AdminOrder[] = [];
        try {
          const { OrderService } = await import("@/services/order.service");
          const ordRes = await OrderService.getCustomerOrders({ limit: 10 });
          if (ordRes.data && Array.isArray(ordRes.data)) {
            fetchedOrders = ordRes.data as any;
            setOrderCount(ordRes.pagination?.total ?? ordRes.data.length);
          } else {
            const { AdminService } = await import("@/services/admin.service");
            const local = AdminService.getLocalOrders();
            const userOrders = user?.email
              ? local.filter((o) => o.customerEmail?.toLowerCase() === user.email.toLowerCase())
              : local;
            fetchedOrders = userOrders;
            setOrderCount(userOrders.length);
          }
        } catch {
          const { AdminService } = await import("@/services/admin.service");
          const local = AdminService.getLocalOrders();
          const userOrders = user?.email
            ? local.filter((o) => o.customerEmail?.toLowerCase() === user.email.toLowerCase())
            : local;
          fetchedOrders = userOrders;
          setOrderCount(userOrders.length);
        }

        setOrders(fetchedOrders);

        // Auto-open tracking modal if ?track=1 or ?orderNumber=... was passed
        const trackFlag = searchParams.get("track");
        const orderNumParam = searchParams.get("orderNumber");

        if (orderNumParam) {
          const target = fetchedOrders.find(
            (o) =>
              (o.orderNumber || "").toUpperCase() === orderNumParam.toUpperCase() ||
              o.id === orderNumParam
          );
          if (target) setSelectedOrderForTracking(target);
        } else if (trackFlag && fetchedOrders.length > 0) {
          const active =
            fetchedOrders.find(
              (o) =>
                (o.status || "").toUpperCase() !== "CANCELLED" &&
                (o.status || "").toUpperCase() !== "DELIVERED"
            ) || fetchedOrders[0];
          if (active) setSelectedOrderForTracking(active);
        }
      } catch {
        // Graceful fallback
      } finally {
        setIsLoading(false);
      }
    }

    if (isAuthenticated) {
      loadAccountData();
    } else {
      setIsLoading(false);
    }
  }, [isAuthenticated, user?.email, searchParams]);

  const handleSignOut = async () => {
    await logout();
    router.push("/login");
  };

  // Identify most relevant active order for quick tracking spotlight
  const activeOrder = useMemo(() => {
    if (!orders || orders.length === 0) return null;
    return (
      orders.find(
        (o) =>
          (o.status || "").toUpperCase() !== "CANCELLED" &&
          (o.status || "").toUpperCase() !== "DELIVERED"
      ) || orders[0]
    );
  }, [orders]);

  // Compiled tracking progression for active order
  const activeTrackingTimeline = useMemo(() => {
    if (!activeOrder) return null;
    return compileTrackingTimeline(activeOrder);
  }, [activeOrder]);

  // Quick Tracking Lookup Handler
  const handleQuickTrackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = quickLookupNum.trim();
    if (!clean) {
      showToast("Please enter an Order Number to track.");
      return;
    }

    setIsSearchingOrder(true);
    try {
      // 1. Check in already loaded orders
      const existing = orders.find(
        (o) =>
          (o.orderNumber || "").toUpperCase() === clean.toUpperCase() ||
          o.id.toUpperCase() === clean.toUpperCase()
      );

      if (existing) {
        setSelectedOrderForTracking(existing);
        setQuickLookupNum("");
        setIsSearchingOrder(false);
        return;
      }

      // 2. Lookup order detail from order service
      const { OrderService } = await import("@/services/order.service");
      const res = await OrderService.getOrderDetail(clean);

      if (res.success && res.data) {
        const ord: any = {
          id: res.data.id,
          orderNumber: res.data.orderNumber,
          createdAt: res.data.createdAt,
          status: res.data.status,
          paymentStatus: res.data.paymentStatus,
          paymentMethod: res.data.paymentMethod,
          totalAmount: res.data.pricing?.totalAmount || res.data.totalAmount,
          total: res.data.pricing?.totalAmount || res.data.totalAmount,
          customerName:
            `${res.data.shippingAddress?.firstName || ""} ${res.data.shippingAddress?.lastName || ""}`.trim() ||
            user?.name ||
            "Customer",
          customerEmail: user?.email || "",
          customerPhone: res.data.shippingAddress?.phoneNumber || "",
          shippingAddress: res.data.shippingAddress,
          courierPartner: res.data.courierPartner,
          trackingNumber: res.data.trackingNumber,
          courier: {
            carrierName: res.data.courierPartner || "BlueDart Apex Luxury Express",
            trackingNumber: res.data.trackingNumber || "BLU-LUX73819",
            estimatedDelivery: res.data.estimatedDelivery || "In 3-4 Business Days",
          },
          items: res.data.items,
        };
        setSelectedOrderForTracking(ord);
        setQuickLookupNum("");
      } else {
        // Forward to guest track order portal with query
        router.push(`/track-order?orderNumber=${encodeURIComponent(clean)}`);
      }
    } catch {
      router.push(`/track-order?orderNumber=${encodeURIComponent(clean)}`);
    } finally {
      setIsSearchingOrder(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const s = (status || "").toUpperCase();
    switch (s) {
      case "DELIVERED":
        return {
          label: "Delivered",
          badgeClass: "bg-emerald-50 text-emerald-800 border-emerald-200/80",
          dotClass: "bg-emerald-500",
          icon: CheckCircle2,
        };
      case "SHIPPED":
        return {
          label: "In Transit",
          badgeClass: "bg-sky-50 text-sky-800 border-sky-200/80",
          dotClass: "bg-sky-500",
          icon: Truck,
        };
      case "CANCELLED":
        return {
          label: "Cancelled",
          badgeClass: "bg-red-50 text-red-800 border-red-200/80",
          dotClass: "bg-red-500",
          icon: AlertCircle,
        };
      case "CONFIRMED":
      case "PROCESSING":
      case "PACKED":
      case "PENDING":
      default:
        return {
          label: "In Production / Atelier",
          badgeClass: "bg-amber-50 text-amber-800 border-amber-200/80",
          dotClass: "bg-amber-500",
          icon: Clock,
        };
    }
  };

  if (!isMounted || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-[var(--background)] flex items-center justify-center">
        <div className="w-7 h-7 rounded-full border-2 border-neutral-300 border-t-neutral-900 animate-spin" />
      </div>
    );
  }

  const displayName = account?.name || user?.name || "Customer";
  const displayEmail = account?.email || user?.email || "";
  const initialLetter = displayName.charAt(0).toUpperCase();

  return (
    <div className="min-h-screen bg-[var(--background)] py-8 sm:py-12">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        
        {/* Toast Notification Banner */}
        {toastMessage && (
          <div className="fixed top-20 right-4 sm:right-8 z-50 max-w-md bg-neutral-900 text-white px-4 py-3 rounded-xl shadow-lg border border-neutral-700 flex items-center justify-between gap-3 animate-fade-in">
            <div className="flex items-center gap-2 text-xs">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <p className="font-medium">{toastMessage}</p>
            </div>
            <button
              onClick={() => setToastMessage(null)}
              className="text-neutral-400 hover:text-white p-1"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Breadcrumb Navigation */}
        <nav className="flex items-center gap-2 text-xs text-neutral-500 font-medium">
          <Link href="/" className="hover:text-neutral-900 transition-colors">
            Home
          </Link>
          <span className="text-neutral-300">/</span>
          <span className="text-neutral-900 font-semibold">Account</span>
        </nav>

        {/* Customer Profile Header Card (Shopify Polaris style) */}
        <div className="bg-white rounded-xl border border-neutral-200/90 p-5 sm:p-6 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              {/* Initials Avatar */}
              {user?.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt={displayName}
                  className="w-14 h-14 rounded-full object-cover border border-neutral-200 shrink-0"
                />
              ) : (
                <div className="w-14 h-14 rounded-full bg-neutral-100 border border-neutral-200 text-neutral-700 font-semibold text-lg flex items-center justify-center shrink-0">
                  {initialLetter}
                </div>
              )}

              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <h1 className="text-lg sm:text-xl font-semibold text-neutral-900">
                    {displayName}
                  </h1>
                  {(user?.role === "STORE_ADMIN" || user?.role === "SUPER_ADMIN") && (
                    <span className="text-[10px] font-semibold bg-neutral-100 text-neutral-700 px-2 py-0.5 rounded border border-neutral-200">
                      Staff
                    </span>
                  )}
                </div>
                <p className="text-xs text-neutral-500 font-mono">
                  {displayEmail}
                </p>
                {defaultAddress && (
                  <p className="text-xs text-neutral-500 truncate max-w-md pt-0.5">
                    Default: {defaultAddress}
                  </p>
                )}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-2 self-start sm:self-auto">
              {(user?.role === "STORE_ADMIN" || user?.role === "SUPER_ADMIN") && (
                <Link
                  href="/admin"
                  className="px-3.5 py-2 bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-medium rounded-lg transition-colors shadow-xs flex items-center gap-1.5"
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Admin console</span>
                </Link>
              )}

              <button
                onClick={handleSignOut}
                className="px-3.5 py-2 bg-white hover:bg-neutral-50 text-neutral-700 border border-neutral-300 text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
              >
                <LogOut className="w-3.5 h-3.5 text-neutral-500" />
                <span>Log out</span>
              </button>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* FEATURE: SUPER ATTRACTIVE ORDER TRACKING HUB (DESKTOP & MOBILE FRIENDLY)  */}
        {/* ========================================================================= */}
        <section
          id="tracking"
          className="bg-white rounded-2xl border border-neutral-200/90 shadow-xs overflow-hidden relative"
        >
          {/* Subtle luxury ambient accent glow */}
          <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-bl from-amber-100/40 via-amber-50/10 to-transparent pointer-events-none rounded-tr-2xl" />

          {/* Section Header */}
          <div className="p-5 sm:p-6 border-b border-neutral-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 relative z-10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-600/20 text-amber-800 flex items-center justify-center shrink-0">
                <Truck className="w-5 h-5 text-amber-700" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-sm sm:text-base font-semibold text-neutral-900">
                    Order Tracking & Live Shipments
                  </h2>
                  <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-bold text-amber-900 bg-amber-100/80 px-2 py-0.5 rounded-full border border-amber-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-600 animate-pulse" />
                    Live Milestones
                  </span>
                </div>
                <p className="text-xs text-neutral-500 mt-0.5">
                  Inspect real-time atelier progress, dispatch checkpoints, and white-glove courier delivery.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto">
              <Link
                href="/account/orders"
                className="text-xs font-semibold text-neutral-600 hover:text-amber-800 transition-colors flex items-center gap-1"
              >
                <span>View all orders ({orderCount})</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          <div className="p-5 sm:p-6 space-y-6 relative z-10">
            {/* 1. Active / Latest Order Spotlight Card */}
            {activeOrder ? (
              <div className="bg-gradient-to-r from-neutral-50/90 via-amber-50/30 to-neutral-50/90 border border-neutral-200/90 rounded-xl p-4 sm:p-5 space-y-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <span className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider">
                        Active Order
                      </span>
                      <Link
                        href={`/orders/${activeOrder.orderNumber || activeOrder.id}`}
                        className="font-mono text-sm font-bold text-neutral-900 hover:underline"
                      >
                        #{activeOrder.orderNumber || activeOrder.id}
                      </Link>

                      {(() => {
                        const badge = getStatusBadge(activeOrder.status || "CONFIRMED");
                        const BadgeIcon = badge.icon;
                        return (
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${badge.badgeClass}`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${badge.dotClass} animate-pulse`} />
                            <BadgeIcon className="w-3 h-3" />
                            <span>{badge.label}</span>
                          </span>
                        );
                      })()}
                    </div>

                    <p className="text-xs text-neutral-500">
                      Placed on{" "}
                      <strong className="text-neutral-700">
                        {activeOrder.createdAt
                          ? new Date(activeOrder.createdAt).toLocaleDateString("en-IN", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })
                          : "Recently"}
                      </strong>
                      {activeTrackingTimeline?.estimatedDelivery && (
                        <span>
                          {" "}
                          • Estimated Delivery:{" "}
                          <strong className="text-amber-900 font-semibold">
                            {activeTrackingTimeline.estimatedDelivery}
                          </strong>
                        </span>
                      )}
                    </p>
                  </div>

                  {/* Primary CTA: Track Live Order */}
                  <div className="flex items-center gap-2 self-start md:self-auto">
                    <button
                      onClick={() => setSelectedOrderForTracking(activeOrder)}
                      className="inline-flex items-center gap-2 px-4 py-2.5 bg-neutral-900 hover:bg-neutral-800 text-white rounded-xl text-xs font-semibold uppercase tracking-wider transition-all shadow-xs hover:shadow-md cursor-pointer group"
                    >
                      <Truck className="w-4 h-4 text-amber-400 group-hover:translate-x-0.5 transition-transform" />
                      <span>Track Live Shipment</span>
                    </button>

                    <Link
                      href={`/orders/${activeOrder.orderNumber || activeOrder.id}`}
                      className="inline-flex items-center gap-1 px-3 py-2.5 bg-white hover:bg-neutral-50 text-neutral-700 border border-neutral-300 rounded-xl text-xs font-medium transition-colors shadow-2xs"
                    >
                      <span>Receipt</span>
                      <ExternalLink className="w-3 h-3 text-neutral-400" />
                    </Link>
                  </div>
                </div>

                {/* 5-Step Progress Snapshot Bar */}
                {activeTrackingTimeline && (
                  <div className="pt-2 border-t border-neutral-200/60 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-[11px] font-semibold text-neutral-600 flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-amber-700" />
                        <span>Fulfillment Milestones:</span>
                        <strong className="text-neutral-900">
                          {activeTrackingTimeline.statusLabel}
                        </strong>
                      </span>
                      <span className="text-[10px] font-mono font-bold text-amber-900 bg-amber-100/90 px-2 py-0.5 rounded-full">
                        Step {activeTrackingTimeline.currentStep} of {activeTrackingTimeline.totalSteps}
                      </span>
                    </div>

                    {/* Visual Segment Progress Bar */}
                    <div className="grid grid-cols-5 gap-1.5 sm:gap-2 pt-1">
                      {activeTrackingTimeline.steps.map((st, idx) => {
                        const isDone = st.isCompleted;
                        const isCurr = st.isCurrent;

                        return (
                          <div key={st.key} className="space-y-1">
                            <div
                              className={`h-2 rounded-full transition-all ${
                                isDone
                                  ? "bg-emerald-600"
                                  : isCurr
                                  ? "bg-amber-600 ring-2 ring-amber-200 animate-pulse"
                                  : "bg-neutral-200"
                              }`}
                            />
                            <p
                              className={`text-[10px] truncate hidden sm:block font-medium ${
                                isCurr
                                  ? "text-amber-900 font-bold"
                                  : isDone
                                  ? "text-neutral-800"
                                  : "text-neutral-400"
                              }`}
                            >
                              {st.title}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Garments Preview Thumbnails */}
                {activeOrder.items && activeOrder.items.length > 0 && (
                  <div className="pt-3 border-t border-neutral-200/50 flex flex-wrap items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-neutral-500 font-medium">Garments in parcel:</span>
                      <div className="flex items-center -space-x-2">
                        {activeOrder.items.slice(0, 3).map((it: any, i: number) => {
                          const img =
                            it.imageUrl ||
                            it.image ||
                            "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=500";
                          return (
                            <img
                              key={i}
                              src={img}
                              alt={it.productName || it.title || "Garment"}
                              className="w-8 h-10 object-cover rounded-md border-2 border-white shadow-2xs bg-neutral-100"
                            />
                          );
                        })}
                      </div>
                      {activeOrder.items.length > 3 && (
                        <span className="text-[11px] text-neutral-500 font-medium pl-1">
                          +{activeOrder.items.length - 3} more
                        </span>
                      )}
                    </div>

                    {activeOrder.trackingNumber && (
                      <span className="text-[11px] text-neutral-600 font-mono">
                        AWB: <strong className="text-neutral-900">{activeOrder.trackingNumber}</strong>
                      </span>
                    )}
                  </div>
                )}
              </div>
            ) : null}

            {/* 2. Interactive Quick Order Lookup Bar (Instant In-Page Tracking) */}
            <div className="bg-neutral-50/70 border border-neutral-200/80 rounded-xl p-4 sm:p-5 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-900 flex items-center gap-1.5">
                    <Search className="w-3.5 h-3.5 text-amber-700" />
                    <span>Track Any Order by Number</span>
                  </h3>
                  <p className="text-xs text-neutral-500 mt-0.5">
                    Have an order number or gift tracking ID? Enter it below to check live courier milestones.
                  </p>
                </div>

                <Link
                  href="/track-order"
                  className="text-xs font-semibold text-amber-800 hover:text-amber-900 flex items-center gap-1 self-start sm:self-auto transition-colors"
                >
                  <span>Public Tracking Page</span>
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </div>

              <form onSubmit={handleQuickTrackSubmit} className="flex flex-col sm:flex-row gap-2">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={quickLookupNum}
                    onChange={(e) => setQuickLookupNum(e.target.value)}
                    placeholder="Enter order number (e.g. ORD-20261020-DX40)..."
                    className="w-full pl-9 pr-3 py-2 bg-white border border-neutral-200 rounded-lg text-xs text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900 transition-all font-mono"
                  />
                  {quickLookupNum && (
                    <button
                      type="button"
                      onClick={() => setQuickLookupNum("")}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-700"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isSearchingOrder}
                  className="px-4 py-2 bg-neutral-900 hover:bg-neutral-800 disabled:opacity-50 text-white rounded-lg text-xs font-semibold uppercase tracking-wider transition-colors shadow-xs flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
                >
                  <Truck className="w-3.5 h-3.5 text-amber-400" />
                  <span>{isSearchingOrder ? "Looking up..." : "Track Order"}</span>
                </button>
              </form>
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 6 Logical Shopify / Luxury Navigation Cards Grid                          */}
        {/* ========================================================================= */}
        <div>
          <h2 className="text-sm font-semibold text-neutral-900 uppercase tracking-wider mb-3">
            Account overview
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            
            {/* Card 1: Orders */}
            <Link
              href="/account/orders"
              className="group p-5 bg-white hover:bg-neutral-50/50 border border-neutral-200/90 hover:border-neutral-300 rounded-xl shadow-xs transition-all flex items-start gap-4"
            >
              <div className="w-10 h-10 rounded-lg bg-neutral-100 flex items-center justify-center shrink-0 text-neutral-700 group-hover:bg-neutral-200/80 transition-colors">
                <Package className="w-5 h-5 stroke-[1.75]" />
              </div>
              <div className="space-y-1 flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-neutral-900 group-hover:text-neutral-950">
                    Orders
                  </h3>
                  <span className="text-xs font-medium text-neutral-500 bg-neutral-100 px-2 py-0.5 rounded-full">
                    {orderCount} {orderCount === 1 ? "order" : "orders"}
                  </span>
                </div>
                <p className="text-xs text-neutral-500 leading-relaxed">
                  View past invoices, receipts, and reorder items.
                </p>
                <div className="pt-1 flex items-center gap-1 text-xs font-medium text-neutral-700 group-hover:text-neutral-900">
                  <span>View orders</span>
                  <ChevronRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
                </div>
              </div>
            </Link>

            {/* Card 2: Dedicated Order Tracking Card */}
            <div
              onClick={() => {
                if (activeOrder) {
                  setSelectedOrderForTracking(activeOrder);
                } else {
                  const el = document.getElementById("tracking");
                  if (el) el.scrollIntoView({ behavior: "smooth" });
                }
              }}
              className="group p-5 bg-gradient-to-br from-amber-50/70 via-white to-amber-50/40 hover:from-amber-100/60 hover:to-white border border-amber-200/90 hover:border-amber-300 rounded-xl shadow-xs transition-all flex items-start gap-4 cursor-pointer"
            >
              <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center shrink-0 text-amber-800 group-hover:bg-amber-200 transition-colors">
                <Truck className="w-5 h-5 stroke-[1.75]" />
              </div>
              <div className="space-y-1 flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-neutral-900 group-hover:text-amber-950">
                    Track Shipments
                  </h3>
                  <span className="text-xs font-bold text-amber-800 bg-amber-100/80 px-2 py-0.5 rounded-full border border-amber-200">
                    {activeOrder ? "Live Tracking" : "Lookup"}
                  </span>
                </div>
                <p className="text-xs text-neutral-500 leading-relaxed">
                  Canonical 5-step milestone timeline, courier checkpoints & AWB status.
                </p>
                <div className="pt-1 flex items-center gap-1 text-xs font-bold text-amber-800 group-hover:text-amber-900">
                  <span>{activeOrder ? "Track active shipment" : "Track by order #"}</span>
                  <ChevronRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
                </div>
              </div>
            </div>

            {/* Card 3: Account Details & Security */}
            <Link
              href="/account/details"
              className="group p-5 bg-white hover:bg-neutral-50/50 border border-neutral-200/90 hover:border-neutral-300 rounded-xl shadow-xs transition-all flex items-start gap-4"
            >
              <div className="w-10 h-10 rounded-lg bg-neutral-100 flex items-center justify-center shrink-0 text-neutral-700 group-hover:bg-neutral-200/80 transition-colors">
                <Contact2 className="w-5 h-5 stroke-[1.75]" />
              </div>
              <div className="space-y-1 flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-neutral-900 group-hover:text-neutral-950">
                    Profile & security
                  </h3>
                  <span className="text-xs font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/60">
                    Protected
                  </span>
                </div>
                <p className="text-xs text-neutral-500 leading-relaxed">
                  Update contact details, personal name, and password.
                </p>
                <div className="pt-1 flex items-center gap-1 text-xs font-medium text-neutral-700 group-hover:text-neutral-900">
                  <span>Edit profile</span>
                  <ChevronRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
                </div>
              </div>
            </Link>

            {/* Card 4: Addresses */}
            <Link
              href="/account/addresses"
              className="group p-5 bg-white hover:bg-neutral-50/50 border border-neutral-200/90 hover:border-neutral-300 rounded-xl shadow-xs transition-all flex items-start gap-4"
            >
              <div className="w-10 h-10 rounded-lg bg-neutral-100 flex items-center justify-center shrink-0 text-neutral-700 group-hover:bg-neutral-200/80 transition-colors">
                <MapPin className="w-5 h-5 stroke-[1.75]" />
              </div>
              <div className="space-y-1 flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-neutral-900 group-hover:text-neutral-950">
                    Addresses
                  </h3>
                  <span className="text-xs font-medium text-neutral-500 bg-neutral-100 px-2 py-0.5 rounded-full">
                    {addressCount} {addressCount === 1 ? "address" : "addresses"}
                  </span>
                </div>
                <p className="text-xs text-neutral-500 leading-relaxed">
                  Manage shipping destinations and set your primary residence.
                </p>
                <div className="pt-1 flex items-center gap-1 text-xs font-medium text-neutral-700 group-hover:text-neutral-900">
                  <span>Manage addresses</span>
                  <ChevronRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
                </div>
              </div>
            </Link>

            {/* Card 5: Wishlist */}
            <Link
              href="/account/wishlist"
              className="group p-5 bg-white hover:bg-neutral-50/50 border border-neutral-200/90 hover:border-neutral-300 rounded-xl shadow-xs transition-all flex items-start gap-4"
            >
              <div className="w-10 h-10 rounded-lg bg-neutral-100 flex items-center justify-center shrink-0 text-neutral-700 group-hover:bg-neutral-200/80 transition-colors">
                <Heart className="w-5 h-5 stroke-[1.75]" />
              </div>
              <div className="space-y-1 flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-neutral-900 group-hover:text-neutral-950">
                    Wishlist
                  </h3>
                  <span className="text-xs font-medium text-neutral-500 bg-neutral-100 px-2 py-0.5 rounded-full">
                    {wishlistIds.length} {wishlistIds.length === 1 ? "item" : "items"}
                  </span>
                </div>
                <p className="text-xs text-neutral-500 leading-relaxed">
                  View and manage garments saved to your private wishlist.
                </p>
                <div className="pt-1 flex items-center gap-1 text-xs font-medium text-neutral-700 group-hover:text-neutral-900">
                  <span>View wishlist</span>
                  <ChevronRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
                </div>
              </div>
            </Link>

            {/* Card 6: Reviews */}
            <Link
              href="/account/reviews"
              className="group p-5 bg-white hover:bg-neutral-50/50 border border-neutral-200/90 hover:border-neutral-300 rounded-xl shadow-xs transition-all flex items-start gap-4"
            >
              <div className="w-10 h-10 rounded-lg bg-neutral-100 flex items-center justify-center shrink-0 text-neutral-700 group-hover:bg-neutral-200/80 transition-colors">
                <Star className="w-5 h-5 stroke-[1.75]" />
              </div>
              <div className="space-y-1 flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-neutral-900 group-hover:text-neutral-950">
                    My Reviews
                  </h3>
                  <span className="text-xs font-medium text-neutral-500 bg-neutral-100 px-2 py-0.5 rounded-full">
                    Artisanal Feedback
                  </span>
                </div>
                <p className="text-xs text-neutral-500 leading-relaxed">
                  Review garments you purchased and share your fitting experience.
                </p>
                <div className="pt-1 flex items-center gap-1 text-xs font-medium text-neutral-700 group-hover:text-neutral-900">
                  <span>View reviews</span>
                  <ChevronRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
                </div>
              </div>
            </Link>

          </div>
        </div>

        {/* Quick Help & Catalog Access Card */}
        <div className="rounded-xl border border-neutral-200/90 bg-white p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
          <div>
            <h3 className="text-sm font-semibold text-neutral-900">
              Need assistance with your couture delivery?
            </h3>
            <p className="text-xs text-neutral-500 mt-0.5">
              Contact our concierge for bespoke fitting inquiries or special dispatch requests.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/contact"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-neutral-50 text-neutral-700 border border-neutral-300 rounded-lg text-xs font-medium transition-colors shadow-2xs"
            >
              <span>Contact Concierge</span>
            </Link>

            <Link
              href="/products"
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-neutral-900 hover:bg-neutral-800 text-white rounded-lg text-xs font-medium transition-colors shadow-xs"
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>Continue shopping</span>
            </Link>
          </div>
        </div>

      </div>

      {/* Live Order Tracking Modal */}
      {selectedOrderForTracking && (
        <OrderTrackingModal
          order={selectedOrderForTracking}
          onClose={() => setSelectedOrderForTracking(null)}
          onShowToast={showToast}
        />
      )}
    </div>
  );
}

export default function AccountCenterPage() {
  return (
    <React.Suspense
      fallback={
        <div className="min-h-screen bg-[var(--background)] flex items-center justify-center">
          <div className="w-7 h-7 rounded-full border-2 border-neutral-300 border-t-neutral-900 animate-spin" />
        </div>
      }
    >
      <AccountCenterContent />
    </React.Suspense>
  );
}
