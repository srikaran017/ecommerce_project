"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  ShoppingBag,
  Eye,
  Search,
  CheckCircle2,
  Truck,
  Download,
  ArrowRight,
  Package,
  X,
} from "lucide-react";
import { storeConfig } from "@/config/store.config";
import { AdminService } from "@/services/admin.service";
import { AdminOrder, OrderStatus, CourierInfo } from "@/types/admin.types";
import { exportOrdersCsv } from "@/utils/exportCsv";
import { useAuthStore } from "@/stores/auth.store";
import { rbac } from "@/lib/rbac";

export const SAMPLE_ADMIN_ORDERS = [
  {
    id: "ord_1",
    orderNumber: "ORD-98231",
    customerName: "Aarav Sharma",
    customerEmail: "aarav@example.com",
    customerPhone: "+91 98765 00002",
    items: [
      {
        id: "item_1",
        productId: "prod_1",
        title: "Mulberry Silk Draped Evening Gown",
        size: "M",
        color: "Emerald Green",
        quantity: 1,
        price: 18999,
      },
    ],
    subtotal: 18999,
    discount: 0,
    shipping: 0,
    tax: 0,
    total: 18999,
    status: "CONFIRMED" as OrderStatus,
    paymentMethod: "RAZORPAY",
    paymentStatus: "COMPLETED" as const,
    shippingAddress: {
      street: "102, Skyline Residency, Bandra West",
      city: "Mumbai",
      state: "Maharashtra",
      postalCode: "400050",
      country: "India",
    },
    createdAt: "Today, 2:15 PM",
    updatedAt: "Today, 2:15 PM",
  },
  {
    id: "ord_2",
    orderNumber: "ORD-98230",
    customerName: "Priya Sengupta",
    customerEmail: "priya@example.com",
    customerPhone: "+91 98765 00003",
    items: [
      {
        id: "item_2",
        productId: "prod_2",
        title: "Handcrafted Banarasi Raw Silk Saree",
        size: "Free Size",
        color: "Royal Magenta",
        quantity: 1,
        price: 28999,
      },
    ],
    subtotal: 28999,
    discount: 2899,
    shipping: 0,
    tax: 0,
    total: 26100,
    status: "SHIPPED" as OrderStatus,
    paymentMethod: "RAZORPAY",
    paymentStatus: "COMPLETED" as const,
    shippingAddress: {
      street: "45, Park Street",
      city: "Kolkata",
      state: "West Bengal",
      postalCode: "700016",
      country: "India",
    },
    courier: {
      carrierName: "Delhivery Air",
      trackingNumber: "DEL-849204921",
      trackingUrl: "https://www.delhivery.com/track/package/DEL-849204921",
    },
    createdAt: "Today, 11:40 AM",
    updatedAt: "Today, 11:40 AM",
  },
  {
    id: "ord_3",
    orderNumber: "ORD-98229",
    customerName: "Rohan Varma",
    customerEmail: "rohan@example.com",
    customerPhone: "+91 98765 00004",
    items: [
      {
        id: "item_3",
        productId: "prod_3",
        title: "Structured Belgian Linen Shirt",
        size: "L",
        color: "Crisp Ivory",
        quantity: 1,
        price: 4999,
      },
    ],
    subtotal: 4999,
    discount: 0,
    shipping: 0,
    tax: 0,
    total: 4999,
    status: "DELIVERED" as OrderStatus,
    paymentMethod: "COD",
    paymentStatus: "COMPLETED" as const,
    shippingAddress: {
      street: "78, Koregaon Park",
      city: "Pune",
      state: "Maharashtra",
      postalCode: "411001",
      country: "India",
    },
    createdAt: "Yesterday",
    updatedAt: "Yesterday",
  },
  {
    id: "ord_4",
    orderNumber: "ORD-98228",
    customerName: "Meera Kapoor",
    customerEmail: "meera@example.com",
    customerPhone: "+91 98765 00005",
    items: [
      {
        id: "item_4",
        productId: "prod_4",
        title: "Double-Breasted Italian Wool Blazer",
        size: "40R",
        color: "Charcoal Slate",
        quantity: 1,
        price: 24999,
      },
    ],
    subtotal: 24999,
    discount: 1000,
    shipping: 0,
    tax: 0,
    total: 23999,
    status: "PROCESSING" as OrderStatus,
    paymentMethod: "RAZORPAY",
    paymentStatus: "COMPLETED" as const,
    shippingAddress: {
      street: "12, Golf Links",
      city: "New Delhi",
      state: "Delhi",
      postalCode: "110003",
      country: "India",
    },
    createdAt: "Yesterday",
    updatedAt: "Yesterday",
  },
];

