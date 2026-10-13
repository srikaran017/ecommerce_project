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
  Filter,
  ArrowRight,
  ExternalLink,
  RotateCcw,
  Sparkles,
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

  return (
    <div className="min-h-screen bg-[var(--background)] py-10 sm:py-14">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        
        {/* Toast Notification */}
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

        {/* Breadcrumb Navigation */}
        <nav className="flex items-center gap-1.5 text-xs text-[var(--muted-foreground)] font-medium">
          <Link href="/" className="hover:text-[var(--foreground)] transition-colors">
            Home
          </Link>
          <span>/</span>
          <Link href="/account" className="hover:text-[var(--foreground)] transition-colors">
            Account Center
          </Link>
          <span>/</span>
          <span className="text-[var(--foreground)] font-semibold">Orders & Tracking</span>
        </nav>

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--border)] pb-6">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-[var(--secondary)]">
              Maison Atelier Archive
            </span>
            <h1 className="font-heading text-2xl sm:text-3xl font-bold uppercase tracking-tight text-[var(--foreground)] mt-1">
              My Orders & Live Tracking
            </h1>
            <p className="text-xs text-[var(--muted-foreground)] mt-1">
              View authoritative purchase records, live courier tracking milestones, and repurchase past garments.
            </p>
          </div>

          <Link
            href="/products"
            className="inline-flex items-center gap-2 px-4 py-2 bg-[var(--primary)] text-[var(--primary-foreground)] rounded-[var(--radius)] text-xs font-bold uppercase tracking-wider hover:opacity-90 transition-opacity self-start sm:self-auto"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Explore Collection</span>
          </Link>
        </div>

        {/* Filter Controls & Search */}
        <div className="bg-[var(--muted)] border border-[var(--border)] rounded-[var(--radius)] p-4 sm:p-5 space-y-4">
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
            {/* Search Bar */}
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-[var(--muted-foreground)] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search by Order # or garment name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-[var(--background)] border border-[var(--border)] rounded-[var(--radius)] text-xs text-[var(--foreground)] focus:outline-none focus:ring-1 focus:ring-[var(--foreground)]"
              />
            </div>

            {/* Status Filter Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
              {[
                { id: "ALL", label: "All Orders" },
                { id: "PENDING", label: "Pending" },
                { id: "CONFIRMED", label: "Confirmed" },
                { id: "SHIPPED", label: "In Transit" },
                { id: "DELIVERED", label: "Delivered" },
                { id: "CANCELLED", label: "Cancelled" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => {
                    setStatusFilter(tab.id);
                    setCurrentPage(1);
                  }}
                  className={`px-3 py-1.5 rounded-[var(--radius)] font-bold text-[11px] uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer ${
                    statusFilter === tab.id
                      ? "bg-[var(--foreground)] text-[var(--background)] shadow-sm"
                      : "bg-[var(--background)] text-[var(--muted-foreground)] hover:text-[var(--foreground)] border border-[var(--border)]"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Order Cards List */}
        {isLoading ? (
          <div className="py-20 text-center space-y-3">
            <div className="w-8 h-8 rounded-full border-2 border-neutral-300 border-t-neutral-900 animate-spin mx-auto" />
            <p className="text-xs uppercase tracking-wider text-[var(--muted-foreground)]">
              Retrieving Order Dossier...
            </p>
          </div>
        ) : displayedOrders.length === 0 ? (
          <div className="py-16 text-center bg-[var(--muted)] border border-[var(--border)] rounded-[var(--radius)] space-y-4">
            <Package className="w-12 h-12 text-[var(--muted-foreground)] mx-auto opacity-50" />
            <h3 className="font-heading text-lg font-bold uppercase tracking-wider text-[var(--foreground)]">
              No Orders Located
            </h3>
            <p className="text-xs text-[var(--muted-foreground)] max-w-sm mx-auto">
              {searchQuery || statusFilter !== "ALL"
                ? "No orders match your filter criteria. Try resetting your search."
                : "You have not placed any orders yet. Discover our curated eveningwear."}
            </p>
            <Link
              href="/products"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-[var(--primary)] text-[var(--primary-foreground)] rounded-[var(--radius)] text-xs font-bold uppercase tracking-wider hover:opacity-90"
            >
              Browse Luxury Gowns
            </Link>
          </div>
        ) : (
          <div className="space-y-5">
            {displayedOrders.map((ord) => {
              const isPending = ord.status === "PENDING";
              const isDelivered = ord.status === "DELIVERED";
              const isCancelled = ord.status === "CANCELLED";
              const isShipped = ord.status === "SHIPPED";

              return (
                <div
                  key={ord.id}
                  className="bg-[var(--background)] border border-[var(--border)] rounded-[var(--radius)] p-5 sm:p-6 shadow-sm hover:border-neutral-400 dark:hover:border-neutral-700 transition-all space-y-5"
                >
                  {/* Card Header: Order Number, Date, Status */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[var(--border)] pb-4">
                    <div className="flex items-center gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-sm text-[var(--foreground)]">
                            #{ord.orderNumber}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${
                              isDelivered
                                ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                                : isCancelled
                                ? "bg-rose-50 text-rose-800 border-rose-200"
                                : isShipped
                                ? "bg-sky-50 text-sky-800 border-sky-200"
                                : "bg-amber-50 text-amber-800 border-amber-200"
                            }`}
                          >
                            {ord.status}
                          </span>
                        </div>
                        <p className="text-[11px] text-[var(--muted-foreground)] mt-0.5">
                          Placed on {new Date(ord.createdAt).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 self-end sm:self-auto">
                      <div className="text-right">
                        <span className="text-xs text-[var(--muted-foreground)] block">Total Amount</span>
                        <span className="text-sm font-bold text-[var(--foreground)] font-mono">
                          {storeConfig.currency.symbol}{ord.totalAmount.toLocaleString()}
                        </span>
                      </div>
                      <span className="text-[10px] uppercase tracking-wider px-2 py-1 bg-[var(--muted)] border border-[var(--border)] rounded font-semibold text-[var(--muted-foreground)]">
                        {ord.paymentMethod === "COD" ? "Cash On Delivery" : "Online"}
                      </span>
                    </div>
                  </div>

                  {/* Garment Preview Row */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3 overflow-x-auto py-1">
                      {ord.items.slice(0, 3).map((item, idx) => (
                        <div key={idx} className="flex items-center gap-2.5 shrink-0 bg-[var(--muted)] p-2 rounded-[var(--radius)] border border-[var(--border)]">
                          {item.imageUrl ? (
                            <img
                              src={item.imageUrl}
                              alt={item.title}
                              className="w-12 h-14 object-cover rounded-[var(--radius)] shrink-0"
                            />
                          ) : (
                            <div className="w-12 h-14 bg-neutral-200 dark:bg-neutral-800 rounded flex items-center justify-center">
                              <Package className="w-4 h-4 text-neutral-500" />
                            </div>
                          )}
                          <div className="max-w-[140px]">
                            <h4 className="text-[11px] font-bold text-[var(--foreground)] truncate">
                              {item.title}
                            </h4>
                            <p className="text-[10px] text-[var(--muted-foreground)]">
                              {item.size ? `Size ${item.size} • ` : ""}Qty {item.quantity}
                            </p>
                          </div>
                        </div>
                      ))}
                      {ord.items.length > 3 && (
                        <span className="text-[11px] font-bold text-[var(--muted-foreground)] bg-[var(--muted)] px-3 py-4 rounded-[var(--radius)] border border-[var(--border)] shrink-0">
                          +{ord.items.length - 3} more
                        </span>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                      <button
                        onClick={() => handleReorder(ord)}
                        disabled={reorderingId === ord.orderNumber}
                        className="inline-flex items-center gap-1.5 px-3 py-2 bg-[var(--muted)] hover:bg-neutral-200 dark:hover:bg-neutral-800 text-[var(--foreground)] border border-[var(--border)] rounded-[var(--radius)] text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer disabled:opacity-50"
                      >
                        <RotateCcw className={`w-3.5 h-3.5 ${reorderingId === ord.orderNumber ? "animate-spin" : ""}`} />
                        <span>Buy Again</span>
                      </button>

                      <Link
                        href={`/orders/${ord.orderNumber}`}
                        className="inline-flex items-center gap-1.5 px-4 py-2 bg-[var(--foreground)] text-[var(--background)] hover:opacity-90 rounded-[var(--radius)] text-xs font-bold uppercase tracking-wider transition-opacity shadow-sm"
                      >
                        <span>View Details</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>

                  {/* Courier Tracking Quick Bar if In Transit */}
                  {ord.courierPartner && ord.trackingNumber && (
                    <div className="p-3 bg-sky-50 dark:bg-sky-950/30 border border-sky-200 dark:border-sky-800 rounded-[var(--radius)] flex items-center justify-between text-xs text-sky-900 dark:text-sky-300">
                      <div className="flex items-center gap-2 font-medium">
                        <Truck className="w-4 h-4 text-sky-600 dark:text-sky-400 shrink-0" />
                        <span>Dispatched via <strong>{ord.courierPartner}</strong> (AWB: <span className="font-mono">{ord.trackingNumber}</span>)</span>
                      </div>
                      {ord.estimatedDelivery && (
                        <span className="text-[11px] text-sky-800 dark:text-sky-400">
                          Est: {new Date(ord.estimatedDelivery).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination Bar */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-[var(--border)] pt-5 text-xs text-[var(--muted-foreground)]">
            <span>
              Showing Page {currentPage} of {totalPages} ({totalOrders} Total Orders)
            </span>
            <div className="flex items-center gap-2">
              <button
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="px-3 py-1.5 border border-[var(--border)] rounded-[var(--radius)] hover:bg-[var(--muted)] disabled:opacity-40 cursor-pointer flex items-center gap-1"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>Prev</span>
              </button>
              <button
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className="px-3 py-1.5 border border-[var(--border)] rounded-[var(--radius)] hover:bg-[var(--muted)] disabled:opacity-40 cursor-pointer flex items-center gap-1"
              >
                <span>Next</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
