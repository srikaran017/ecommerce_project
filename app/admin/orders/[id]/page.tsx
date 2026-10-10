"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Printer,
  Truck,
  CheckCircle2,
  Package,
  Clock,
  MapPin,
  Mail,
  Phone,
  CreditCard,
  FileText,
  X,
  Sparkles,
  AlertTriangle,
  Ban,
  Layers,
  Save,
  User,
  ShieldCheck,
  RefreshCw,
} from "lucide-react";
import { storeConfig } from "@/config/store.config";
import {
  AdminService,
  ALLOWED_ORDER_TRANSITIONS,
} from "@/services/admin.service";
import { AdminOrder, AdminOrderItem, OrderStatus } from "@/types/admin.types";
import { useAuthStore } from "@/stores/auth.store";
import { rbac } from "@/lib/rbac";

const STATUS_BADGE_CONFIG: Record<
  OrderStatus,
  { label: string; badgeClass: string; meaning: string }
> = {
  PENDING: {
    label: "Pending",
    badgeClass: "bg-amber-50 text-amber-700 border-amber-200",
    meaning: "Awaiting checkout payment capture",
  },
  CONFIRMED: {
    label: "Confirmed",
    badgeClass: "bg-blue-50 text-blue-700 border-blue-200",
    meaning: "Accepted by store; ready to pick",
  },
  PROCESSING: {
    label: "Processing",
    badgeClass: "bg-indigo-50 text-indigo-700 border-indigo-200",
    meaning: "Under tailoring / atelier prep",
  },
  PACKED: {
    label: "Packed",
    badgeClass: "bg-purple-50 text-purple-700 border-purple-200",
    meaning: "Boxed with garment bag & sealed",
  },
  SHIPPED: {
    label: "Shipped",
    badgeClass: "bg-sky-50 text-sky-700 border-sky-200",
    meaning: "Handed over to courier",
  },
  OUT_FOR_DELIVERY: {
    label: "Out for Delivery",
    badgeClass: "bg-cyan-50 text-cyan-700 border-cyan-200",
    meaning: "On delivery van",
  },
  DELIVERED: {
    label: "Delivered",
    badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200",
    meaning: "Successfully delivered to client",
  },
  CANCELLED: {
    label: "Cancelled",
    badgeClass: "bg-rose-50 text-rose-700 border-rose-200",
    meaning: "Cancelled & inventory restored",
  },
  RETURN_REQUESTED: {
    label: "Return Requested",
    badgeClass: "bg-orange-50 text-orange-700 border-orange-200",
    meaning: "Customer requested return",
  },
  RETURNED: {
    label: "Returned",
    badgeClass: "bg-zinc-100 text-zinc-700 border-zinc-300",
    meaning: "Returned to warehouse",
  },
  REFUNDED: {
    label: "Refunded",
    badgeClass: "bg-teal-50 text-teal-700 border-teal-200",
    meaning: "Payment refunded to customer",
  },
};

