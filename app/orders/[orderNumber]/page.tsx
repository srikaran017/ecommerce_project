"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/auth.store";
import { OrderService } from "@/services/order.service";
import { CustomerOrder } from "@/types/order.types";
import { storeConfig } from "@/config/store.config";
import {
  ArrowLeft,
  Package,
  Truck,
  CheckCircle2,
  Clock,
  Ban,
  Copy,
  RotateCcw,
  ShoppingBag,
  MapPin,
  CreditCard,
  Banknote,
  FileText,
  AlertCircle,
  X,
  PhoneCall,
  Gift,
  Check,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import { compileTrackingTimeline } from "@/utils/tracking.utils";
import { OrderProgressBar } from "@/components/tracking/OrderProgressBar";
import { OrderActivityTimeline } from "@/components/tracking/OrderActivityTimeline";
import { OrderCourierCard } from "@/components/tracking/OrderCourierCard";

export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();

  const orderNumber = (params?.orderNumber as string) || "";

  const [order, setOrder] = useState<CustomerOrder | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [copiedAwb, setCopiedAwb] = useState(false);

  // Cancellation Modal State
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [isCancelling, setIsCancelling] = useState(false);

  // Reorder State
  const [isReordering, setIsReordering] = useState(false);

  // Toast
  const [toastMessage, setToastMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const showToast = (type: "success" | "error", text: string) => {
    setToastMessage({ type, text });
    setTimeout(() => setToastMessage(null), 4000);
  };

  const loadOrderDetail = async () => {
    setIsLoading(true);
    try {
      const res = await OrderService.getOrderDetail(orderNumber);
      if (res.success && res.data) {
        setOrder(res.data);
      } else {
        setOrder(null);
      }
    } catch {
      setOrder(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!isAuthenticated) {
      router.push(`/login?redirect=/orders/${orderNumber}`);
      return;
    }
    if (orderNumber) {
      loadOrderDetail();
    }
  }, [orderNumber, isAuthenticated, router]);

  const handleCopyAwb = (awb: string) => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(awb);
      setCopiedAwb(true);
      showToast("success", `Tracking number ${awb} copied!`);
      setTimeout(() => setCopiedAwb(false), 2500);
    }
  };

  const handleCancelOrder = async () => {
    if (!order) return;
    setIsCancelling(true);
    try {
      const res = await OrderService.cancelOrder(order.orderNumber, cancelReason);
      if (res.success) {
        showToast("success", res.message || "Order has been cancelled.");
        setIsCancelModalOpen(false);
        setOrder((prev) => (prev ? { ...prev, status: "CANCELLED" } : null));
      } else {
        showToast("error", res.message || "Unable to cancel order.");
      }
    } catch (err: any) {
      showToast("error", err.message || "Unexpected cancellation error.");
    } finally {
      setIsCancelling(false);
    }
  };

  const handleReorder = async () => {
    if (!order) return;
    setIsReordering(true);
    try {
      const res = await OrderService.reorder(order.orderNumber);
      if (res.success) {
        showToast("success", res.message || "Items added to your shopping bag!");
        if (res.data?.skippedItems && res.data.skippedItems.length > 0) {
          setTimeout(() => {
            showToast("error", `Note: ${res.data?.skippedItems.map((i) => i.title).join(", ")} was skipped (out of stock).`);
          }, 4500);
        }
      } else {
        showToast("error", res.message || "Failed to reorder items.");
      }
    } catch (err: any) {
      showToast("error", err.message || "Unexpected reorder error.");
    } finally {
      setIsReordering(false);
    }
  };

  if (isLoading) {
    return (
      <div className="py-24 max-w-xl mx-auto px-4 text-center space-y-3 min-h-[60vh] flex flex-col items-center justify-center">
        <div className="w-7 h-7 rounded-full border-2 border-neutral-300 border-t-neutral-900 animate-spin" />
        <p className="text-xs text-neutral-500 font-medium">
          Retrieving order details #{orderNumber}...
        </p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="py-20 max-w-md mx-auto px-4 text-center space-y-4">
        <div className="w-12 h-12 rounded-full bg-neutral-100 flex items-center justify-center mx-auto text-neutral-400">
          <AlertCircle className="w-6 h-6" />
        </div>
        <div className="space-y-1">
          <h2 className="text-lg font-semibold text-neutral-900">
            Order not found
          </h2>
          <p className="text-xs text-neutral-500">
            Order #{orderNumber} could not be located or does not belong to your account.
          </p>
        </div>
        <Link
          href="/orders"
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-neutral-900 hover:bg-neutral-800 text-white rounded-lg text-xs font-medium transition-colors shadow-xs"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to orders</span>
        </Link>
      </div>
    );
  }

  const isPending = order.status === "PENDING";
  const isDelivered = order.status === "DELIVERED";
  const isCancelled = order.status === "CANCELLED";
  const isShipped = order.status === "SHIPPED";

  // Timeline Step Status
  const getStepState = (stepIndex: number) => {
    if (isCancelled) return "cancelled";
    const statusOrder = ["PENDING", "CONFIRMED", "SHIPPED", "OUT_FOR_DELIVERY", "DELIVERED"];
    const currentIndex = statusOrder.indexOf(order.status);
    if (currentIndex >= stepIndex) return "completed";
    if (currentIndex === stepIndex - 1) return "active";
    return "pending";
  };

  const totalAmount = Number(
    order.totalAmount ?? (order as any).total ?? order.pricing?.totalAmount ?? 0
  );
  const deliveryCharge = Number(
    order.pricing?.shippingAmount ?? (order as any).shippingAmount ?? (order as any).shipping ?? storeConfig.shipping.flatRate
  );
  const discountAmount = Number(
    order.pricing?.discountAmount ?? (order as any).discountAmount ?? (order as any).discount ?? 0
  );
  const subtotal = Number(
    order.pricing?.subtotal ?? (order as any).subtotal ?? Math.max(0, totalAmount - deliveryCharge + discountAmount)
  );
  const orderItems = Array.isArray(order.items) ? order.items : [];

  return (
    <div className="min-h-screen bg-[var(--background)] py-8 sm:py-12">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        
        {/* Toast */}
        {toastMessage && (
          <div className="fixed top-20 right-4 sm:right-8 z-50 max-w-md bg-neutral-900 text-white px-4 py-3 rounded-xl shadow-lg flex items-center justify-between gap-3 animate-fade-in border border-neutral-700">
            <div className="flex items-center gap-2 text-xs">
              {toastMessage.type === "success" ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              )}
              <p className="font-medium">{toastMessage.text}</p>
            </div>
            <button onClick={() => setToastMessage(null)} className="text-neutral-400 hover:text-white p-1">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Back Link */}
        <nav className="flex items-center gap-2 text-xs text-neutral-500 font-medium">
          <Link href="/orders" className="inline-flex items-center gap-1.5 hover:text-neutral-900 transition-colors">
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Orders</span>
          </Link>
          <span className="text-neutral-300">/</span>
          <span className="text-neutral-900 font-semibold font-mono">#{order.orderNumber}</span>
        </nav>

        {/* Order Header Card */}
        <div className="bg-white border border-neutral-200/90 rounded-xl p-5 sm:p-6 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-200/80 pb-5">
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-neutral-900 font-mono">
                  #{order.orderNumber}
                </h1>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                    isDelivered
                      ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                      : isCancelled
                      ? "bg-red-50 text-red-800 border-red-200"
                      : isShipped
                      ? "bg-sky-50 text-sky-800 border-sky-200"
                      : "bg-amber-50 text-amber-800 border-amber-200"
                  }`}
                >
                  {isDelivered ? "Delivered" : isCancelled ? "Cancelled" : isShipped ? "In transit" : "Confirmed"}
                </span>
              </div>
              <p className="text-xs text-neutral-500 mt-1">
                Placed on {new Date(order.createdAt).toLocaleDateString("en-IN", {
                  weekday: "short",
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })} • {order.paymentMethod === "COD" ? "Cash on Delivery" : "Paid"}
              </p>
            </div>

            {/* Reorder and Cancel CTAs */}
            <div className="flex items-center gap-2 self-start sm:self-auto">
              {isPending && (
                <button
                  onClick={() => setIsCancelModalOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white text-red-600 hover:bg-red-50 border border-red-200 rounded-lg text-xs font-medium transition-colors cursor-pointer shadow-2xs"
                >
                  <Ban className="w-3.5 h-3.5" />
                  <span>Cancel order</span>
                </button>
              )}

              <button
                onClick={handleReorder}
                disabled={isReordering}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-neutral-900 hover:bg-neutral-800 text-white rounded-lg text-xs font-medium transition-colors shadow-xs cursor-pointer disabled:opacity-50"
              >
                <RotateCcw className={`w-3.5 h-3.5 ${isReordering ? "animate-spin" : ""}`} />
                <span>Buy again</span>
              </button>
            </div>
          </div>

          {/* Canonical 5-Step Fulfillment Stepper */}
          {(() => {
            const tracking = order.tracking || compileTrackingTimeline(order);
            return (
              <div className="space-y-4 pt-1">
                <div className="flex items-center justify-between border-b border-neutral-100 pb-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-800 flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5 text-amber-700" />
                    <span>Fulfillment & Delivery Progress</span>
                  </h3>
                  <span className="text-[10px] text-neutral-500 font-medium">
                    Step {tracking.currentStep} of {tracking.totalSteps}
                  </span>
                </div>

                <OrderProgressBar tracking={tracking} />

                {/* Courier Card */}
                {tracking.courierPartner && tracking.trackingNumber && (
                  <OrderCourierCard
                    tracking={tracking}
                    onCopied={(awb) => showToast("success", `Tracking number ${awb} copied!`)}
                  />
                )}
              </div>
            );
          })()}
        </div>

        {/* Grid: Ordered Items (7 cols) + Summary (5 cols) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Left Column: Items Breakdown */}
          <div className="lg:col-span-7 bg-white border border-neutral-200/90 rounded-xl p-5 sm:p-6 space-y-4 shadow-xs">
            <h3 className="text-sm font-semibold text-neutral-900 border-b border-neutral-100 pb-3 flex items-center gap-2">
              <Package className="w-4 h-4 text-neutral-500" />
              <span>Items ({orderItems.reduce((acc, i) => acc + (i.quantity || 1), 0)})</span>
            </h3>

            <div className="divide-y divide-neutral-100">
              {orderItems.map((item) => (
                <div key={item.id} className="py-3.5 first:pt-0 last:pb-0 flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 min-w-0">
                    {item.imageUrl ? (
                      <img
                        src={item.imageUrl}
                        alt={item.title}
                        className="w-14 h-16 object-cover rounded-lg border border-neutral-200 bg-neutral-50 shrink-0"
                      />
                    ) : (
                      <div className="w-14 h-16 bg-neutral-100 rounded-lg border border-neutral-200 flex items-center justify-center shrink-0">
                        <Package className="w-4 h-4 text-neutral-400" />
                      </div>
                    )}
                    <div className="min-w-0">
                      <h4 className="text-xs font-semibold text-neutral-900 truncate">
                        {item.title}
                      </h4>
                      <p className="text-xs text-neutral-500 mt-0.5">
                        {item.size ? `Size: ${item.size} • ` : ""}
                        Qty: {item.quantity}
                      </p>
                      {(item as any).modifiers && (item as any).modifiers.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1.5">
                          {(item as any).modifiers.map((mod: any, mIdx: number) => {
                            const groupLabel = mod.groupDisplayName || mod.groupName;
                            const isText = Boolean(mod.textValue);
                            const displayText = isText
                              ? `${groupLabel ? `${groupLabel}: ` : ""}"${mod.textValue}"`
                              : mod.optionName || mod.name || "Customization";
                            const deltaText = mod.priceDelta > 0
                              ? ` (+${storeConfig.currency.symbol}${mod.priceDelta.toLocaleString()})`
                              : "";

                            return (
                              <span
                                key={mod.id || mIdx}
                                className="text-[10px] text-amber-900 bg-amber-500/10 border border-amber-300/80 px-2 py-0.5 rounded font-medium inline-block"
                              >
                                {displayText}{deltaText}
                              </span>
                            );
                          })}
                        </div>
                      )}
                      {item.productSlug && (
                        <Link
                          href={`/products/${item.productSlug}`}
                          className="text-xs text-neutral-700 hover:text-neutral-900 hover:underline mt-1 inline-block"
                        >
                          View item
                        </Link>
                      )}
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-xs font-semibold text-neutral-900 font-mono block">
                      {storeConfig.currency.symbol}{Number(item.totalPrice).toLocaleString()}
                    </span>
                    <span className="text-[11px] text-neutral-500">
                      {storeConfig.currency.symbol}{Number(item.price).toLocaleString()} each
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column: Order Summary & Address */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* Cost Breakdown Card */}
            <div className="bg-white border border-neutral-200/90 rounded-xl p-5 sm:p-6 space-y-3.5 shadow-xs">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-700 border-b border-neutral-100 pb-2.5">
                Order summary
              </h3>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between text-neutral-600">
                  <span>Subtotal</span>
                  <span className="font-mono text-neutral-900">
                    {storeConfig.currency.symbol}{subtotal.toLocaleString()}
                  </span>
                </div>

                {discountAmount > 0 ? (
                  <div className="flex justify-between text-emerald-700 font-medium">
                    <span>Discount</span>
                    <span className="font-mono">-{storeConfig.currency.symbol}{discountAmount.toLocaleString()}</span>
                  </div>
                ) : null}

                <div className="flex justify-between text-neutral-600">
                  <span>Delivery charge</span>
                  <span className="font-mono text-neutral-900">
                    {storeConfig.currency.symbol}{deliveryCharge.toLocaleString()}
                  </span>
                </div>

                <div className="flex justify-between text-sm font-semibold text-neutral-900 pt-2.5 border-t border-neutral-200">
                  <span>Total</span>
                  <span className="font-mono font-bold text-base">
                    {storeConfig.currency.symbol}{totalAmount.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Atelier & Courier Live Checkpoints Timeline Feed */}
            {(() => {
              const tracking = order.tracking || compileTrackingTimeline(order);
              if (!tracking.checkpoints || tracking.checkpoints.length === 0) return null;
              return (
                <div className="bg-white border border-neutral-200/90 rounded-xl p-5 sm:p-6 space-y-4 shadow-xs">
                  <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
                    <h3 className="text-sm font-semibold text-neutral-900 flex items-center gap-2">
                      <Clock className="w-4 h-4 text-amber-700" />
                      <span>Atelier & Courier Timeline</span>
                    </h3>
                    <span className="text-[10px] text-neutral-500 font-mono">
                      {tracking.checkpoints.length} Checkpoints
                    </span>
                  </div>
                  <OrderActivityTimeline checkpoints={tracking.checkpoints} />
                </div>
              );
            })()}

            {/* Delivery Destination Card */}
            {order.shippingAddress && (
              <div className="bg-white border border-neutral-200/90 rounded-xl p-5 sm:p-6 space-y-3 shadow-xs">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-700 border-b border-neutral-100 pb-2.5 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-neutral-500" />
                  <span>Delivery address</span>
                </h3>

                <div className="text-xs text-neutral-600 space-y-1">
                  <p className="font-semibold text-neutral-900">
                    {order.shippingAddress.firstName} {order.shippingAddress.lastName}
                  </p>
                  {order.shippingAddress.company && <p>{order.shippingAddress.company}</p>}
                  <p>{order.shippingAddress.address1}</p>
                  {order.shippingAddress.address2 && <p>{order.shippingAddress.address2}</p>}
                  <p>
                    {order.shippingAddress.city}, {order.shippingAddress.state} - {order.shippingAddress.postalCode}
                  </p>
                  <p>{order.shippingAddress.country}</p>
                  {order.shippingAddress.phoneNumber && (
                    <p className="pt-1 text-neutral-700 font-mono text-[11px]">
                      Phone: {order.shippingAddress.phoneNumber}
                    </p>
                  )}
                </div>
              </div>
            )}

          </div>

        </div>

      </div>

      {/* Cancellation Modal */}
      {isCancelModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-white border border-neutral-200 rounded-xl max-w-md w-full p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
              <h3 className="text-sm font-semibold text-neutral-900 flex items-center gap-2">
                <Ban className="w-4 h-4 text-red-600" />
                <span>Cancel Order #{order.orderNumber}</span>
              </h3>
              <button onClick={() => setIsCancelModalOpen(false)} className="text-neutral-400 hover:text-neutral-700">
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-neutral-600 leading-relaxed">
              Are you sure you want to cancel this order? Reserved items will be released back into inventory.
            </p>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-neutral-700 block">
                Reason for cancellation <span className="text-neutral-400">(optional)</span>
              </label>
              <textarea
                rows={3}
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="e.g. Ordered incorrect size, changed mind"
                className="w-full px-3 py-2 text-xs bg-white text-neutral-900 border border-neutral-300 rounded-lg focus:outline-none focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900"
              />
            </div>

            <div className="flex gap-2.5 pt-2">
              <button
                onClick={() => setIsCancelModalOpen(false)}
                className="flex-1 px-4 py-2 bg-neutral-100 text-neutral-700 rounded-lg text-xs font-medium hover:bg-neutral-200 transition-colors cursor-pointer"
              >
                Keep order
              </button>
              <button
                onClick={handleCancelOrder}
                disabled={isCancelling}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg text-xs font-medium hover:bg-red-700 transition-colors disabled:opacity-50 cursor-pointer shadow-xs"
              >
                {isCancelling ? "Cancelling..." : "Cancel order"}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
