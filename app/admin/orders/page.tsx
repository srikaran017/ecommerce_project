"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  ShoppingBag,
  Eye,
  Search,
  CheckCircle2,
  AlertTriangle,
  Truck,
  Download,
  Package,
  X,
  Clock,
  Ban,
  ArrowRight,
  Filter,
  DollarSign,
  Send,
  Calendar,
  Layers,
  MapPin,
  ChevronRight,
  RefreshCw,
} from "lucide-react";
import { storeConfig } from "@/config/store.config";
import {
  AdminService,
  ALLOWED_ORDER_TRANSITIONS,
  SAMPLE_ADMIN_ORDERS as SERVICE_SAMPLE_ADMIN_ORDERS,
} from "@/services/admin.service";
import {
  AdminOrder,
  OrderStatus,
  CourierInfo,
  OrdersSummary,
  PaymentStatus,
} from "@/types/admin.types";
import { exportOrdersCsv } from "@/utils/exportCsv";
import { useAuthStore } from "@/stores/auth.store";
import { rbac } from "@/lib/rbac";

// Export for backwards compatibility with any existing imports
export const SAMPLE_ADMIN_ORDERS = SERVICE_SAMPLE_ADMIN_ORDERS;

/**
 * Module 05: Order Status Badge Palette Specification
 */
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

const COURIER_PARTNERS = [
  "BlueDart Express",
  "Delhivery Air",
  "FedEx Priority",
  "DHL Express",
  "DTDC Air",
];

