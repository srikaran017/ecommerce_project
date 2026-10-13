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
} from "lucide-react";

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
      }
    } catch (err: any) {
      console.warn("Error loading order detail:", err);
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
  }, [isAuthenticated, orderNumber, router]);

  const handleCopyAwb = (awb: string) => {
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(awb);
      setCopiedAwb(true);
      setTimeout(() => setCopiedAwb(false), 2500);
    }
  };

  const handleCancelOrder = async () => {
    if (!order) return;
    setIsCancelling(true);
    try {
      const res = await OrderService.cancelOrder(order.orderNumber, cancelReason);
      if (res.success) {
        showToast("success", res.message || "Order successfully cancelled.");
        setIsCancelModalOpen(false);
        loadOrderDetail();
      } else {
        showToast("error", res.message || "Failed to cancel order.");
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
        showToast("success", res.message || "Items merged into your shopping bag!");
        if (res.data?.skippedItems && res.data.skippedItems.length > 0) {
          setTimeout(() => {
            showToast("error", `Note: ${res.data?.skippedItems.map((i) => i.title).join(", ")} was skipped (out of stock).`);
          }, 4500);
        }
      } else {
        showToast("error", res.message || "Failed to reorder garments.");
      }
    } catch (err: any) {
      showToast("error", err.message || "Unexpected reorder error.");
    } finally {
      setIsReordering(false);
    }
  };

  if (isLoading) {
    return (
      <div className="py-28 text-center min-h-[60vh] flex flex-col items-center justify-center space-y-4">
        <div className="w-8 h-8 rounded-full border-2 border-neutral-300 border-t-neutral-900 animate-spin" />
        <p className="text-xs uppercase tracking-wider text-[var(--muted-foreground)]">
          Retrieving Garment Dossier #{orderNumber}...
        </p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="py-24 max-w-xl mx-auto px-4 text-center space-y-4">
        <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
        <h2 className="font-heading text-xl font-bold uppercase tracking-wider text-[var(--foreground)]">
          Order Not Located
        </h2>
        <p className="text-xs text-[var(--muted-foreground)]">
          Order #{orderNumber} could not be found or does not belong to your account.
        </p>
        <Link
          href="/orders"
          className="inline-flex items-center gap-2 px-4 py-2 bg-[var(--primary)] text-[var(--primary-foreground)] rounded-[var(--radius)] text-xs font-bold uppercase tracking-wider"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return to Orders</span>
        </Link>
      </div>
    );
  }

  const isPending = order.status === "PENDING";
  const isConfirmed = order.status === "CONFIRMED";
  const isShipped = order.status === "SHIPPED";
  const isOutForDelivery = order.status === "OUT_FOR_DELIVERY";
  const isDelivered = order.status === "DELIVERED";
  const isCancelled = order.status === "CANCELLED";

  // Timeline Step Status
  const getStepState = (stepIndex: number) => {
    if (isCancelled) return "cancelled";
    const statusOrder = ["PENDING", "CONFIRMED", "SHIPPED", "OUT_FOR_DELIVERY", "DELIVERED"];
    const currentIndex = statusOrder.indexOf(order.status);
    if (currentIndex >= stepIndex) return "completed";
    if (currentIndex === stepIndex - 1) return "active";
    return "pending";
  };

  return (
    <div className="min-h-screen bg-[var(--background)] py-10 sm:py-14">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        
        {/* Toast */}
        {toastMessage && (
          <div className="fixed top-20 right-4 sm:right-8 z-50 max-w-md bg-neutral-900 text-white px-5 py-3.5 rounded-2xl shadow-xl flex items-center justify-between gap-3 animate-fade-in border border-neutral-700">
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
        <Link
          href="/orders"
          className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Order History</span>
        </Link>

        {/* Header Hero Card */}
        <div className="bg-[var(--background)] border border-[var(--border)] rounded-[var(--radius)] p-6 sm:p-8 space-y-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--border)] pb-5">
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="font-heading text-2xl sm:text-3xl font-bold tracking-tight text-[var(--foreground)] font-mono">
                  #{order.orderNumber}
                </h1>
                <span
                  className={`px-2.5 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider border ${
                    isDelivered
                      ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                      : isCancelled
                      ? "bg-rose-50 text-rose-800 border-rose-200"
                      : isShipped
                      ? "bg-sky-50 text-sky-800 border-sky-200"
                      : "bg-amber-50 text-amber-800 border-amber-200"
                  }`}
                >
                  {order.status}
                </span>
              </div>
              <p className="text-xs text-[var(--muted-foreground)] mt-1">
                Placed on {new Date(order.createdAt).toLocaleDateString("en-IN", {
                  weekday: "short",
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })} • {order.paymentMethod === "COD" ? "Cash on Delivery" : "Online Gateway"} ({order.paymentStatus})
              </p>
            </div>

            {/* Reorder and Cancel CTAs */}
            <div className="flex items-center gap-2 self-start sm:self-auto">
              {isPending && (
                <button
                  onClick={() => setIsCancelModalOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 rounded-[var(--radius)] text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
                >
                  <Ban className="w-3.5 h-3.5" />
                  <span>Cancel Order</span>
                </button>
              )}

              <button
                onClick={handleReorder}
                disabled={isReordering}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-[var(--foreground)] text-[var(--background)] hover:opacity-90 rounded-[var(--radius)] text-xs font-bold uppercase tracking-wider transition-opacity shadow-sm cursor-pointer disabled:opacity-50"
              >
                <RotateCcw className={`w-3.5 h-3.5 ${isReordering ? "animate-spin" : ""}`} />
                <span>Buy Again</span>
              </button>
            </div>
          </div>

          {/* Visual Stepper Timeline */}
          {!isCancelled ? (
            <div className="space-y-4 pt-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--muted-foreground)]">
                Fulfillment Milestones
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-center text-[10px] font-bold uppercase tracking-wider">
                {[
                  { label: "1. Placed", key: 0 },
                  { label: "2. Confirmed", key: 1 },
                  { label: "3. Shipped", key: 2 },
                  { label: "4. Out for Delivery", key: 3 },
                  { label: "5. Delivered", key: 4 },
                ].map((step) => {
                  const state = getStepState(step.key);
                  const isDone = state === "completed";
                  return (
                    <div
                      key={step.key}
                      className={`p-3 rounded-[var(--radius)] border transition-all ${
                        isDone
                          ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                          : "bg-[var(--muted)] text-[var(--muted-foreground)] border-[var(--border)]"
                      }`}
                    >
                      <span>{step.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-[var(--radius)] text-xs text-rose-900 space-y-1">
              <p className="font-bold uppercase tracking-wider flex items-center gap-1.5">
                <Ban className="w-4 h-4 text-rose-600" />
                <span>Order Cancelled</span>
              </p>
              <p>
                This order was cancelled on {order.cancelledAt ? new Date(order.cancelledAt).toLocaleDateString() : "recently"}.
                {order.cancelReason ? ` Reason: "${order.cancelReason}"` : ""}
              </p>
            </div>
          )}

          {/* Courier Live Tracking Card */}
          {order.courierPartner && order.trackingNumber && (
            <div className="p-4 sm:p-5 bg-sky-50 dark:bg-sky-950/30 border border-sky-200 dark:border-sky-800 rounded-[var(--radius)] flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-sky-950 dark:text-sky-200">
              <div className="space-y-1">
                <div className="flex items-center gap-2 font-bold text-xs uppercase tracking-wider">
                  <Truck className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                  <span>Courier Partner: {order.courierPartner}</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-sky-800 dark:text-sky-400">Tracking AWB:</span>
                  <span className="font-mono font-bold">{order.trackingNumber}</span>
                  <button
                    onClick={() => handleCopyAwb(order.trackingNumber!)}
                    className="p-1 hover:bg-sky-200/50 rounded text-sky-700 dark:text-sky-300"
                    title="Copy Tracking Number"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                  {copiedAwb && <span className="text-[10px] text-emerald-700 font-bold">Copied!</span>}
                </div>
              </div>

              {order.estimatedDelivery && (
                <div className="text-right sm:border-l sm:border-sky-200 sm:pl-5">
                  <span className="text-[11px] text-sky-800 dark:text-sky-400 block">Expected Arrival</span>
                  <strong className="text-sm font-bold">
                    {new Date(order.estimatedDelivery).toLocaleDateString("en-IN", {
                      weekday: "short",
                      day: "numeric",
                      month: "short",
                    })}
                  </strong>
                </div>
              )}
            </div>
          )}

          {/* Public Metafields & Gift Note */}
          {order.metafields && order.metafields.length > 0 && (
            <div className="p-4 bg-amber-50/60 border border-amber-200/70 rounded-[var(--radius)] space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-amber-900 flex items-center gap-1.5">
                <Gift className="w-3.5 h-3.5 text-amber-700" />
                <span>Special Concierge Requests & Packaging</span>
              </h4>
              <div className="space-y-1 text-xs text-amber-800">
                {order.metafields.map((mf, i) => (
                  <p key={i}>
                    <strong>{mf.key.replace(/_/g, " ").toUpperCase()}:</strong> {mf.value}
                    {mf.description ? ` (${mf.description})` : ""}
                  </p>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Grid: Ordered Garments (7 cols) + Address & Payment Summary (5 cols) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Column: Garments Snapshot */}
          <div className="lg:col-span-7 bg-[var(--background)] border border-[var(--border)] rounded-[var(--radius)] p-6 space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-[var(--foreground)] border-b border-[var(--border)] pb-3 flex items-center gap-2">
              <Package className="w-4 h-4 text-amber-700" />
              <span>Garments Ordered ({order.items.reduce((acc, i) => acc + i.quantity, 0)})</span>
            </h3>

            <div className="divide-y divide-[var(--border)]">
              {order.items.map((item) => (
                <div key={item.id} className="py-4 first:pt-0 last:pb-0 flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    {item.imageUrl ? (
                      <img
                        src={item.imageUrl}
                        alt={item.title}
                        className="w-14 h-18 object-cover rounded-[var(--radius)] shrink-0 border border-[var(--border)]"
                      />
                    ) : (
                      <div className="w-14 h-18 bg-neutral-200 dark:bg-neutral-800 rounded flex items-center justify-center shrink-0">
                        <Package className="w-4 h-4 text-neutral-500" />
                      </div>
                    )}
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wide text-[var(--foreground)]">
                        {item.title}
                      </h4>
                      <p className="text-[11px] text-[var(--muted-foreground)] mt-0.5">
                        {item.sku ? `SKU: ${item.sku} • ` : ""}
                        {item.size ? `Size: ${item.size} • ` : ""}
                        {item.color ? `Color: ${item.color} • ` : ""}
                        Qty: {item.quantity}
                      </p>
                      {item.productSlug && (
                        <Link
                          href={`/products/${item.productSlug}`}
                          className="text-[10px] text-amber-800 hover:underline uppercase font-bold mt-1 inline-block"
                        >
                          View Garment
                        </Link>
                      )}
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-xs font-bold text-[var(--foreground)] font-mono block">
                      {storeConfig.currency.symbol}{Number(item.totalPrice).toLocaleString()}
                    </span>
                    <span className="text-[10px] text-[var(--muted-foreground)]">
                      {storeConfig.currency.symbol}{Number(item.price).toLocaleString()} each
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column: Financial Tally & Delivery Addresses */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* Financial Breakdown Card */}
            <div className="bg-[var(--muted)] border border-[var(--border)] rounded-[var(--radius)] p-6 space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--foreground)] border-b border-[var(--border)] pb-2 flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-neutral-700 dark:text-neutral-300" />
                <span>Financial Statement</span>
              </h3>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between text-[var(--muted-foreground)]">
                  <span>Subtotal</span>
                  <span>{storeConfig.currency.symbol}{Number(order.pricing?.subtotal || order.totalAmount).toLocaleString()}</span>
                </div>

                {order.pricing?.discountAmount ? (
                  <div className="flex justify-between text-emerald-700 font-semibold">
                    <span>Promotional Discount</span>
                    <span>-{storeConfig.currency.symbol}{order.pricing.discountAmount.toLocaleString()}</span>
                  </div>
                ) : null}

                <div className="flex justify-between text-[var(--muted-foreground)]">
                  <span>12% GST Luxury Garment Tax</span>
                  <span>{storeConfig.currency.symbol}{Number(order.pricing?.taxAmount || 0).toLocaleString()}</span>
                </div>

                <div className="flex justify-between text-[var(--muted-foreground)]">
                  <span>Express White-Glove Shipping</span>
                  <span>{order.pricing?.shippingAmount === 0 ? "COMPLIMENTARY" : `${storeConfig.currency.symbol}${order.pricing?.shippingAmount || 0}`}</span>
                </div>

                <div className="flex justify-between text-sm font-bold text-[var(--foreground)] pt-2 border-t border-[var(--border)]">
                  <span>Authoritative Total</span>
                  <span className="font-mono text-amber-900 dark:text-amber-200">
                    {storeConfig.currency.symbol}{order.totalAmount.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Delivery Address Card */}
            {order.shippingAddress && (
              <div className="bg-[var(--background)] border border-[var(--border)] rounded-[var(--radius)] p-6 space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--foreground)] border-b border-[var(--border)] pb-2 flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-neutral-700 dark:text-neutral-300" />
                  <span>Delivery Destination</span>
                </h3>

                <div className="text-xs text-[var(--muted-foreground)] space-y-1">
                  <p className="font-bold text-[var(--foreground)]">
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
                    <p className="pt-1 text-[var(--foreground)] font-mono text-[11px]">
                      Contact: {order.shippingAddress.phoneNumber}
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-[var(--background)] border border-[var(--border)] rounded-[var(--radius)] max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
              <h3 className="font-heading text-sm font-bold uppercase tracking-wider text-rose-700 flex items-center gap-2">
                <Ban className="w-4 h-4" />
                <span>Confirm Cancellation</span>
              </h3>
              <button onClick={() => setIsCancelModalOpen(false)} className="text-neutral-400 hover:text-neutral-700">
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-[var(--muted-foreground)]">
              Are you sure you wish to cancel Order <strong>#{order.orderNumber}</strong>? Your reserved inventory units will be immediately restocked.
            </p>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold uppercase tracking-wider text-[var(--foreground)] block">
                Reason for Cancellation (Optional)
              </label>
              <textarea
                rows={3}
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="e.g. Ordered wrong size by mistake"
                className="w-full px-3 py-2 text-xs bg-[var(--muted)] text-[var(--foreground)] border border-[var(--border)] rounded-[var(--radius)] focus:outline-none focus:ring-1 focus:ring-[var(--foreground)]"
              />
            </div>

            <div className="flex gap-2.5 pt-2">
              <button
                onClick={() => setIsCancelModalOpen(false)}
                className="flex-1 px-4 py-2 bg-[var(--muted)] text-[var(--foreground)] rounded-[var(--radius)] text-xs font-bold uppercase tracking-wider hover:bg-neutral-200 dark:hover:bg-neutral-800 transition-colors"
              >
                Keep Order
              </button>
              <button
                onClick={handleCancelOrder}
                disabled={isCancelling}
                className="flex-1 px-4 py-2 bg-rose-700 text-white rounded-[var(--radius)] text-xs font-bold uppercase tracking-wider hover:bg-rose-800 transition-colors disabled:opacity-50"
              >
                {isCancelling ? "Cancelling..." : "Confirm Cancel"}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
