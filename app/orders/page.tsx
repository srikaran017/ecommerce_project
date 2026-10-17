"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/auth.store";
import { OrderService } from "@/services/order.service";
import { CustomerOrder } from "@/types/order.types";
import { storeConfig } from "@/config/store.config";
import {
  Package,
  Truck,
  Search,
  ArrowRight,
  RotateCcw,
  ShoppingBag,
  Calendar,
  CheckCircle2,
  Clock,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  X,
  CreditCard,
  Banknote,
  ExternalLink,
} from "lucide-react";

export default function OrdersPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();

  const [orders, setOrders] = useState<CustomerOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalOrders, setTotalOrders] = useState(0);
  const [reorderingId, setReorderingId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const showToast = (type: "success" | "error", text: string) => {
    setToastMessage({ type, text });
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  const loadOrders = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await OrderService.getCustomerOrders({
        page: currentPage,
        limit: 10,
        status: statusFilter,
      });

      if (res.success && Array.isArray(res.data)) {
        setOrders(res.data);
        setTotalPages(res.pagination.totalPages || 1);
        setTotalOrders(res.pagination.total || res.data.length);
      }
    } catch (err: any) {
      console.warn("Failed to load orders:", err);
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, statusFilter]);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login?redirect=/orders");
      return;
    }
    loadOrders();
  }, [isAuthenticated, router, loadOrders]);

  const handleReorder = async (ord: CustomerOrder) => {
    setReorderingId(ord.orderNumber);
    try {
      const res = await OrderService.reorder(ord.orderNumber);
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
      showToast("error", err.message || "Unable to reorder garments.");
    } finally {
      setReorderingId(null);
    }
  };

  // Client search filter
  const displayedOrders = orders.filter((ord) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const matchNumber = ord.orderNumber.toLowerCase().includes(q);
    const matchItems = ord.items.some((it) => it.title.toLowerCase().includes(q) || (it.sku && it.sku.toLowerCase().includes(q)));
    return matchNumber || matchItems;
  });

  const getStatusBadge = (status: string) => {
    const s = (status || "").toUpperCase();
    switch (s) {
      case "DELIVERED":
        return {
          label: "Delivered",
          className: "bg-emerald-50 text-emerald-800 border-emerald-200/80",
          icon: CheckCircle2,
        };
      case "SHIPPED":
        return {
          label: "In transit",
          className: "bg-sky-50 text-sky-800 border-sky-200/80",
          icon: Truck,
        };
      case "CONFIRMED":
        return {
          label: "Confirmed",
          className: "bg-amber-50 text-amber-800 border-amber-200/80",
          icon: Clock,
        };
      case "CANCELLED":
        return {
          label: "Cancelled",
          className: "bg-red-50 text-red-800 border-red-200/80",
          icon: AlertCircle,
        };
      case "PENDING":
      default:
        return {
          label: "Unfulfilled",
          className: "bg-amber-50 text-amber-800 border-amber-200/80",
          icon: Clock,
        };
    }
  };

  return (
    <div className="min-h-screen bg-[var(--background)] py-8 sm:py-12">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        
        {/* Floating Toast Notification */}
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
            <button onClick={() => setToastMessage(null)} className="text-neutral-400 hover:text-white p-1 cursor-pointer">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Clean Breadcrumb Navigation */}
        <nav className="flex items-center gap-2 text-xs text-neutral-500 font-medium">
          <Link href="/" className="hover:text-neutral-900 transition-colors">
            Home
          </Link>
          <span className="text-neutral-300">/</span>
          <Link href="/account" className="hover:text-neutral-900 transition-colors">
            Account
          </Link>
          <span className="text-neutral-300">/</span>
          <span className="text-neutral-900 font-semibold">Orders</span>
        </nav>

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-200/80 pb-5">
          <div>
            <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-neutral-900">
              Orders
            </h1>
            <p className="text-xs sm:text-sm text-neutral-500 mt-1">
              Track shipments, review past receipts, and reorder items.
            </p>
          </div>

          <Link
            href="/products"
            className="inline-flex items-center gap-2 px-4 py-2 bg-neutral-900 hover:bg-neutral-800 text-white rounded-lg text-xs font-medium transition-colors self-start sm:self-auto shadow-xs"
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>Continue shopping</span>
          </Link>
        </div>

        {/* Shopify Polaris-Style Control Bar: Search & Status Filters */}
        <div className="bg-white border border-neutral-200/90 rounded-xl p-3 sm:p-4 space-y-3 shadow-xs">
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search by order # or product name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-neutral-50/70 border border-neutral-200 rounded-lg text-xs text-neutral-900 focus:outline-none focus:bg-white focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900 transition-all placeholder:text-neutral-400"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-700"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Status Filter Segmented Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none text-xs">
              {[
                { id: "ALL", label: "All" },
                { id: "PENDING", label: "Unfulfilled" },
                { id: "CONFIRMED", label: "Confirmed" },
                { id: "SHIPPED", label: "In transit" },
                { id: "DELIVERED", label: "Delivered" },
                { id: "CANCELLED", label: "Cancelled" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => {
                    setStatusFilter(tab.id);
                    setCurrentPage(1);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap cursor-pointer ${
                    statusFilter === tab.id
                      ? "bg-neutral-900 text-white shadow-xs"
                      : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200 hover:text-neutral-900"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Orders List */}
        {isLoading ? (
          <div className="py-20 text-center bg-white border border-neutral-200/90 rounded-xl space-y-3">
            <div className="w-7 h-7 rounded-full border-2 border-neutral-300 border-t-neutral-900 animate-spin mx-auto" />
            <p className="text-xs text-neutral-500 font-medium">
              Loading orders...
            </p>
          </div>
        ) : displayedOrders.length === 0 ? (
          <div className="py-16 text-center bg-white border border-neutral-200/90 rounded-xl p-6 sm:p-8 space-y-4 shadow-xs">
            <div className="w-12 h-12 rounded-full bg-neutral-100 flex items-center justify-center mx-auto text-neutral-400">
              <Package className="w-6 h-6 stroke-[1.5]" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-semibold text-neutral-900">
                {searchQuery || statusFilter !== "ALL" ? "No matching orders found" : "No orders yet"}
              </h3>
              <p className="text-xs text-neutral-500 max-w-sm mx-auto">
                {searchQuery || statusFilter !== "ALL"
                  ? "Try adjusting your search terms or filter selection to view past orders."
                  : "When you place an order, it will appear here with live tracking milestones."}
              </p>
            </div>
            <Link
              href="/products"
              className="inline-flex items-center gap-2 px-4 py-2 bg-neutral-900 hover:bg-neutral-800 text-white rounded-lg text-xs font-medium transition-colors shadow-xs"
            >
              Browse catalog
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {displayedOrders.map((ord) => {
              const badge = getStatusBadge(ord.status);
              const BadgeIcon = badge.icon;
              const formattedDate = new Date(ord.createdAt).toLocaleDateString("en-IN", {
                day: "numeric",
                month: "short",
                year: "numeric",
              });

              return (
                <div
                  key={ord.id}
                  className="bg-white border border-neutral-200/90 rounded-xl overflow-hidden shadow-xs hover:border-neutral-300 transition-all"
                >
                  {/* Order Card Header */}
                  <div className="p-4 sm:p-5 bg-neutral-50/60 border-b border-neutral-200/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-3">
                      <div>
                        <div className="flex items-center gap-2.5">
                          <Link
                            href={`/orders/${ord.orderNumber}`}
                            className="text-sm font-semibold text-neutral-900 hover:underline font-mono"
                          >
                            #{ord.orderNumber}
                          </Link>
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border ${badge.className}`}
                          >
                            <BadgeIcon className="w-3 h-3" />
                            <span>{badge.label}</span>
                          </span>
                        </div>
                        <p className="text-xs text-neutral-500 mt-0.5">
                          Order placed on {formattedDate}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 self-start sm:self-auto">
                      <div className="text-left sm:text-right">
                        <span className="text-[11px] text-neutral-500 block">Total</span>
                        <span className="text-sm font-bold text-neutral-900 font-mono">
                          {storeConfig.currency.symbol}{ord.totalAmount.toLocaleString()}
                        </span>
                      </div>
                      <span className="text-[11px] px-2 py-0.5 bg-neutral-100 border border-neutral-200 text-neutral-600 rounded-md font-medium">
                        {ord.paymentMethod === "COD" ? "Cash on Delivery" : "Paid"}
                      </span>
                    </div>
                  </div>

                  {/* Order Items Preview */}
                  <div className="p-4 sm:p-5 space-y-3">
                    <div className="divide-y divide-neutral-100">
                      {ord.items.map((item, idx) => (
                        <div key={idx} className="py-2.5 first:pt-0 last:pb-0 flex items-center justify-between gap-4">
                          <div className="flex items-center gap-3 min-w-0">
                            {item.imageUrl ? (
                              <img
                                src={item.imageUrl}
                                alt={item.title}
                                className="w-12 h-14 object-cover rounded-lg border border-neutral-200/80 bg-neutral-50 shrink-0"
                              />
                            ) : (
                              <div className="w-12 h-14 bg-neutral-100 rounded-lg border border-neutral-200 flex items-center justify-center shrink-0">
                                <Package className="w-4 h-4 text-neutral-400" />
                              </div>
                            )}
                            <div className="min-w-0">
                              <h4 className="text-xs font-medium text-neutral-900 truncate">
                                {item.title}
                              </h4>
                              <p className="text-xs text-neutral-500 mt-0.5">
                                {item.size ? `Size: ${item.size} • ` : ""}Qty: {item.quantity}
                              </p>
                            </div>
                          </div>

                          <span className="text-xs font-semibold text-neutral-800 font-mono shrink-0">
                            {storeConfig.currency.symbol}{item.price.toLocaleString()}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* In-Transit Courier Notification Banner */}
                    {ord.courierPartner && ord.trackingNumber && (
                      <div className="mt-2 p-3 bg-sky-50/70 border border-sky-200/70 rounded-lg flex items-center justify-between text-xs text-sky-900">
                        <div className="flex items-center gap-2">
                          <Truck className="w-4 h-4 text-sky-600 shrink-0" />
                          <span>
                            Carrier: <strong>{ord.courierPartner}</strong> • Tracking #{ord.trackingNumber}
                          </span>
                        </div>
                        {ord.estimatedDelivery && (
                          <span className="text-[11px] text-sky-700">
                            Est. {new Date(ord.estimatedDelivery).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Order Card Actions Footer */}
                  <div className="p-3 sm:px-5 bg-neutral-50/40 border-t border-neutral-100 flex flex-wrap items-center justify-between gap-2.5">
                    <span className="text-xs text-neutral-500">
                      Recipient: <strong className="text-neutral-800">{ord.shippingAddress ? `${ord.shippingAddress.firstName} ${ord.shippingAddress.lastName}`.trim() : (user?.name || "Customer")}</strong>
                    </span>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleReorder(ord)}
                        disabled={reorderingId === ord.orderNumber}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-neutral-50 text-neutral-700 border border-neutral-300 rounded-lg text-xs font-medium transition-colors cursor-pointer disabled:opacity-50 shadow-2xs"
                      >
                        <RotateCcw className={`w-3.5 h-3.5 ${reorderingId === ord.orderNumber ? "animate-spin" : ""}`} />
                        <span>Buy again</span>
                      </button>

                      <Link
                        href={`/orders/${ord.orderNumber}`}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-neutral-900 hover:bg-neutral-800 text-white rounded-lg text-xs font-medium transition-colors shadow-xs"
                      >
                        <span>View details</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between pt-4 border-t border-neutral-200">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage <= 1}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-neutral-300 rounded-lg text-xs font-medium text-neutral-700 hover:bg-neutral-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer bg-white"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>Previous</span>
            </button>

            <span className="text-xs text-neutral-600">
              Page <strong>{currentPage}</strong> of <strong>{totalPages}</strong>
            </span>

            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage >= totalPages}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-neutral-300 rounded-lg text-xs font-medium text-neutral-700 hover:bg-neutral-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer bg-white"
            >
              <span>Next</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
