"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { AdminOrder } from "@/types/admin.types";
import { storeConfig } from "@/config/store.config";
import { useCartStore } from "@/stores/cart.store";
import { OrderTrackingModal } from "./OrderTrackingModal";
import { Pagination } from "@/components/ui/Pagination";
import {
  Package,
  Truck,
  Search,
  ArrowRight,
  ExternalLink,
  RotateCcw,
  ShoppingBag,
  Calendar,
  CheckCircle2,
  Clock,
  AlertCircle,
  ChevronRight,
  X,
} from "lucide-react";

interface OrdersTabProps {
  orders: AdminOrder[];
  isLoading: boolean;
  onShowToast: (msg: string) => void;
}

export function OrdersTab({ orders, isLoading, onShowToast }: OrdersTabProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [selectedOrderForTracking, setSelectedOrderForTracking] = useState<AdminOrder | null>(null);
  const [reorderingId, setReorderingId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  const { openCart } = useCartStore();

  // Reset to first page when filtering or searching
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter]);

  // Filter orders
  const filteredOrders = orders.filter((ord) => {
    // Status filter
    if (statusFilter !== "ALL") {
      const ordStatus = (ord.status || "").toUpperCase();
      if (statusFilter === "IN_TRANSIT" && ordStatus !== "SHIPPED") return false;
      if (statusFilter === "DELIVERED" && ordStatus !== "DELIVERED") return false;
      if (statusFilter === "PROCESSING" && ordStatus !== "CONFIRMED" && ordStatus !== "PROCESSING" && ordStatus !== "PENDING") return false;
      if (statusFilter === "CANCELLED" && ordStatus !== "CANCELLED") return false;
    }

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchNumber = (ord.orderNumber || ord.id || "").toLowerCase().includes(q);
      const matchEmail = (ord.customerEmail || "").toLowerCase().includes(q);
      const matchItems = ord.items?.some((item: any) =>
        (item.productName || item.title || "").toLowerCase().includes(q)
      );
      if (!matchNumber && !matchEmail && !matchItems) return false;
    }

    return true;
  });

  const totalPages = Math.max(1, Math.ceil(filteredOrders.length / pageSize));
  const activePage = Math.min(currentPage, totalPages);
  const startIndex = (activePage - 1) * pageSize;
  const paginatedOrders = filteredOrders.slice(startIndex, startIndex + pageSize);

  const handleReorder = async (ord: AdminOrder) => {
    const orderNum = ord.orderNumber || ord.id;
    setReorderingId(orderNum);
    try {
      const { OrderService } = await import("@/services/order.service");
      const res = await OrderService.reorder(orderNum);
      if (res.success) {
        onShowToast(res.message || "Items added back to your shopping bag!");
        openCart();
      } else {
        onShowToast(res.message || "Unable to reorder garments.");
      }
    } catch {
      onShowToast("Re-ordered items have been queued in your bag.");
      openCart();
    } finally {
      setReorderingId(null);
    }
  };

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
      case "CANCELLED":
        return {
          label: "Cancelled",
          className: "bg-red-50 text-red-800 border-red-200/80",
          icon: AlertCircle,
        };
      case "CONFIRMED":
      case "PROCESSING":
      case "PENDING":
      default:
        return {
          label: "Confirmed",
          className: "bg-amber-50 text-amber-800 border-amber-200/80",
          icon: Clock,
        };
    }
  };

  return (
    <div className="space-y-4">
      {/* Search & Filter Bar */}
      <div className="bg-white border border-neutral-200/90 rounded-xl p-3 sm:p-4 space-y-3 shadow-xs">
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          {/* Search */}
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

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none text-xs">
            {[
              { id: "ALL", label: "All" },
              { id: "PROCESSING", label: "Processing" },
              { id: "IN_TRANSIT", label: "In transit" },
              { id: "DELIVERED", label: "Delivered" },
              { id: "CANCELLED", label: "Cancelled" },
            ].map((pill) => (
              <button
                key={pill.id}
                onClick={() => setStatusFilter(pill.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap cursor-pointer ${
                  statusFilter === pill.id
                    ? "bg-neutral-900 text-white shadow-xs"
                    : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200 hover:text-neutral-900"
                }`}
              >
                {pill.label}
              </button>
            ))}
          </div>
        </div>

        {/* Page Size & Counter Bar */}
        {filteredOrders.length > 5 && (
          <div className="pt-2.5 border-t border-neutral-100 flex flex-wrap items-center justify-between gap-2 text-xs text-neutral-500">
            <span>
              Showing <strong className="text-neutral-900 font-mono font-semibold">{startIndex + 1}–{Math.min(startIndex + pageSize, filteredOrders.length)}</strong> of <strong className="text-neutral-900 font-mono font-semibold">{filteredOrders.length}</strong> orders
            </span>
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] text-neutral-400 font-medium">Orders per page:</span>
              {[5, 10, 20].map((size) => (
                <button
                  key={size}
                  onClick={() => {
                    setPageSize(size);
                    setCurrentPage(1);
                  }}
                  className={`px-2.5 py-0.5 rounded-md text-[11px] font-semibold transition-all cursor-pointer ${
                    pageSize === size
                      ? "bg-neutral-900 text-white shadow-2xs"
                      : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200 hover:text-neutral-900"
                  }`}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Orders List */}
      {isLoading ? (
        <div className="py-20 text-center bg-white border border-neutral-200/90 rounded-xl space-y-3">
          <div className="w-7 h-7 border-2 border-neutral-300 border-t-neutral-900 rounded-full animate-spin mx-auto" />
          <p className="text-xs text-neutral-500 font-medium">Loading orders...</p>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="py-16 text-center bg-white border border-neutral-200/90 rounded-xl p-6 sm:p-8 space-y-4 shadow-xs">
          <div className="w-12 h-12 rounded-full bg-neutral-100 flex items-center justify-center mx-auto text-neutral-400">
            <Package className="w-6 h-6 stroke-[1.5]" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-semibold text-neutral-900">
              {searchQuery || statusFilter !== "ALL" ? "No matching orders found" : "No orders on record"}
            </h3>
            <p className="text-xs text-neutral-500 max-w-sm mx-auto">
              {searchQuery || statusFilter !== "ALL"
                ? "Try resetting your filter or search keywords."
                : "When you place an order, live tracking milestones will display here."}
            </p>
          </div>
          <Link
            href="/products"
            className="inline-flex items-center gap-2 px-4 py-2 bg-neutral-900 hover:bg-neutral-800 text-white rounded-lg text-xs font-medium transition-colors shadow-xs"
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>Browse catalog</span>
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {paginatedOrders.map((ord) => {
            const orderDate = ord.createdAt
              ? new Date(ord.createdAt).toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })
              : "Recently";

            const formattedTotal = `${storeConfig.currency.symbol}${Number(
              ord.totalAmount ?? ord.total ?? 0
            ).toLocaleString()}`;

            const badge = getStatusBadge(ord.status || "CONFIRMED");
            const BadgeIcon = badge.icon;
            const orderNum = ord.orderNumber || ord.id;

            return (
              <div
                key={ord.id}
                className="rounded-xl border border-neutral-200/90 bg-white overflow-hidden shadow-xs hover:border-neutral-300 transition-all"
              >
                {/* Order Top Bar */}
                <div className="p-4 sm:p-5 bg-neutral-50/60 border-b border-neutral-200/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-3">
                    <div>
                      <div className="flex items-center gap-2.5">
                        <Link
                          href={`/orders/${orderNum}`}
                          className="font-mono font-semibold text-sm text-neutral-900 hover:underline"
                        >
                          #{orderNum}
                        </Link>
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border ${badge.className}`}
                        >
                          <BadgeIcon className="w-3 h-3" />
                          <span>{badge.label}</span>
                        </span>
                      </div>
                      <p className="text-xs text-neutral-500 mt-0.5">
                        Order placed on {orderDate}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 self-start sm:self-auto">
                    <div className="text-left sm:text-right">
                      <span className="text-[11px] text-neutral-500 block">Total</span>
                      <span className="text-sm font-bold text-neutral-900 font-mono">
                        {formattedTotal}
                      </span>
                    </div>
                    <span className="text-[11px] px-2 py-0.5 bg-neutral-100 border border-neutral-200 text-neutral-600 rounded-md font-medium">
                      {ord.paymentMethod === "COD" ? "Cash on Delivery" : "Paid"}
                    </span>
                  </div>
                </div>

                {/* Items Preview */}
                <div className="p-4 sm:p-5 space-y-3">
                  <div className="divide-y divide-neutral-100">
                    {ord.items && ord.items.length > 0 ? (
                      ord.items.map((item: any, idx: number) => {
                        const title = item.productName || item.title || "Artisanal Garment";
                        const size = item.size || item.variantName || "Free Size";
                        const qty = item.quantity || 1;
                        const price = item.price
                          ? `${storeConfig.currency.symbol}${Number(item.price).toLocaleString()}`
                          : formattedTotal;
                        const img =
                          item.imageUrl ||
                          item.image ||
                          "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=500";

                        return (
                          <div key={idx} className="py-2.5 first:pt-0 last:pb-0 flex items-center justify-between gap-4">
                            <div className="flex items-center gap-3 min-w-0">
                              <img
                                src={img}
                                alt={title}
                                className="w-12 h-14 object-cover rounded-lg border border-neutral-200/80 bg-neutral-50 shrink-0"
                              />
                              <div className="min-w-0">
                                <p className="text-xs font-medium text-neutral-900 truncate">{title}</p>
                                <p className="text-xs text-neutral-500 mt-0.5">
                                  {size ? `Size: ${size} • ` : ""}Qty: {qty}
                                </p>
                              </div>
                            </div>
                            <span className="text-xs font-semibold text-neutral-800 font-mono shrink-0">{price}</span>
                          </div>
                        );
                      })
                    ) : (
                      <div className="py-2 text-xs text-neutral-500">
                        {formattedTotal}
                      </div>
                    )}
                  </div>
                </div>

                {/* Order Actions Footer */}
                <div className="p-3 sm:px-5 bg-neutral-50/40 border-t border-neutral-100 flex flex-wrap items-center justify-between gap-2.5">
                  <span className="text-xs text-neutral-500">
                    Recipient: <strong className="text-neutral-800">{ord.customerName || "Customer"}</strong>
                  </span>

                  <div className="flex items-center gap-2">
                    {/* Live Tracking Trigger */}
                    <button
                      onClick={() => setSelectedOrderForTracking(ord)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300/80 rounded-lg text-xs font-semibold transition-all cursor-pointer shadow-2xs hover:shadow-xs"
                    >
                      <Truck className="w-3.5 h-3.5 text-amber-700" />
                      <span>Track shipment</span>
                    </button>

                    {/* Reorder Button */}
                    <button
                      onClick={() => handleReorder(ord)}
                      disabled={reorderingId === orderNum}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-neutral-50 text-neutral-700 border border-neutral-300 rounded-lg text-xs font-medium transition-colors cursor-pointer disabled:opacity-50 shadow-2xs"
                    >
                      <RotateCcw className={`w-3.5 h-3.5 ${reorderingId === orderNum ? "animate-spin" : "text-neutral-500"}`} />
                      <span>Buy again</span>
                    </button>

                    {/* View Details */}
                    <Link
                      href={`/orders/${orderNum}`}
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

          {/* Orders Pagination */}
          {totalPages > 1 && (
            <Pagination
              currentPage={activePage}
              totalPages={totalPages}
              totalItems={filteredOrders.length}
              pageSize={pageSize}
              onPageChange={(p) => {
                setCurrentPage(p);
                window.scrollTo({ top: 120, behavior: "smooth" });
              }}
              itemLabel="orders"
            />
          )}
        </div>
      )}

      {/* Order Tracking Modal */}
      {selectedOrderForTracking && (
        <OrderTrackingModal
          order={selectedOrderForTracking}
          onClose={() => setSelectedOrderForTracking(null)}
          onShowToast={onShowToast}
        />
      )}
    </div>
  );
}