export default function OrderDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuthStore();
  const orderId = (params.id as string) || "";

  const [order, setOrder] = useState<AdminOrder | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Notes editor
  const [internalNotes, setInternalNotes] = useState("");
  const [isSavingNotes, setIsSavingNotes] = useState(false);

  // Shipping
  const [isShippingOpen, setIsShippingOpen] = useState(false);
  const [courierPartner, setCourierPartner] = useState("BlueDart Express");
  const [trackingNumber, setTrackingNumber] = useState("");
  const [estimatedDelivery, setEstimatedDelivery] = useState("");

  // Cancel Modal
  const [isCancelOpen, setIsCancelOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [isCancelling, setIsCancelling] = useState(false);

  // Tax Invoice
  const [isInvoiceOpen, setIsInvoiceOpen] = useState(false);

  const loadOrderDetail = async () => {
    setIsLoading(true);
    try {
      const res = await AdminService.getOrderDetail(orderId);
      if (res.success && res.data) {
        setOrder(res.data);
        setInternalNotes(res.data.internalAdminNotes || "");
        if (res.data.courierPartner) setCourierPartner(res.data.courierPartner);
        if (res.data.trackingNumber) setTrackingNumber(res.data.trackingNumber);
      }
    } catch (err: any) {
      console.error("Failed to load order detail:", err);
      // Fallback
      const local = AdminService.getLocalOrders().find((o) => o.id === orderId || o.orderNumber === orderId);
      if (local) {
        setOrder(local);
        setInternalNotes(local.internalAdminNotes || "");
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadOrderDetail();
  }, [orderId]);

  const showNotification = (type: "success" | "error", text: string) => {
    setFeedback({ type, text });
    setTimeout(() => setFeedback(null), 3500);
  };

  const handleAdvanceStatus = async (nextStatus: OrderStatus) => {
    if (!order) return;
    if (!rbac.canWriteOrders(user?.role)) {
      showNotification("error", "Permission denied: orders:write permission required.");
      return;
    }

    try {
      const res = await AdminService.advanceOrderStatus(order.id, {
        status: nextStatus,
        comment: `Direct status advance to ${nextStatus}`,
      });

      if (res.success) {
        showNotification("success", `Status updated to ${nextStatus}`);
        loadOrderDetail();
      } else {
        showNotification("error", res.message || "Illegal status transition.");
      }
    } catch (err: any) {
      showNotification("error", err.message || "Failed to update status.");
    }
  };

  const handleSaveInternalNotes = async () => {
    if (!order) return;
    setIsSavingNotes(true);
    try {
      const res = await AdminService.updateOrderInternalNotes(order.id, {
        internalAdminNotes: internalNotes.trim(),
      });
      if (res.success) {
        showNotification("success", "Atelier internal notes saved successfully.");
        loadOrderDetail();
      }
    } catch (err: any) {
      showNotification("error", err.message || "Failed to save notes.");
    } finally {
      setIsSavingNotes(false);
    }
  };

  const handleConfirmShipping = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!order || !trackingNumber.trim()) return;

    try {
      const res = await AdminService.assignCourierShipping(order.id, {
        courierPartner,
        trackingNumber: trackingNumber.trim(),
        estimatedDelivery: estimatedDelivery ? new Date(estimatedDelivery).toISOString() : undefined,
        status: "SHIPPED",
      });

      if (res.success) {
        showNotification("success", `Shipment assigned via ${courierPartner}`);
        setIsShippingOpen(false);
        loadOrderDetail();
      }
    } catch (err: any) {
      showNotification("error", err.message || "Failed to assign shipment.");
    }
  };

  const handleConfirmCancel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!order || !cancelReason.trim()) return;

    if (!rbac.canCancelOrders(user?.role)) {
      showNotification("error", "Permission denied: orders:cancel required.");
      return;
    }

    setIsCancelling(true);
    try {
      const res = await AdminService.cancelOrder(order.id, cancelReason.trim());
      if (res.success) {
        showNotification("success", "Order successfully cancelled and inventory restocked.");
        setIsCancelOpen(false);
        loadOrderDetail();
      } else {
        showNotification("error", res.message || "Failed to cancel order.");
      }
    } catch (err: any) {
      showNotification("error", err.message || "Failed to cancel order.");
    } finally {
      setIsCancelling(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto py-24 text-center text-slate-500">
        <RefreshCw className="w-6 h-6 animate-spin text-amber-400 mx-auto mb-3" />
        <p className="text-sm">Loading comprehensive order dossier...</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="max-w-5xl mx-auto py-24 text-center space-y-4">
        <AlertTriangle className="w-10 h-10 text-rose-400 mx-auto" />
        <h2 className="text-xl font-bold text-white">Order Not Found</h2>
        <p className="text-xs text-slate-400">Order #{orderId} could not be located in the database.</p>
        <Link
          href="/admin/orders"
          className="inline-flex items-center gap-2 px-4 py-2 bg-slate-800 text-white rounded-xl text-xs font-semibold"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return to Orders</span>
        </Link>
      </div>
    );
  }

  const badgeCfg = STATUS_BADGE_CONFIG[order.status] || {
    label: order.status,
    badgeClass: "bg-slate-800 text-white border-slate-700",
    meaning: "",
  };

  const allowedTransitions = ALLOWED_ORDER_TRANSITIONS[order.status] || [];
  const canCancel =
    rbac.canCancelOrders(user?.role) &&
    order.status !== "DELIVERED" &&
    order.status !== "SHIPPED" &&
    order.status !== "OUT_FOR_DELIVERY" &&
    order.status !== "CANCELLED";

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-16">
      {/* Toast Feedback */}
      {feedback && (
        <div
          className={`p-4 rounded-xl text-xs font-semibold flex items-center gap-3 animate-in fade-in border ${
            feedback.type === "success"
              ? "bg-emerald-950/80 border-emerald-800 text-emerald-200"
              : "bg-rose-950/80 border-rose-800 text-rose-200"
          }`}
        >
          {feedback.type === "success" ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
          )}
          <span>{feedback.text}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/orders"
            className="p-2.5 bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 rounded-xl transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl font-bold text-white tracking-tight font-mono">
                {order.orderNumber}
              </h1>
              <span
                className={`px-2.5 py-0.5 rounded text-[11px] font-bold border ${badgeCfg.badgeClass}`}
                title={badgeCfg.meaning}
              >
                {badgeCfg.label}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Placed on {order.createdAt} • Payment Gateway:{" "}
              <strong className="text-white">{order.paymentMethod}</strong> ({order.paymentStatus})
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          {canCancel && (
            <button
              onClick={() => setIsCancelOpen(true)}
              className="inline-flex items-center gap-2 px-3.5 py-2 bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-800/60 text-xs font-bold uppercase tracking-wider rounded-xl transition-all cursor-pointer"
            >
              <Ban className="w-3.5 h-3.5" />
              <span>Cancel & Restock</span>
            </button>
          )}

          <button
            onClick={() => setIsInvoiceOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-colors cursor-pointer shadow-sm border border-slate-700"
          >
            <Printer className="w-4 h-4" />
            <span>Print Tax Invoice</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left 8 Cols: Items, Dispatch Actions, Notes, Timeline */}
        <div className="lg:col-span-8 space-y-8">
          {/* Garments Items List with Variant Stock */}
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-sm">
            <h3 className="text-sm font-bold uppercase tracking-wider text-white border-b border-slate-800 pb-3 flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Package className="w-4 h-4 text-amber-400" />
                <span>Garment Items Ordered ({order.items.reduce((acc, i) => acc + i.quantity, 0)})</span>
              </span>
              <span className="text-xs text-slate-400 font-mono font-normal">
                Live Inventory Synchronized
              </span>
            </h3>

            <div className="divide-y divide-slate-800/80">
              {order.items.map((item: AdminOrderItem, idx: number) => (
                <div key={idx} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3.5">
                    {item.imageUrl ? (
                      <img
                        src={item.imageUrl}
                        alt={item.title}
                        className="w-14 h-16 object-cover rounded-xl border border-slate-800 shrink-0"
                      />
                    ) : (
                      <div className="w-14 h-16 bg-slate-900 rounded-xl border border-slate-800 flex items-center justify-center shrink-0">
                        <Package className="w-6 h-6 text-slate-600" />
                      </div>
                    )}
                    <div>
                      <h4 className="font-bold text-white text-xs">{item.title}</h4>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Size: <strong className="text-white">{item.size}</strong> • Color:{" "}
                        <strong className="text-white">{item.color}</strong> • SKU:{" "}
                        <span className="font-mono text-amber-300">{item.sku || "N/A"}</span>
                      </p>
                      {item.variant?.stockQuantity !== undefined && (
                        <p className="text-[10px] text-slate-500 mt-1">
                          Current Warehouse Stock:{" "}
                          <span
                            className={
                              item.variant.stockQuantity > 5
                                ? "text-emerald-400 font-bold"
                                : "text-amber-400 font-bold"
                            }
                          >
                            {item.variant.stockQuantity} units
                          </span>
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-white text-xs font-mono block">
                      ₹{(Number(item.price) * item.quantity).toLocaleString()}
                    </span>
                    <span className="text-[11px] text-slate-400">
                      ₹{Number(item.price).toLocaleString()} × {item.quantity}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Financial Breakdown */}
            <div className="pt-4 border-t border-slate-800 space-y-2 text-xs">
              <div className="flex justify-between text-slate-400">
                <span>Subtotal</span>
                <span className="font-mono">₹{Number(order.subtotal).toLocaleString()}</span>
              </div>
              {order.discount ? (
                <div className="flex justify-between text-emerald-400">
                  <span>Promotional Atelier Discount</span>
                  <span className="font-mono">-₹{order.discount.toLocaleString()}</span>
                </div>
              ) : null}
              <div className="flex justify-between text-slate-400">
                <span>Express Insured White-Glove Shipping</span>
                <span>{order.shipping === 0 ? "FREE" : `₹${order.shipping}`}</span>
              </div>
              <div className="flex justify-between text-base font-bold text-white pt-2 border-t border-slate-800">
                <span>Total Amount</span>
                <span className="font-mono text-amber-300">
                  ₹{Number(order.totalAmount ?? order.total).toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* Fulfillment Status Advance Actions */}
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-sm">
            <h3 className="text-sm font-bold uppercase tracking-wider text-white border-b border-slate-800 pb-3 flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Truck className="w-4 h-4 text-amber-400" />
                <span>State Machine Fulfillment Controls</span>
              </span>
              <span className="text-xs text-slate-500 font-mono">
                Current: {order.status}
              </span>
            </h3>

            {allowedTransitions.length > 0 ? (
              <div className="space-y-3">
                <p className="text-xs text-slate-400">
                  Advance order along the atelier processing flow:
                </p>
                <div className="flex flex-wrap gap-2.5">
                  {allowedTransitions
                    .filter((st) => st !== "CANCELLED")
                    .map((st) => (
                      <button
                        key={st}
                        onClick={() => {
                          if (st === "SHIPPED") {
                            setIsShippingOpen(true);
                          } else {
                            handleAdvanceStatus(st);
                          }
                        }}
                        className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white border border-slate-700 hover:border-amber-400 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5"
                      >
                        <Layers className="w-3.5 h-3.5 text-amber-400" />
                        <span>Move to {st}</span>
                      </button>
                    ))}

                  <button
                    onClick={() => setIsShippingOpen(true)}
                    className="px-4 py-2 bg-sky-950 hover:bg-sky-900 text-sky-300 border border-sky-800 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <Truck className="w-3.5 h-3.5" />
                    <span>Assign Waybill</span>
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-500 italic">
                This order is in a terminal state ({order.status}). No forward transitions allowed.
              </p>
            )}

            {order.courier && (
              <div className="p-3.5 bg-slate-900/80 rounded-xl border border-slate-800 text-xs space-y-1">
                <div className="font-bold text-white flex items-center gap-2">
                  <Truck className="w-4 h-4 text-sky-400" />
                  <span>Courier: {order.courier.carrierName}</span>
                </div>
                <div className="text-slate-400 font-mono text-[11px]">
                  AWB Tracking: <strong className="text-amber-300">{order.courier.trackingNumber}</strong>
                </div>
                {order.courier.estimatedDelivery && (
                  <div className="text-slate-500 text-[10px]">
                    Estimated Delivery: {new Date(order.courier.estimatedDelivery).toLocaleDateString()}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Atelier Internal Staff Notes (2.5) */}
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold uppercase tracking-wider text-white flex items-center gap-2">
                <FileText className="w-4 h-4 text-amber-400" />
                <span>Internal Atelier & Warehouse Notes</span>
              </h3>
              <span className="text-[10px] text-slate-500 font-mono">
                Hidden from customer invoices
              </span>
            </div>

            <div className="space-y-3">
              <textarea
                rows={3}
                placeholder="Add confidential atelier notes (e.g. VIP client, wrap with wax crest, priority air dispatch)..."
                value={internalNotes}
                onChange={(e) => setInternalNotes(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-white text-xs focus:border-amber-400 focus:outline-none resize-none leading-relaxed"
              />
              <div className="flex justify-end">
                <button
                  onClick={handleSaveInternalNotes}
                  disabled={isSavingNotes}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer border border-slate-700"
                >
                  <Save className="w-3.5 h-3.5 text-amber-400" />
                  <span>{isSavingNotes ? "Saving..." : "Save Internal Notes"}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Order Status History Timeline (1.2 / 2.2) */}
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-sm">
            <h3 className="text-sm font-bold uppercase tracking-wider text-white border-b border-slate-800 pb-3 flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-400" />
              <span>Immutable Audit Timeline ({order.statusHistory?.length || 0} events)</span>
            </h3>

            {order.statusHistory && order.statusHistory.length > 0 ? (
              <div className="space-y-4 pl-2 border-l border-slate-800 text-xs">
                {order.statusHistory.map((hist, idx) => (
                  <div key={hist.id || idx} className="relative pl-6 space-y-1">
                    <div className="absolute -left-1.5 top-1 w-3 h-3 rounded-full bg-amber-400 border-2 border-slate-950" />
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white uppercase text-[11px]">
                        {hist.newStatus}
                      </span>
                      {hist.previousStatus && (
                        <span className="text-[10px] text-slate-500">
                          (from {hist.previousStatus})
                        </span>
                      )}
                      <span className="text-[10px] text-slate-500 font-mono ml-auto">
                        {hist.createdAt?.includes("T")
                          ? new Date(hist.createdAt).toLocaleString("en-IN")
                          : hist.createdAt}
                      </span>
                    </div>
                    {hist.comment && (
                      <p className="text-slate-300 text-[11px] leading-relaxed">
                        {hist.comment}
                      </p>
                    )}
                    {hist.changedBy && (
                      <div className="text-[10px] text-slate-500 flex items-center gap-1">
                        <User className="w-3 h-3 text-slate-400" />
                        <span>
                          {hist.changedBy.name} ({hist.changedBy.role})
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-500 italic">No history records logged.</p>
            )}
          </div>
        </div>

        {/* Right 4 Cols: Client, Address, Payment Info */}
        <div className="lg:col-span-4 space-y-8 text-xs">
          {/* Client Details */}
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-sm">
            <h3 className="text-sm font-bold uppercase tracking-wider text-white border-b border-slate-800 pb-3 flex items-center gap-2">
              <User className="w-4 h-4 text-amber-400" />
              <span>Client Information</span>
            </h3>

            <div className="space-y-3">
              <div className="font-bold text-white text-sm">{order.customerName}</div>
              <div className="flex items-center gap-2 text-slate-300">
                <Mail className="w-4 h-4 text-slate-500 shrink-0" />
                <span className="truncate">{order.customerEmail}</span>
              </div>
              <div className="flex items-center gap-2 text-slate-300">
                <Phone className="w-4 h-4 text-slate-500 shrink-0" />
                <span className="font-mono">{order.customerPhone}</span>
              </div>
            </div>
          </div>

          {/* Shipping Address */}
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-sm">
            <h3 className="text-sm font-bold uppercase tracking-wider text-white border-b border-slate-800 pb-3 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-amber-400" />
              <span>Delivery Address</span>
            </h3>

            <p className="text-slate-300 leading-relaxed">
              {typeof order.shippingAddress === "object"
                ? `${order.shippingAddress.street}, ${order.shippingAddress.city}, ${order.shippingAddress.state} - ${order.shippingAddress.postalCode}, ${order.shippingAddress.country}`
                : order.shippingAddress}
            </p>
            {order.shippingAddress?.landmark && (
              <p className="text-[11px] text-slate-500">
                Landmark: {order.shippingAddress.landmark}
              </p>
            )}
          </div>

          {/* Payment Status */}
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-sm">
            <h3 className="text-sm font-bold uppercase tracking-wider text-white border-b border-slate-800 pb-3 flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-amber-400" />
              <span>Payment File</span>
            </h3>

            <div className="space-y-2">
              <div className="flex justify-between text-slate-400">
                <span>Method</span>
                <span className="font-bold text-white">{order.paymentMethod}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Status</span>
                <span
                  className={
                    order.paymentStatus === "COMPLETED"
                      ? "font-bold text-emerald-400"
                      : "font-bold text-amber-400"
                  }
                >
                  {order.paymentStatus}
                </span>
              </div>
              {order.payments && order.payments.length > 0 && (
                <div className="pt-2 border-t border-slate-800 space-y-1">
                  <span className="text-[10px] text-slate-500 block uppercase font-semibold">
                    Captured Transaction
                  </span>
                  <div className="font-mono text-[11px] text-amber-300 truncate">
                    {order.payments[0].transactionId || "RZP-TX-98127391"}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Customer Special Instructions */}
          {order.notes && (
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 space-y-2 shadow-sm">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Customer Delivery Notes
              </h4>
              <p className="text-xs text-amber-300/90 italic leading-relaxed">
                "{order.notes}"
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Assign Waybill / Courier Modal */}
      {isShippingOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-950 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-md w-full space-y-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-2 text-sky-400">
                <Truck className="w-5 h-5" />
                <h3 className="text-base font-bold text-white uppercase tracking-wider">
                  Assign Courier Waybill
                </h3>
              </div>
              <button
                onClick={() => setIsShippingOpen(false)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmShipping} className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="font-semibold text-slate-300">Courier Partner *</label>
                <select
                  value={courierPartner}
                  onChange={(e) => setCourierPartner(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white focus:border-amber-400 focus:outline-none font-semibold"
                >
                  <option value="BlueDart Express">BlueDart Express</option>
                  <option value="Delhivery Air">Delhivery Air</option>
                  <option value="FedEx Priority">FedEx Priority</option>
                  <option value="DHL Express">DHL Express</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-slate-300">AWB Tracking Number *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. BLD-9812739128"
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white font-mono focus:border-amber-400 focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-slate-300">Estimated Delivery Date</label>
                <input
                  type="date"
                  value={estimatedDelivery}
                  onChange={(e) => setEstimatedDelivery(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white focus:border-amber-400 focus:outline-none"
                />
              </div>

              <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsShippingOpen(false)}
                  className="px-4 py-2 text-slate-400 hover:text-white cursor-pointer font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!trackingNumber.trim()}
                  className="px-6 py-2.5 bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white font-bold uppercase tracking-wider rounded-xl transition-all shadow-md cursor-pointer"
                >
                  Confirm & Dispatch
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Cancel Order Modal */}
      {isCancelOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-950 border border-rose-900/50 rounded-3xl p-6 sm:p-8 max-w-md w-full space-y-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-2 text-rose-400">
                <Ban className="w-5 h-5" />
                <h3 className="text-base font-bold text-white uppercase tracking-wider">
                  Cancel Order & Restock
                </h3>
              </div>
              <button
                onClick={() => setIsCancelOpen(false)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmCancel} className="space-y-4 text-xs">
              <div className="p-4 bg-rose-950/30 border border-rose-800/40 rounded-xl text-rose-300 space-y-2">
                <div className="flex items-center gap-2 font-bold text-rose-400">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>Double-Entry Inventory Restitution</span>
                </div>
                <p className="leading-relaxed text-[11px]">
                  Cancelling #{order.orderNumber} will automatically return all garment units
                  back to the warehouse variant inventory and create a <code>RETURN</code> audit row.
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-slate-300">
                  Mandatory Cancellation Reason (3–500 chars) *
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="e.g. Customer requested cancellation prior to dispatch"
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white focus:border-rose-400 focus:outline-none resize-none"
                />
              </div>

              <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsCancelOpen(false)}
                  className="px-4 py-2 text-slate-400 hover:text-white cursor-pointer font-medium"
                >
                  Keep Order
                </button>
                <button
                  type="submit"
                  disabled={isCancelling || cancelReason.trim().length < 3}
                  className="px-6 py-2.5 bg-rose-600 hover:bg-rose-500 disabled:opacity-40 text-white font-bold uppercase tracking-wider rounded-xl transition-all shadow-md cursor-pointer"
                >
                  {isCancelling ? "Cancelling..." : "Confirm & Restock"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Printable Electronic Tax Invoice Modal */}
      {isInvoiceOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white text-black p-8 sm:p-12 rounded-2xl max-w-2xl w-full shadow-2xl space-y-6 print:m-0 print:p-0 print:shadow-none">
            {/* Modal Controls */}
            <div className="flex items-center justify-between border-b pb-4 print:hidden">
              <span className="text-xs font-bold uppercase tracking-wider text-gray-500">
                Official Electronic Tax Invoice
              </span>
              <div className="flex items-center gap-3">
                <button
                  onClick={handlePrint}
                  className="px-4 py-1.5 bg-black text-white text-xs font-bold uppercase rounded-lg flex items-center gap-1.5 cursor-pointer shadow-sm"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Document</span>
                </button>
                <button
                  onClick={() => setIsInvoiceOpen(false)}
                  className="text-gray-500 hover:text-black cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Document Content */}
            <div className="space-y-6 text-xs">
              <div className="flex items-start justify-between border-b pb-6">
                <div>
                  <h2 className="text-xl font-bold font-serif tracking-wider uppercase">
                    {storeConfig.name}
                  </h2>
                  <p className="text-gray-600 mt-1">{storeConfig.contact.address.street}</p>
                  <p className="text-gray-600">
                    {storeConfig.contact.address.city}, {storeConfig.contact.address.state} -{" "}
                    {storeConfig.contact.address.postalCode}
                  </p>
                  <p className="text-gray-600 font-mono">GSTIN: 27AABCM8921R1Z8</p>
                </div>
                <div className="text-right">
                  <h3 className="text-lg font-bold uppercase">TAX INVOICE</h3>
                  <p className="font-mono font-bold mt-1">{order.orderNumber}</p>
                  <p className="text-gray-500">Date: {order.createdAt}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-bold uppercase text-gray-700 mb-1">Billed To (Client):</h4>
                  <p className="font-bold">{order.customerName}</p>
                  <p className="text-gray-600">{order.customerPhone}</p>
                  <p className="text-gray-600">{order.customerEmail}</p>
                </div>
                <div>
                  <h4 className="font-bold uppercase text-gray-700 mb-1">Shipping Destination:</h4>
                  <p className="text-gray-600">
                    {typeof order.shippingAddress === "object"
                      ? `${order.shippingAddress.street}, ${order.shippingAddress.city}, ${order.shippingAddress.state} - ${order.shippingAddress.postalCode}`
                      : order.shippingAddress}
                  </p>
                </div>
              </div>

              {/* Items Table */}
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-y border-black font-bold uppercase text-[11px]">
                    <th className="py-2">Item Description</th>
                    <th className="py-2">Size / Color</th>
                    <th className="py-2 text-center">Qty</th>
                    <th className="py-2 text-right">Price</th>
                    <th className="py-2 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {order.items.map((item: AdminOrderItem, i: number) => (
                    <tr key={i}>
                      <td className="py-2.5 font-semibold">{item.title}</td>
                      <td className="py-2.5 text-gray-600">
                        {item.size} / {item.color}
                      </td>
                      <td className="py-2.5 text-center">{item.quantity}</td>
                      <td className="py-2.5 text-right font-mono">
                        ₹{Number(item.price).toLocaleString()}
                      </td>
                      <td className="py-2.5 text-right font-bold font-mono">
                        ₹{(Number(item.price) * item.quantity).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="border-t pt-4 space-y-1.5 text-right">
                <p className="text-gray-600">
                  Subtotal: ₹{Number(order.subtotal).toLocaleString()}
                </p>
                {order.discount ? (
                  <p className="text-emerald-700 font-semibold">
                    Discount Applied: -₹{order.discount.toLocaleString()}
                  </p>
                ) : null}
                <p className="text-gray-600">
                  GST (12% Included): ₹
                  {Math.round((Number(order.totalAmount ?? order.total) * 12) / 112).toLocaleString()}
                </p>
                <p className="text-gray-600">
                  Shipping: {order.shipping === 0 ? "FREE" : `₹${order.shipping}`}
                </p>
                <p className="text-base font-bold text-black pt-2 border-t font-mono">
                  Grand Total Paid: ₹{Number(order.totalAmount ?? order.total).toLocaleString()}
                </p>
              </div>

              <div className="pt-4 border-t text-center text-gray-500 text-[10px]">
                Thank you for choosing {storeConfig.name}. For questions or bespoke alterations, contact {storeConfig.contact.email}.
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