export default function AdminOrdersPage() {
  const { user } = useAuthStore();
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [summary, setSummary] = useState<OrdersSummary>({
    totalOrders: 0,
    totalRevenue: 0,
    pendingCount: 0,
    confirmedCount: 0,
    processingCount: 0,
    packedCount: 0,
    shippedCount: 0,
    deliveredCount: 0,
    cancelledCount: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Filters state
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<OrderStatus | "ALL">("ALL");
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<PaymentStatus | "ALL">("ALL");
  const [paymentMethodFilter, setPaymentMethodFilter] = useState<string>("ALL");
  const [sortOption, setSortOption] = useState<"newest" | "oldest" | "total_asc" | "total_desc">("newest");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const pageSize = 15;

  // Modals state
  const [advanceStatusOrder, setAdvanceStatusOrder] = useState<AdminOrder | null>(null);
  const [targetStatus, setTargetStatus] = useState<OrderStatus | "">("");
  const [statusComment, setStatusComment] = useState("");

  const [shippingOrder, setShippingOrder] = useState<AdminOrder | null>(null);
  const [courierPartner, setCourierPartner] = useState("BlueDart Express");
  const [trackingNumber, setTrackingNumber] = useState("");
  const [estimatedDelivery, setEstimatedDelivery] = useState("");
  const [shippingNotes, setShippingNotes] = useState("");

  const [cancelOrderTarget, setCancelOrderTarget] = useState<AdminOrder | null>(null);
  const [cancelReason, setCancelReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Quick Drawer Preview State
  const [previewOrder, setPreviewOrder] = useState<AdminOrder | null>(null);

  const loadOrders = async () => {
    setIsLoading(true);
    try {
      const res = await AdminService.getOrdersList({
        page: currentPage,
        limit: pageSize,
        search: searchTerm,
        status: statusFilter,
        paymentStatus: paymentStatusFilter,
        paymentMethod: paymentMethodFilter,
        sort: sortOption,
      });

      if (res.success) {
        setOrders(res.data);
        if (res.meta?.summary) {
          setSummary(res.meta.summary);
        }
        if (res.pagination) {
          setTotalPages(res.pagination.totalPages || 1);
        }
      }
    } catch (err) {
      console.error("Failed to load orders:", err);
      setFeedback({ type: "error", text: "Failed to load orders from fulfillment engine." });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const statusParam = params.get("status")?.toUpperCase();
      if (statusParam && (statusParam === "ALL" || statusParam in STATUS_BADGE_CONFIG)) {
        setStatusFilter(statusParam as any);
      }
      const searchParam = params.get("search");
      if (searchParam) {
        setSearchTerm(searchParam);
      }
    }
  }, []);

  useEffect(() => {
    loadOrders();
  }, [searchTerm, statusFilter, paymentStatusFilter, paymentMethodFilter, sortOption, currentPage]);

  const showNotification = (type: "success" | "error", text: string) => {
    setFeedback({ type, text });
    setTimeout(() => setFeedback(null), 4000);
  };

  // 1. Advance Order Status
  const handleOpenAdvanceStatus = (order: AdminOrder) => {
    const allowed = ALLOWED_ORDER_TRANSITIONS[order.status] || [];
    setAdvanceStatusOrder(order);
    setTargetStatus(allowed[0] || "");
    setStatusComment("");
  };

  const handleConfirmAdvanceStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!advanceStatusOrder || !targetStatus) return;

    if (!rbac.canWriteOrders(user?.role)) {
      showNotification("error", "Permission denied: orders:write permission required.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await AdminService.advanceOrderStatus(advanceStatusOrder.id, {
        status: targetStatus as OrderStatus,
        comment: statusComment.trim() || undefined,
      });

      if (res.success) {
        showNotification("success", res.message || `Order advanced to ${targetStatus}`);
        setAdvanceStatusOrder(null);
        loadOrders();
      } else {
        showNotification("error", res.message || "Failed to advance order status.");
      }
    } catch (err: any) {
      showNotification("error", err.message || "Error updating status.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // 2. Assign Shipping & Courier
  const handleOpenShippingModal = (order: AdminOrder) => {
    setShippingOrder(order);
    setCourierPartner("BlueDart Express");
    setTrackingNumber(
      order.trackingNumber || `BLD-${Math.floor(1000000000 + Math.random() * 9000000000)}`
    );
    setEstimatedDelivery(
      new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
    );
    setShippingNotes("");
  };

  const handleConfirmShipping = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shippingOrder || !trackingNumber.trim()) return;

    if (!rbac.canWriteOrders(user?.role)) {
      showNotification("error", "Permission denied: orders:write permission required.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await AdminService.assignCourierShipping(shippingOrder.id, {
        courierPartner,
        trackingNumber: trackingNumber.trim(),
        estimatedDelivery: estimatedDelivery ? new Date(estimatedDelivery).toISOString() : undefined,
        status: "SHIPPED",
        notes: shippingNotes.trim() || undefined,
      });

      if (res.success) {
        showNotification(
          "success",
          res.message || `Shipment assigned via ${courierPartner} (AWB: ${trackingNumber})`
        );
        setShippingOrder(null);
        loadOrders();
      } else {
        showNotification("error", res.message || "Failed to assign shipment.");
      }
    } catch (err: any) {
      showNotification("error", err.message || "Error assigning courier.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // 3. Cancel Order with Double-Entry Restitution
  const handleOpenCancelModal = (order: AdminOrder) => {
    if (!rbac.canCancelOrders(user?.role)) {
      showNotification("error", "Permission denied: orders:cancel required (SUPER_ADMIN or STORE_ADMIN).");
      return;
    }
    setCancelOrderTarget(order);
    setCancelReason("");
  };

  const handleConfirmCancelOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cancelOrderTarget || !cancelReason.trim()) return;

    setIsSubmitting(true);
    try {
      const res = await AdminService.cancelOrder(cancelOrderTarget.id, cancelReason.trim());

      if (res.success) {
        showNotification(
          "success",
          `Order #${cancelOrderTarget.orderNumber} successfully cancelled & stock atomically restocked.`
        );
        setCancelOrderTarget(null);
        setCancelReason("");
        loadOrders();
      } else {
        showNotification("error", res.message || "Cancellation rejected by fulfillment engine.");
      }
    } catch (err: any) {
      showNotification("error", err.message || "Error cancelling order.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // 4. CSV Manifest Export
  const handleExportCsv = () => {
    if (!rbac.canExportOrders(user?.role)) {
      showNotification("error", "Permission denied: orders:export permission required.");
      return;
    }
    exportOrdersCsv(orders, storeConfig.name);
    showNotification("success", `Exported ${orders.length} orders to courier manifest CSV.`);
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded bg-amber-400/10 border border-amber-400/20 text-amber-400 text-[10px] font-mono font-bold uppercase tracking-wider">
              MODULE 05
            </span>
            <span className="text-slate-500 text-xs">•</span>
            <span className="text-xs text-slate-400">Order Lifecycle & Courier Dispatch</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight flex items-center gap-3">
            <ShoppingBag className="w-6 h-6 text-amber-400" />
            <span>Fulfillment & Courier Tracking</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Manage atelier bespoke tailoring, courier dispatch, AWB waybills, and double-entry stock restitution.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadOrders}
            className="p-2.5 bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 rounded-xl transition-all cursor-pointer"
            title="Refresh Orders"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin text-amber-400" : ""}`} />
          </button>
          <button
            onClick={handleExportCsv}
            disabled={orders.length === 0}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-200 border border-slate-700 font-semibold text-xs rounded-xl transition-all cursor-pointer shadow-sm"
          >
            <Download className="w-4 h-4 text-amber-400" />
            <span>Export Manifest (CSV)</span>
          </button>
        </div>
      </div>

      {/* Notification Toast */}
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

      {/* 3.1. Warehouse & Fulfillment Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Revenue */}
        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 relative overflow-hidden shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Total Revenue</span>
            <DollarSign className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-white tracking-tight font-mono">
            ₹{summary.totalRevenue.toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-1.5">
            <span className="text-emerald-400 font-bold">{summary.totalOrders} total orders</span>
            <span>across catalog</span>
          </div>
        </div>

        {/* Card 2: Confirmed Orders */}
        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 relative overflow-hidden shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Confirmed Orders</span>
            <CheckCircle2 className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-bold text-white tracking-tight font-mono">
            {summary.confirmedCount}
          </div>
          <div className="text-[11px] text-blue-400 mt-1 flex items-center gap-1 font-semibold">
            <span>Actionable: Needs atelier assignment</span>
          </div>
        </div>

        {/* Card 3: In Processing / Packed */}
        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 relative overflow-hidden shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">In Prep / Packed</span>
            <Package className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-bold text-white tracking-tight font-mono">
            {summary.processingCount + summary.packedCount}
          </div>
          <div className="text-[11px] text-purple-400 mt-1 flex items-center gap-1 font-semibold">
            <span>Needs courier dispatch ({summary.packedCount} packed)</span>
          </div>
        </div>

        {/* Card 4: Dispatched */}
        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 relative overflow-hidden shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Dispatched</span>
            <Truck className="w-4 h-4 text-sky-400" />
          </div>
          <div className="text-2xl font-bold text-white tracking-tight font-mono">
            {summary.shippedCount}
          </div>
          <div className="text-[11px] text-sky-400 mt-1 flex items-center gap-1 font-semibold">
            <span>In courier transit ({summary.deliveredCount} delivered)</span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-4 shadow-sm text-xs">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          {/* Search */}
          <div className="md:col-span-5 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Search by order #, customer name, email, phone, AWB..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-900 text-white border border-slate-700 rounded-xl focus:border-amber-400 focus:outline-none"
            />
          </div>

          {/* Status Filter */}
          <div className="md:col-span-3">
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value as any);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2.5 bg-slate-900 text-white border border-slate-700 rounded-xl focus:border-amber-400 focus:outline-none font-medium"
            >
              <option value="ALL">All Statuses</option>
              <option value="PENDING">Pending (Payment)</option>
              <option value="CONFIRMED">Confirmed</option>
              <option value="PROCESSING">Processing (Tailoring)</option>
              <option value="PACKED">Packed</option>
              <option value="SHIPPED">Shipped</option>
              <option value="OUT_FOR_DELIVERY">Out for Delivery</option>
              <option value="DELIVERED">Delivered</option>
              <option value="CANCELLED">Cancelled</option>
              <option value="RETURN_REQUESTED">Return Requested</option>
              <option value="RETURNED">Returned</option>
              <option value="REFUNDED">Refunded</option>
            </select>
          </div>

          {/* Payment Method */}
          <div className="md:col-span-2">
            <select
              value={paymentMethodFilter}
              onChange={(e) => {
                setPaymentMethodFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2.5 bg-slate-900 text-white border border-slate-700 rounded-xl focus:border-amber-400 focus:outline-none font-medium"
            >
              <option value="ALL">All Gateways</option>
              <option value="RAZORPAY">Razorpay</option>
              <option value="STRIPE">Stripe</option>
              <option value="COD">Cash on Delivery</option>
            </select>
          </div>

          {/* Sort */}
          <div className="md:col-span-2">
            <select
              value={sortOption}
              onChange={(e) => {
                setSortOption(e.target.value as any);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2.5 bg-slate-900 text-white border border-slate-700 rounded-xl focus:border-amber-400 focus:outline-none font-medium"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="total_desc">Highest Amount</option>
              <option value="total_asc">Lowest Amount</option>
            </select>
          </div>
        </div>

        {/* Status Quick Filter Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-1 border-t border-slate-800/80 text-[11px]">
          <span className="text-slate-400 font-semibold mr-1 flex items-center gap-1">
            <Filter className="w-3 h-3 text-amber-400" />
            Quick:
          </span>
          {[
            { id: "ALL", label: "All" },
            { id: "CONFIRMED", label: "Confirmed" },
            { id: "PROCESSING", label: "Processing" },
            { id: "PACKED", label: "Packed" },
            { id: "SHIPPED", label: "Shipped" },
            { id: "DELIVERED", label: "Delivered" },
            { id: "CANCELLED", label: "Cancelled" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setStatusFilter(tab.id as any);
                setCurrentPage(1);
              }}
              className={`px-2.5 py-1 rounded-lg font-medium transition-all cursor-pointer whitespace-nowrap ${
                statusFilter === tab.id
                  ? "bg-amber-400 text-slate-950 font-bold"
                  : "bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 bg-slate-900/60 font-semibold uppercase tracking-wider text-[10px]">
                <th className="py-3.5 px-6">Order ID & Date</th>
                <th className="py-3.5 px-6">Customer</th>
                <th className="py-3.5 px-6">Garment Items</th>
                <th className="py-3.5 px-6">Total Amount</th>
                <th className="py-3.5 px-6">Payment</th>
                <th className="py-3.5 px-6">Fulfillment State</th>
                <th className="py-3.5 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 text-slate-300">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    <div className="flex items-center justify-center gap-2">
                      <RefreshCw className="w-4 h-4 animate-spin text-amber-400" />
                      <span>Loading fashion order ledger...</span>
                    </div>
                  </td>
                </tr>
              ) : orders.length > 0 ? (
                orders.map((ord) => {
                  const cfg = STATUS_BADGE_CONFIG[ord.status] || {
                    label: ord.status,
                    badgeClass: "bg-slate-100 text-slate-800 border-slate-200",
                    meaning: "",
                  };
                  const allowedTransitions = ALLOWED_ORDER_TRANSITIONS[ord.status] || [];
                  const canCancel =
                    rbac.canCancelOrders(user?.role) &&
                    ord.status !== "DELIVERED" &&
                    ord.status !== "SHIPPED" &&
                    ord.status !== "OUT_FOR_DELIVERY" &&
                    ord.status !== "CANCELLED";

                  return (
                    <tr key={ord.id} className="hover:bg-slate-900/40 transition-colors">
                      {/* Order ID */}
                      <td className="py-4 px-6">
                        <span className="font-mono font-bold text-amber-300 block">
                          {ord.orderNumber}
                        </span>
                        <span className="text-[10px] text-slate-500 font-mono">
                          {ord.createdAt?.includes("T")
                            ? new Date(ord.createdAt).toLocaleDateString("en-IN", {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              })
                            : ord.createdAt}
                        </span>
                      </td>

                      {/* Customer */}
                      <td className="py-4 px-6">
                        <div className="font-bold text-white">{ord.customerName}</div>
                        <div className="text-[11px] text-slate-400">{ord.customerEmail}</div>
                        <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                          {ord.customerPhone}
                        </div>
                      </td>

                      {/* Items */}
                      <td className="py-4 px-6 max-w-xs">
                        <div className="space-y-1">
                          {ord.items.map((item, idx) => (
                            <div key={idx} className="truncate text-slate-300">
                              <span className="font-medium text-white">{item.title}</span>
                              <span className="text-slate-500 text-[11px] ml-1">
                                ({item.size} / {item.color}) x{item.quantity}
                              </span>
                            </div>
                          ))}
                        </div>
                      </td>

                      {/* Amount */}
                      <td className="py-4 px-6">
                        <div className="font-bold text-white font-mono text-sm">
                          ₹{Number(ord.totalAmount ?? ord.total).toLocaleString()}
                        </div>
                        {ord.discount ? (
                          <div className="text-[10px] text-emerald-400">
                            -₹{ord.discount.toLocaleString()} disc
                          </div>
                        ) : null}
                      </td>

                      {/* Payment */}
                      <td className="py-4 px-6">
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold bg-slate-900 text-slate-200 border border-slate-700">
                          <span>{ord.paymentMethod}</span>
                          <span className="text-slate-500">•</span>
                          <span
                            className={
                              ord.paymentStatus === "COMPLETED"
                                ? "text-emerald-400"
                                : ord.paymentStatus === "PENDING"
                                ? "text-amber-400"
                                : "text-rose-400"
                            }
                          >
                            {ord.paymentStatus}
                          </span>
                        </div>
                      </td>

                      {/* Status & Badge */}
                      <td className="py-4 px-6">
                        <span
                          className={`inline-block px-2.5 py-1 rounded-md text-[11px] font-bold border ${cfg.badgeClass}`}
                          title={cfg.meaning}
                        >
                          {cfg.label}
                        </span>

                        {ord.courierPartner && ord.trackingNumber && (
                          <div className="mt-1.5 text-[10px] text-slate-400 font-mono flex items-center gap-1">
                            <Truck className="w-3 h-3 text-sky-400" />
                            <span>
                              {ord.courierPartner}: {ord.trackingNumber}
                            </span>
                          </div>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Advance Status Button */}
                          {allowedTransitions.length > 0 && rbac.canWriteOrders(user?.role) && (
                            <button
                              onClick={() => handleOpenAdvanceStatus(ord)}
                              className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-amber-300 border border-slate-700 hover:border-amber-400 rounded-lg text-[11px] font-semibold transition-all cursor-pointer"
                              title="Advance Status"
                            >
                              Advance
                            </button>
                          )}

                          {/* Assign Shipment Button */}
                          {(ord.status === "PACKED" || ord.status === "PROCESSING") &&
                            rbac.canWriteOrders(user?.role) && (
                              <button
                                onClick={() => handleOpenShippingModal(ord)}
                                className="px-2.5 py-1 bg-sky-950 hover:bg-sky-900 text-sky-300 border border-sky-800 rounded-lg text-[11px] font-semibold transition-all cursor-pointer flex items-center gap-1"
                                title="Assign Courier"
                              >
                                <Truck className="w-3 h-3" />
                                <span>Dispatch</span>
                              </button>
                            )}

                          {/* Cancel Order Button */}
                          {canCancel && (
                            <button
                              onClick={() => handleOpenCancelModal(ord)}
                              className="p-1.5 hover:bg-rose-950 text-slate-400 hover:text-rose-400 rounded-lg transition-colors cursor-pointer"
                              title="Cancel Order & Restock"
                            >
                              <Ban className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {/* View Detail Page */}
                          <Link
                            href={`/admin/orders/${ord.id}`}
                            className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg transition-colors inline-block"
                            title="Inspect Order File"
                          >
                            <Eye className="w-4 h-4" />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    No orders match your filter criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <span>
              Page {currentPage} of {totalPages}
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage <= 1}
                className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-white rounded-lg border border-slate-700 cursor-pointer font-medium"
              >
                Previous
              </button>
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage >= totalPages}
                className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-white rounded-lg border border-slate-700 cursor-pointer font-medium"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ==================================================== */}
      {/* 3.3.1. ADVANCE STATUS MODAL */}
      {/* ==================================================== */}
      {advanceStatusOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-950 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-md w-full space-y-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-2 text-amber-400">
                <Layers className="w-5 h-5" />
                <h3 className="text-base font-bold text-white uppercase tracking-wider">
                  Advance Order Status
                </h3>
              </div>
              <button
                onClick={() => setAdvanceStatusOrder(null)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmAdvanceStatus} className="space-y-4 text-xs">
              <div className="bg-slate-900/60 p-3.5 rounded-xl border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">
                    Target Order
                  </span>
                  <span className="font-mono font-bold text-white">
                    {advanceStatusOrder.orderNumber}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">
                    Current Status
                  </span>
                  <span
                    className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold border ${
                      STATUS_BADGE_CONFIG[advanceStatusOrder.status]?.badgeClass || ""
                    }`}
                  >
                    {advanceStatusOrder.status}
                  </span>
                </div>
              </div>

              {/* Target transition dropdown */}
              <div className="space-y-1.5">
                <label className="font-semibold text-slate-300">
                  Select Legal Target Status *
                </label>
                <select
                  value={targetStatus}
                  onChange={(e) => setTargetStatus(e.target.value as OrderStatus)}
                  required
                  className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white font-bold uppercase focus:border-amber-400 focus:outline-none"
                >
                  {(ALLOWED_ORDER_TRANSITIONS[advanceStatusOrder.status] || []).map((st) => (
                    <option key={st} value={st}>
                      {st} ({STATUS_BADGE_CONFIG[st]?.label || st})
                    </option>
                  ))}
                </select>
                <p className="text-[10px] text-slate-500">
                  Only valid next state machine transitions are displayed.
                </p>
              </div>

              {/* Audit Comment */}
              <div className="space-y-1.5">
                <label className="font-semibold text-slate-300">
                  Audit Log Comment (Optional)
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Transferred to bespoke tailoring department for finishing"
                  value={statusComment}
                  onChange={(e) => setStatusComment(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white focus:border-amber-400 focus:outline-none resize-none"
                />
              </div>

              <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setAdvanceStatusOrder(null)}
                  className="px-4 py-2 text-slate-400 hover:text-white cursor-pointer font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !targetStatus}
                  className="px-6 py-2.5 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-bold uppercase tracking-wider rounded-xl transition-all shadow-md cursor-pointer"
                >
                  {isSubmitting ? "Updating..." : "Advance Status"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* 3.3.2. ASSIGN COURIER SHIPMENT MODAL */}
      {/* ==================================================== */}
      {shippingOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-950 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-md w-full space-y-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-2 text-sky-400">
                <Truck className="w-5 h-5" />
                <h3 className="text-base font-bold text-white uppercase tracking-wider">
                  Assign Courier & Dispatch
                </h3>
              </div>
              <button
                onClick={() => setShippingOrder(null)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmShipping} className="space-y-4 text-xs">
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">
                  Client & Destination
                </span>
                <span className="font-bold text-white block">
                  {shippingOrder.customerName} ({shippingOrder.shippingAddress?.city || "India"})
                </span>
                <span className="font-mono text-amber-300 text-[11px]">
                  #{shippingOrder.orderNumber}
                </span>
              </div>

              {/* Courier quick pills */}
              <div className="space-y-1.5">
                <label className="font-semibold text-slate-300">Courier Partner *</label>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {COURIER_PARTNERS.map((partner) => (
                    <button
                      type="button"
                      key={partner}
                      onClick={() => setCourierPartner(partner)}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                        courierPartner === partner
                          ? "bg-sky-500 text-white shadow-sm"
                          : "bg-slate-900 text-slate-400 hover:text-white border border-slate-800"
                      }`}
                    >
                      {partner}
                    </button>
                  ))}
                </div>
                <input
                  type="text"
                  required
                  value={courierPartner}
                  onChange={(e) => setCourierPartner(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white focus:border-amber-400 focus:outline-none"
                />
              </div>

              {/* AWB Tracking number */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="font-semibold text-slate-300">AWB Tracking Number *</label>
                  <button
                    type="button"
                    onClick={() =>
                      setTrackingNumber(`BLD-${Math.floor(1000000000 + Math.random() * 9000000000)}`)
                    }
                    className="text-[10px] text-amber-400 hover:underline cursor-pointer"
                  >
                    Auto-Generate
                  </button>
                </div>
                <input
                  type="text"
                  required
                  placeholder="e.g. BLD-9812739128"
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white font-mono focus:border-amber-400 focus:outline-none"
                />
              </div>

              {/* Estimated Delivery */}
              <div className="space-y-1.5">
                <label className="font-semibold text-slate-300">
                  Estimated Delivery Date
                </label>
                <input
                  type="date"
                  value={estimatedDelivery}
                  onChange={(e) => setEstimatedDelivery(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white focus:border-amber-400 focus:outline-none"
                />
              </div>

              {/* Dispatch Notes */}
              <div className="space-y-1.5">
                <label className="font-semibold text-slate-300">
                  Packaging Notes (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Fragile luxury silk box with wax seal"
                  value={shippingNotes}
                  onChange={(e) => setShippingNotes(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white focus:border-amber-400 focus:outline-none"
                />
              </div>

              <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShippingOrder(null)}
                  className="px-4 py-2 text-slate-400 hover:text-white cursor-pointer font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !trackingNumber.trim()}
                  className="px-6 py-2.5 bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white font-bold uppercase tracking-wider rounded-xl transition-all shadow-md cursor-pointer"
                >
                  {isSubmitting ? "Dispatching..." : "Confirm & Ship"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* 3.3.3. CANCEL ORDER CONFIRMATION MODAL */}
      {/* ==================================================== */}
      {cancelOrderTarget && (
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
                onClick={() => setCancelOrderTarget(null)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmCancelOrder} className="space-y-4 text-xs">
              <div className="p-4 bg-rose-950/30 border border-rose-800/40 rounded-xl text-rose-300 space-y-2">
                <div className="flex items-center gap-2 font-bold text-rose-400">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>Double-Entry Stock Restitution Warning</span>
                </div>
                <p className="leading-relaxed text-[11px]">
                  Cancelling #{cancelOrderTarget.orderNumber} will{" "}
                  <strong>automatically restore all garment variant stock quantities</strong> back to
                  warehouse inventory and write an immutable <code>RETURN</code> ledger row.
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-slate-300">
                  Mandatory Cancellation Reason (3–500 chars) *
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="e.g. Customer requested cancellation prior to atelier dispatch due to size change"
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white focus:border-rose-400 focus:outline-none resize-none"
                />
              </div>

              <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setCancelOrderTarget(null)}
                  className="px-4 py-2 text-slate-400 hover:text-white cursor-pointer font-medium"
                >
                  Keep Order
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || cancelReason.trim().length < 3}
                  className="px-6 py-2.5 bg-rose-600 hover:bg-rose-500 disabled:opacity-40 text-white font-bold uppercase tracking-wider rounded-xl transition-all shadow-md cursor-pointer"
                >
                  {isSubmitting ? "Cancelling..." : "Confirm Restock & Cancel"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
