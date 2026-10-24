"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Search,
  Package,
  Truck,
  ShieldCheck,
  Clock,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  MapPin,
  Mail,
  Phone,
  MessageSquare,
  Sparkles,
  RotateCcw,
} from "lucide-react";
import { OrderService } from "@/services/order.service";
import { useAuthStore } from "@/stores/auth.store";
import { storeConfig } from "@/config/store.config";
import { featureConfig } from "@/config/feature.config";
import { TrackOrderResponseData } from "@/types/tracking.types";
import { OrderProgressBar } from "@/components/tracking/OrderProgressBar";
import { OrderActivityTimeline } from "@/components/tracking/OrderActivityTimeline";
import { OrderCourierCard } from "@/components/tracking/OrderCourierCard";

function TrackOrderContent() {
  const searchParams = useSearchParams();
  const { user, isAuthenticated } = useAuthStore();

  const [orderNumberInput, setOrderNumberInput] = useState("");
  const [contactInput, setContactInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [trackingData, setTrackingData] = useState<TrackOrderResponseData | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Initialize from URL search parameters on mount
  useEffect(() => {
    const qOrderNumber = searchParams.get("orderNumber") || "";
    const qEmail = searchParams.get("email") || "";
    const qPhone = searchParams.get("phone") || "";
    const qContact = searchParams.get("emailOrPhone") || qEmail || qPhone || "";

    if (qOrderNumber) {
      setOrderNumberInput(qOrderNumber);
    }

    if (qContact) {
      setContactInput(qContact);
    } else if (isAuthenticated && user?.email) {
      setContactInput(user.email);
    }

    if (qOrderNumber) {
      executeTracking(qOrderNumber, qContact || (isAuthenticated ? user?.email || "" : ""));
    }
  }, [searchParams, isAuthenticated, user]);

  const executeTracking = async (orderNum: string, contactVal: string) => {
    const cleanNum = orderNum.trim();
    if (!cleanNum) {
      setErrorMessage("Please enter your Order Number.");
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const contactPayload: { email?: string; phone?: string; emailOrPhone?: string } = {};
      const cleanContact = contactVal.trim();
      if (cleanContact) {
        if (cleanContact.includes("@")) {
          contactPayload.email = cleanContact;
        } else if (/^\+?\d+$/.test(cleanContact.replace(/[\s-]/g, ""))) {
          contactPayload.phone = cleanContact;
        } else {
          contactPayload.emailOrPhone = cleanContact;
        }
      }

      const res = await OrderService.trackOrder(cleanNum, contactPayload);

      if (res.success && res.data) {
        setTrackingData(res.data);
        setErrorMessage(null);
      } else {
        setTrackingData(null);
        setErrorMessage(
          res.message ||
          "Order details could not be verified. Please check the order number and email or phone number entered."
        );
      }
    } catch (err: any) {
      setTrackingData(null);
      setErrorMessage(
        err.message || "An unexpected error occurred while looking up your order."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    executeTracking(orderNumberInput, contactInput);
  };

  const handleResetSearch = () => {
    setTrackingData(null);
    setErrorMessage(null);
    setOrderNumberInput("");
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  return (
    <div className="min-h-screen bg-[var(--background)] py-10 sm:py-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Toast Notification */}
        {toastMessage && (
          <div className="fixed top-20 right-4 sm:right-8 z-50 max-w-sm bg-neutral-900 text-white px-4 py-3 rounded-xl shadow-xl flex items-center gap-2.5 text-xs animate-fade-in border border-neutral-700">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Page Header */}
        <div className="text-center space-y-2 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-50 text-amber-800 text-[11px] font-bold uppercase tracking-widest border border-amber-200">
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            <span>White-Glove Courier & Atelier Tracking</span>
          </div>
          <h1 className="font-heading text-2xl sm:text-4xl font-bold tracking-tight text-neutral-900">
            Track Your Order
          </h1>
          <p className="text-xs sm:text-sm text-neutral-500 leading-relaxed">
            Follow your handcrafted garment from our master atelier to your doorstep with live milestone updates.
          </p>
        </div>

        {/* Interactive Search Card */}
        <div className="bg-white rounded-3xl border border-neutral-200/90 shadow-sm p-6 sm:p-8 space-y-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Order Number Field */}
              <div className="space-y-1.5 text-left">
                <label
                  htmlFor="orderNumber"
                  className="block text-xs font-bold uppercase tracking-wider text-neutral-700"
                >
                  Order Number <span className="text-amber-700">*</span>
                </label>
                <div className="relative">
                  <Package className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    id="orderNumber"
                    type="text"
                    required
                    value={orderNumberInput}
                    onChange={(e) => setOrderNumberInput(e.target.value)}
                    placeholder="e.g. ORD-20261020-DX40"
                    className="w-full pl-10 pr-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-xs sm:text-sm font-medium text-neutral-900 placeholder:text-neutral-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-600/30 focus:border-amber-600 transition-all font-mono"
                  />
                </div>
              </div>

              {/* Email or Phone Verification */}
              <div className="space-y-1.5 text-left">
                <div className="flex items-center justify-between">
                  <label
                    htmlFor="contactVerification"
                    className="block text-xs font-bold uppercase tracking-wider text-neutral-700"
                  >
                    Email or Phone {isAuthenticated ? "(Optional)" : <span className="text-amber-700">*</span>}
                  </label>
                  {isAuthenticated && (
                    <span className="text-[10px] text-emerald-700 font-semibold">
                      ✓ Logged-in verified
                    </span>
                  )}
                </div>
                <div className="relative">
                  <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    id="contactVerification"
                    type="text"
                    required={!isAuthenticated}
                    value={contactInput}
                    onChange={(e) => setContactInput(e.target.value)}
                    placeholder={
                      isAuthenticated
                        ? "Verified via your account session"
                        : "e.g. reshi@gmail.com or 9361200683"
                    }
                    className="w-full pl-10 pr-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-xs sm:text-sm font-medium text-neutral-900 placeholder:text-neutral-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-600/30 focus:border-amber-600 transition-all"
                  />
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
              <p className="text-[11px] text-neutral-400">
                🔒 Public guest tracking is privacy-protected with masked personal information.
              </p>

              <button
                type="submit"
                disabled={isLoading}
                className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white font-semibold text-xs uppercase tracking-wider transition-all shadow-xs disabled:opacity-50 cursor-pointer"
              >
                {isLoading ? (
                  <>
                    <div className="w-3.5 h-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                    <span>Locating package...</span>
                  </>
                ) : (
                  <>
                    <span>Track Order</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Error Banner */}
          {errorMessage && (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 flex items-start gap-3 text-xs text-left animate-fade-in">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-bold">Verification Notice</p>
                <p className="text-rose-700 leading-relaxed">{errorMessage}</p>
              </div>
            </div>
          )}
        </div>

        {/* Tracking Details View */}
        {trackingData && (
          <div className="space-y-6 animate-fade-in text-left">
            {/* Order Overview Header Card */}
            <div className="bg-white rounded-3xl border border-neutral-200/90 shadow-sm p-6 sm:p-7 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-100 pb-5">
                <div>
                  <div className="flex items-center gap-2.5">
                    <h2 className="font-mono text-xl sm:text-2xl font-bold tracking-tight text-neutral-900">
                      #{trackingData.orderNumber}
                    </h2>
                    <span
                      className={`px-3 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${trackingData.tracking.isDelivered
                        ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                        : trackingData.tracking.isCancelled
                          ? "bg-rose-50 text-rose-800 border-rose-200"
                          : "bg-amber-50 text-amber-800 border-amber-200"
                        }`}
                    >
                      {trackingData.tracking.statusLabel || trackingData.status}
                    </span>
                  </div>

                  <p className="text-xs text-neutral-500 mt-1">
                    Placed on{" "}
                    {new Date(trackingData.createdAt).toLocaleDateString("en-IN", {
                      weekday: "short",
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}{" "}
                    • {storeConfig.currency.symbol}
                    {Number(trackingData.totalAmount).toLocaleString()} ({trackingData.itemsCount}{" "}
                    {trackingData.itemsCount === 1 ? "item" : "items"})
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleResetSearch}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-neutral-200 hover:bg-neutral-50 text-xs text-neutral-600 font-medium transition-colors cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Track Another</span>
                  </button>
                </div>
              </div>

              {/* Canonical 5-Step Stepper */}
              <div className="py-2">
                <OrderProgressBar tracking={trackingData.tracking} />
              </div>

              {/* Courier Partner & AWB Credentials */}
              <OrderCourierCard
                tracking={trackingData.tracking}
                onCopied={(awb) => showToast(`AWB Tracking #${awb} copied!`)}
              />

              {/* Customer and Shipping Snapshot */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-neutral-100 text-xs">
                {trackingData.customer && (
                  <div className="p-4 rounded-2xl bg-neutral-50/70 border border-neutral-100 space-y-1">
                    <span className="block text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                      Recipient Profile
                    </span>
                    <p className="font-bold text-neutral-900">
                      {trackingData.customer.name || "Valued Client"}
                    </p>
                    <p className="text-neutral-500 font-mono text-[11px]">
                      {trackingData.customer.email || "Confidential"}
                    </p>
                    <p className="text-neutral-500 font-mono text-[11px]">
                      {trackingData.customer.phone || "Confidential"}
                    </p>
                  </div>
                )}

                {trackingData.shippingAddress && (
                  <div className="p-4 rounded-2xl bg-neutral-50/70 border border-neutral-100 space-y-1">
                    <span className="block text-[10px] font-bold uppercase tracking-wider text-neutral-400 flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-amber-700" />
                      <span>Destination</span>
                    </span>
                    <p className="font-bold text-neutral-900">
                      {trackingData.shippingAddress.city},{" "}
                      {trackingData.shippingAddress.state}
                    </p>
                    <p className="text-neutral-500">
                      Postal Code: {trackingData.shippingAddress.postalCode} •{" "}
                      {trackingData.shippingAddress.country}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Checkpoint Timeline Feed Card */}
            <div className="bg-white rounded-3xl border border-neutral-200/90 shadow-sm p-6 sm:p-7 space-y-5">
              <div className="flex items-center justify-between border-b border-neutral-100 pb-4">
                <div className="space-y-0.5">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-neutral-900 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-amber-700" />
                    <span>Real-Time Activity Feed</span>
                  </h3>
                  <p className="text-xs text-neutral-500">
                    Timestamped atelier and courier delivery updates
                  </p>
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-neutral-100 text-neutral-700">
                  {trackingData.tracking.checkpoints?.length || 0} Events
                </span>
              </div>

              <OrderActivityTimeline
                checkpoints={trackingData.tracking.checkpoints}
              />
            </div>

            {/* Garments in this Order Card */}
            {trackingData.items && trackingData.items.length > 0 && (
              <div className="bg-white rounded-3xl border border-neutral-200/90 shadow-sm p-6 sm:p-7 space-y-4">
                <h3 className="text-sm font-bold uppercase tracking-wider text-neutral-900 flex items-center gap-2">
                  <Package className="w-4 h-4 text-amber-700" />
                  <span>Garments in this Shipment</span>
                </h3>

                <div className="divide-y divide-neutral-100">
                  {trackingData.items.map((item) => (
                    <div
                      key={item.id}
                      className="py-3.5 flex items-center justify-between gap-4"
                    >
                      <div className="flex items-center gap-3.5">
                        <div className="w-14 h-16 rounded-xl bg-neutral-100 overflow-hidden shrink-0 border border-neutral-200">
                          {item.imageUrl ? (
                            <img
                              src={item.imageUrl}
                              alt={item.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-neutral-400">
                              <Package className="w-5 h-5" />
                            </div>
                          )}
                        </div>

                        <div>
                          <p className="text-xs sm:text-sm font-bold text-neutral-900 line-clamp-1">
                            {item.title}
                          </p>
                          <div className="flex items-center gap-2 text-xs text-neutral-500 mt-0.5">
                            {item.size && <span>Size: {item.size}</span>}
                            {item.color && (
                              <>
                                <span>•</span>
                                <span>Color: {item.color}</span>
                              </>
                            )}
                            <span>•</span>
                            <span>Qty: {item.quantity}</span>
                          </div>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-xs sm:text-sm font-bold text-neutral-900">
                          {storeConfig.currency.symbol}
                          {Number(item.totalPrice || item.price).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Concierge Support Desk CTA */}
            <div className="p-6 rounded-3xl bg-neutral-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <h4 className="text-sm font-bold uppercase tracking-wider flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-amber-400" />
                  <span>Need Delivery Assistance?</span>
                </h4>
                <p className="text-xs text-neutral-300">
                  Our private client concierge is available daily to assist with special delivery instructions or schedule changes.
                </p>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                {featureConfig.whatsapp && (
                  <a
                    href={`https://wa.me/${storeConfig.contact.whatsapp.replace(/[^0-9]/g, "")}?text=Hello%2C%20I%20have%20an%20inquiry%20regarding%20order%20${trackingData.orderNumber}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition-colors"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>WhatsApp</span>
                  </a>
                )}
                <Link
                  href="/contact"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition-colors"
                >
                  <Mail className="w-3.5 h-3.5" />
                  <span>Contact Concierge</span>
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function TrackOrderPage() {
  return (
    <Suspense
      fallback={
        <div className="py-24 max-w-xl mx-auto px-4 text-center space-y-3 min-h-[60vh] flex flex-col items-center justify-center">
          <div className="w-7 h-7 rounded-full border-2 border-neutral-300 border-t-neutral-900 animate-spin" />
          <p className="text-xs text-neutral-500 font-medium">
            Loading order tracking engine...
          </p>
        </div>
      }
    >
      <TrackOrderContent />
    </Suspense>
  );
}