export default function AdminOrdersPage() {
  const { user } = useAuthStore();
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [feedback, setFeedback] = useState<string | null>(null);

  // Courier modal state
  const [selectedOrderForShipping, setSelectedOrderForShipping] = useState<AdminOrder | null>(null);
  const [carrierName, setCarrierName] = useState("Delhivery");
  const [trackingNumber, setTrackingNumber] = useState("");

  const loadOrders = () => {
    setIsLoading(true);
    AdminService.getOrders(statusFilter, searchTerm)
      .then((data) => setOrders(data))
      .catch((err) => console.error("Error loading orders:", err))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    loadOrders();
  }, [statusFilter, searchTerm]);

  const handleStatusChange = async (orderId: string, newStatus: OrderStatus) => {
    if (!rbac.canUpdateOrderStatus(user?.role)) {
      alert("Permission denied to update order lifecycle.");
      return;
    }

    if (newStatus === "SHIPPED") {
      const ord = orders.find((o) => o.id === orderId);
      if (ord) {
        setSelectedOrderForShipping(ord);
        return;
      }
    }

    await AdminService.updateOrderStatus(orderId, newStatus);
    setFeedback(`Order status updated to ${newStatus}`);
    loadOrders();
    setTimeout(() => setFeedback(null), 3000);
  };

  const handleConfirmShipping = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrderForShipping) return;

    const courier: CourierInfo = {
      carrierName: carrierName.trim() || "Local Courier",
      trackingNumber: trackingNumber.trim() || `TRK-${Date.now().toString().slice(-6)}`,
      shippedAt: new Date().toISOString(),
    };

    await AdminService.updateOrderStatus(selectedOrderForShipping.id, "SHIPPED", courier);
    setFeedback(`Order ${selectedOrderForShipping.orderNumber} dispatched via ${courier.carrierName}`);
    setSelectedOrderForShipping(null);
    setTrackingNumber("");
    loadOrders();
    setTimeout(() => setFeedback(null), 3000);
  };

  const handleExportCsv = () => {
    if (!rbac.canExportOrders(user?.role)) {
      alert("Permission denied to export customer order data.");
      return;
    }
    exportOrdersCsv(orders, storeConfig.name);
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded bg-amber-400/10 border border-amber-400/20 text-amber-400 text-[10px] font-mono font-bold uppercase tracking-wider">
              FULFILLMENT ENGINE
            </span>
            <span className="text-slate-500 text-xs">•</span>
            <span className="text-xs text-slate-400">Order State Machine</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight flex items-center gap-3">
            <ShoppingBag className="w-6 h-6 text-amber-400" />
            <span>Orders & Dispatch Lifecycle</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Track customer payments, packaging, waybills, and delivery milestones.
          </p>
        </div>

        {rbac.canExportOrders(user?.role) && (
          <button
            onClick={handleExportCsv}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold text-xs rounded-xl transition-all cursor-pointer shadow-sm"
          >
            <Download className="w-4 h-4 text-amber-400" />
            <span>Export Courier Manifest (CSV)</span>
          </button>
        )}
      </div>

      {/* Notification Banner */}
      {feedback && (
        <div className="p-4 bg-emerald-950 border border-emerald-800 text-emerald-300 text-xs font-bold rounded-xl flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{feedback}</span>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-950 p-4 rounded-xl border border-slate-800 text-xs">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by order #, client name, or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-900 text-white border border-slate-700 rounded-lg focus:border-amber-400 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-slate-900 text-white border border-slate-700 rounded-lg font-semibold uppercase focus:border-amber-400 focus:outline-none"
          >
            <option value="ALL">All Statuses ({orders.length})</option>
            <option value="CONFIRMED">Confirmed</option>
            <option value="PROCESSING">Processing</option>
            <option value="PACKED">Packed</option>
            <option value="SHIPPED">Shipped</option>
            <option value="DELIVERED">Delivered</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 bg-slate-900/60 font-semibold uppercase tracking-wider text-[10px]">
                <th className="py-3.5 px-6">Order ID</th>
                <th className="py-3.5 px-6">Customer</th>
                <th className="py-3.5 px-6">Garments</th>
                <th className="py-3.5 px-6">Amount</th>
                <th className="py-3.5 px-6">Payment</th>
                <th className="py-3.5 px-6">State Machine Transition</th>
                <th className="py-3.5 px-6 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 text-slate-300">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    Loading customer orders...
                  </td>
                </tr>
              ) : orders.length > 0 ? (
                orders.map((ord) => (
                  <tr key={ord.id} className="hover:bg-slate-900/40 transition-colors">
                    <td className="py-4 px-6">
                      <span className="font-mono font-bold text-amber-300 block">
                        {ord.orderNumber}
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono">
                        {ord.createdAt}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <div className="font-bold text-white">{ord.customerName}</div>
                      <div className="text-[11px] text-slate-400">{ord.customerPhone}</div>
                    </td>
                    <td className="py-4 px-6 text-slate-300 max-w-xs truncate">
                      {ord.items.map((i) => `${i.title} (${i.size})`).join(", ")}
                    </td>
                    <td className="py-4 px-6 font-bold text-white">
                      {storeConfig.currency.symbol}
                      {ord.total.toLocaleString()}
                    </td>
                    <td className="py-4 px-6">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-900 text-slate-200 border border-slate-700">
                        {ord.paymentMethod} • {ord.paymentStatus}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <select
                        value={ord.status}
                        onChange={(e) => handleStatusChange(ord.id, e.target.value as OrderStatus)}
                        disabled={!rbac.canUpdateOrderStatus(user?.role)}
                        className={`rounded-lg px-2.5 py-1 text-xs font-semibold focus:outline-none border cursor-pointer ${
                          ord.status === "DELIVERED"
                            ? "bg-emerald-950 text-emerald-300 border-emerald-800"
                            : ord.status === "SHIPPED"
                            ? "bg-blue-950 text-blue-300 border-blue-800"
                            : ord.status === "CANCELLED"
                            ? "bg-rose-950 text-rose-300 border-rose-800"
                            : "bg-slate-900 text-amber-300 border-slate-700"
                        }`}
                      >
                        <option value="PENDING">PENDING</option>
                        <option value="CONFIRMED">CONFIRMED</option>
                        <option value="PROCESSING">PROCESSING</option>
                        <option value="PACKED">PACKED</option>
                        <option value="SHIPPED">SHIPPED</option>
                        <option value="DELIVERED">DELIVERED</option>
                        <option value="CANCELLED">CANCELLED</option>
                      </select>

                      {ord.courier && (
                        <span className="text-[10px] text-slate-400 block mt-1 font-mono">
                          {ord.courier.carrierName}: {ord.courier.trackingNumber}
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-6 text-right">
                      <Link
                        href={`/admin/orders/${ord.id}`}
                        className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors inline-block"
                        title="View Full Packing Slip"
                      >
                        <Eye className="w-4 h-4" />
                      </Link>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    No orders found matching the filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Courier Tracking Dispatch Modal */}
      {selectedOrderForShipping && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-950 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-md w-full space-y-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-2 text-blue-400">
                <Truck className="w-5 h-5" />
                <h3 className="text-base font-bold text-white uppercase tracking-wider">
                  Courier Dispatch Details
                </h3>
              </div>
              <button
                onClick={() => setSelectedOrderForShipping(null)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmShipping} className="space-y-4 text-xs">
              <p className="text-slate-400">
                Assign a tracking number for{" "}
                <span className="text-white font-bold">{selectedOrderForShipping.orderNumber}</span>:
              </p>

              <div className="space-y-1.5">
                <label className="font-semibold text-slate-300">Courier Partner</label>
                <select
                  value={carrierName}
                  onChange={(e) => setCarrierName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-white focus:border-amber-400 focus:outline-none"
                >
                  <option value="Delhivery">Delhivery Air / Surface</option>
                  <option value="BlueDart">Blue Dart Express</option>
                  <option value="DTDC">DTDC Courier</option>
                  <option value="Shiprocket">Shiprocket Automated</option>
                  <option value="IndiaPost">India Post Speed Post</option>
                  <option value="LocalCourier">In-House Local Delivery</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-slate-300">AWB / Tracking Number *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. DEL-829103991"
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-white focus:border-amber-400 focus:outline-none font-mono"
                />
              </div>

              <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedOrderForShipping(null)}
                  className="px-4 py-2 text-slate-400 hover:text-white cursor-pointer font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold uppercase tracking-wider rounded-xl transition-all shadow-md cursor-pointer"
                >
                  Confirm & Dispatch
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
