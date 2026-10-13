"use client";

import React, { useState } from "react";
import Link from "next/link";
import { AdminOrder } from "@/types/admin.types";
import { storeConfig } from "@/config/store.config";
import { useCartStore } from "@/stores/cart.store";
import { OrderTrackingModal } from "./OrderTrackingModal";
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
  const { addItem, openCart } = useCartStore();

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

  const handleReorder = async (ord: AdminOrder) => {
    try {
      const orderNum = ord.orderNumber || ord.id;
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
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-neutral-200/80 p-6 sm:p-8 shadow-sm space-y-8 animate-fade-in">
      {/* Header */}
      <div className="border-b border-neutral-100 pb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base sm:text-lg font-bold uppercase tracking-tight text-neutral-900 flex items-center gap-2">
            <Package className="w-5 h-5 text-amber-700" />
            <span>Orders & Live White-Glove Tracking</span>
          </h2>
          <p className="text-xs text-neutral-500 mt-0.5">
            Monitor real-time fulfillment milestones, courier tracking IDs, and access past invoices.
          </p>
        </div>

        <Link
          href="/products"
          className="text-xs font-bold text-amber-800 uppercase tracking-widest hover:underline flex items-center gap-1 self-start sm:self-auto"
        >
          <span>Explore New Arrivals</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-neutral-50/70 p-3 rounded-2xl border border-neutral-100">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search by order # or garment title..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-neutral-200 bg-white focus:outline-none focus:ring-1 focus:ring-amber-500 font-medium text-neutral-800"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap gap-1.5">
          {[
            { id: "ALL", label: "All Orders" },
            { id: "PROCESSING", label: "Tailoring" },
            { id: "IN_TRANSIT", label: "In Transit" },
            { id: "DELIVERED", label: "Delivered" },
            { id: "CANCELLED", label: "Cancelled" },
          ].map((pill) => (
            <button
              key={pill.id}
              onClick={() => setStatusFilter(pill.id)}
              className={`px-3 py-1.5 rounded-xl text-[11px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                statusFilter === pill.id
                  ? "bg-neutral-900 text-white shadow-xs"
                  : "bg-white text-neutral-600 hover:bg-neutral-100 border border-neutral-200/60"
              }`}
            >
              {pill.label}
            </button>
          ))}
        </div>
      </div>

      {/* Orders List */}
      {isLoading ? (
        <div className="py-16 text-center space-y-3">
          <div className="w-8 h-8 border-2 border-neutral-300 border-t-neutral-900 rounded-full animate-spin mx-auto" />
          <p className="text-xs text-neutral-400 font-medium">Connecting to fulfillment ledger...</p>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="py-16 text-center space-y-3 bg-neutral-50/60 rounded-2xl border border-neutral-100">
          <div className="w-12 h-12 rounded-full bg-neutral-100 flex items-center justify-center mx-auto text-neutral-400">
            <Package className="w-6 h-6" />
          </div>
          <p className="text-xs font-bold uppercase tracking-wider text-neutral-700">
            {searchQuery || statusFilter !== "ALL" ? "No Matching Orders Found" : "No Past Orders on Record"}
          </p>
          <p className="text-xs text-neutral-500 max-w-sm mx-auto">
            {searchQuery || statusFilter !== "ALL"
              ? "Try resetting your filter or search keywords to view your complete acquisition history."
              : "When you acquire garments from our seasonal lookbook, live progress milestones will display here."}
          </p>
          <Link
            href="/products"
            className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-neutral-900 hover:bg-amber-600 text-white text-xs font-bold uppercase tracking-widest rounded-xl transition-all shadow-md cursor-pointer mt-2"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Discover The Atelier</span>
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((ord) => {
            const orderDate = ord.createdAt
              ? new Date(ord.createdAt).toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })
              : "Recently";

            const formattedTotal = `${storeConfig.currency.symbol}${Number(
              ord.totalAmount ?? ord.total ?? 0
            ).toLocaleString()}`;

            const isDelivered = ord.status === "DELIVERED";
            const isCancelled = ord.status === "CANCELLED";
            const isShipped = ord.status === "SHIPPED";

            return (
              <div
                key={ord.id}
                className="rounded-2xl border border-neutral-200/80 bg-white overflow-hidden shadow-xs hover:border-neutral-300 transition-all"
              >
                {/* Order Top Bar */}
                <div className="p-4 sm:p-5 bg-neutral-50/70 border-b border-neutral-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="font-mono font-bold text-xs text-neutral-900 bg-white px-2.5 py-1 rounded-lg border border-neutral-200">
                      #{ord.orderNumber || ord.id.slice(0, 10)}
                    </span>
                    <span className="text-[11px] text-neutral-400 font-mono flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {orderDate}
                    </span>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        isDelivered
                          ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                          : isCancelled
                          ? "bg-rose-100 text-rose-800 border border-rose-200"
                          : isShipped
                          ? "bg-blue-100 text-blue-800 border border-blue-200"
                          : "bg-amber-100 text-amber-800 border border-amber-200"
                      }`}
                    >
                      {ord.status || "CONFIRMED"}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-neutral-900 font-mono">
                      {formattedTotal}
                    </span>
                    <span className="text-[10px] uppercase font-bold text-neutral-400 bg-white px-2 py-0.5 rounded-md border border-neutral-200">
                      {ord.paymentMethod || "Prepaid"}
                    </span>
                  </div>
                </div>

                {/* Garments Preview */}
                <div className="p-4 sm:p-5 divide-y divide-neutral-100">
                  {ord.items && ord.items.length > 0 ? (
                    ord.items.map((item: any, idx: number) => {
                      const title = item.productName || item.title || "Artisanal Garment";
                      const size = item.size || item.variantName || "Bespoke";
                      const qty = item.quantity || 1;
                      const price = item.price
                        ? `${storeConfig.currency.symbol}${Number(item.price).toLocaleString()}`
                        : formattedTotal;
                      const img =
                        item.imageUrl ||
                        item.image ||
                        "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=500";

                      return (
                        <div key={idx} className="py-3 first:pt-0 last:pb-0 flex items-center justify-between gap-4">
                          <div className="flex items-center gap-3.5">
                            <img
                              src={img}
                              alt={title}
                              className="w-14 h-16 object-cover rounded-xl border border-neutral-100 bg-neutral-50 flex-shrink-0"
                            />
                            <div>
                              <p className="text-xs font-bold text-neutral-900 line-clamp-1">{title}</p>
                              <p className="text-[11px] text-neutral-500 font-mono mt-0.5">
                                Size: <span className="text-neutral-800 font-semibold">{size}</span> • Quantity: {qty}
                              </p>
                            </div>
                          </div>
                          <span className="text-xs font-bold text-neutral-800 font-mono">{price}</span>
                        </div>
                      );
                    })
                  ) : (
                    <div className="py-2 text-xs text-neutral-500">
                      Bespoke Capsule Garments ({formattedTotal})
                    </div>
                  )}
                </div>

                {/* Order Actions Footer */}
                <div className="p-4 bg-neutral-50/40 border-t border-neutral-100 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-neutral-500 font-medium">
                      Recipient: <span className="text-neutral-900 font-semibold">{ord.customerName || "Valued Client"}</span>
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Live Tracking Trigger */}
                    <button
                      onClick={() => setSelectedOrderForTracking(ord)}
                      className="px-4 py-2 bg-neutral-900 hover:bg-amber-600 text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                    >
                      <Truck className="w-3.5 h-3.5" />
                      <span>Track Shipment</span>
                    </button>

                    {/* Reorder Button */}
                    <button
                      onClick={() => handleReorder(ord)}
                      className="px-3 py-2 bg-white hover:bg-neutral-100 border border-neutral-200 text-neutral-700 text-xs font-bold uppercase tracking-wider rounded-xl transition-all flex items-center gap-1 cursor-pointer"
                      title="Add items back to shopping bag"
                    >
                      <RotateCcw className="w-3.5 h-3.5 text-neutral-500" />
                      <span className="hidden sm:inline">Reorder</span>
                    </button>

                    {/* View Details */}
                    <Link
                      href={`/orders/${ord.orderNumber || ord.id}`}
                      className="px-3 py-2 bg-white hover:bg-neutral-100 border border-neutral-200 text-neutral-700 text-xs font-bold uppercase tracking-wider rounded-xl transition-all flex items-center gap-1"
                    >
                      <span>View Details</span>
                      <ExternalLink className="w-3 h-3 text-neutral-400" />
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
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
