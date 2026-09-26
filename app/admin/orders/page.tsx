"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ShoppingBag, Eye, Search, SlidersHorizontal, CheckCircle2, Truck, FileText, ArrowRight } from "lucide-react";
import { storeConfig } from "@/config/store.config";

export interface AdminOrder {
  id: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  items: Array<{ title: string; size: string; color: string; quantity: number; price: number }>;
  subtotal: number;
  discount: number;
  shipping: number;
  total: number;
  status: "PENDING" | "CONFIRMED" | "PROCESSING" | "PACKED" | "SHIPPED" | "DELIVERED" | "CANCELLED";
  paymentMethod: "RAZORPAY" | "COD" | "STRIPE";
  paymentStatus: "COMPLETED" | "PENDING" | "FAILED";
  shippingAddress: string;
  date: string;
}

export const SAMPLE_ADMIN_ORDERS: AdminOrder[] = [
  {
    id: "ord_1",
    orderNumber: "ORD-98231",
    customerName: "Aarav Sharma",
    customerEmail: "aarav@example.com",
    customerPhone: "+91 98765 00002",
    items: [
      { title: "Mulberry Silk Draped Evening Gown", size: "M", color: "Emerald Green", quantity: 1, price: 18999 }
    ],
    subtotal: 18999,
    discount: 0,
    shipping: 0,
    total: 18999,
    status: "CONFIRMED",
    paymentMethod: "RAZORPAY",
    paymentStatus: "COMPLETED",
    shippingAddress: "102, Skyline Residency, Bandra West, Mumbai, Maharashtra - 400050",
    date: "Today, 2:15 PM",
  },
  {
    id: "ord_2",
    orderNumber: "ORD-98230",
    customerName: "Priya Sengupta",
    customerEmail: "priya@example.com",
    customerPhone: "+91 98765 00003",
    items: [
      { title: "Handcrafted Banarasi Raw Silk Saree", size: "Free Size", color: "Royal Magenta", quantity: 1, price: 28999 }
    ],
    subtotal: 28999,
    discount: 2899,
    shipping: 0,
    total: 26100,
    status: "SHIPPED",
    paymentMethod: "RAZORPAY",
    paymentStatus: "COMPLETED",
    shippingAddress: "45, Park Street, Kolkata, West Bengal - 700016",
    date: "Today, 11:40 AM",
  },
  {
    id: "ord_3",
    orderNumber: "ORD-98229",
    customerName: "Rohan Varma",
    customerEmail: "rohan@example.com",
    customerPhone: "+91 98765 00004",
    items: [
      { title: "Structured Belgian Linen Shirt", size: "L", color: "Crisp Ivory", quantity: 1, price: 4999 }
    ],
    subtotal: 4999,
    discount: 0,
    shipping: 0,
    total: 4999,
    status: "DELIVERED",
    paymentMethod: "COD",
    paymentStatus: "COMPLETED",
    shippingAddress: "78, Koregaon Park, Pune, Maharashtra - 411001",
    date: "Yesterday",
  },
  {
    id: "ord_4",
    orderNumber: "ORD-98228",
    customerName: "Meera Kapoor",
    customerEmail: "meera@example.com",
    customerPhone: "+91 98765 00005",
    items: [
      { title: "Double-Breasted Italian Wool Blazer", size: "40R", color: "Charcoal Slate", quantity: 1, price: 24999 }
    ],
    subtotal: 24999,
    discount: 1000,
    shipping: 0,
    total: 23999,
    status: "PROCESSING",
    paymentMethod: "RAZORPAY",
    paymentStatus: "COMPLETED",
    shippingAddress: "12, Golf Links, New Delhi - 110003",
    date: "Yesterday",
  },
];

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<AdminOrder[]>(SAMPLE_ADMIN_ORDERS);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const filteredOrders = orders.filter((ord) => {
    const matchesSearch =
      ord.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ord.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ord.customerEmail.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;
    if (statusFilter !== "ALL" && ord.status !== statusFilter) return false;

    return true;
  });

  const handleStatusChange = (orderId: string, newStatus: any) => {
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
    );
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-16">
      
      {/* Header */}
      <div className="border-b border-slate-800 pb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight flex items-center gap-3">
          <ShoppingBag className="w-6 h-6 text-amber-400" />
          <span>Customer Orders & Delivery Lifecycle</span>
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Monitor order status, initiate packing, generate courier waybills, and trigger notifications.
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-950 p-4 rounded-lg border border-slate-800 text-xs">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by order #, client name, or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-900 text-white border border-slate-700 rounded-md focus:border-amber-400 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-slate-900 text-white border border-slate-700 rounded-md font-semibold uppercase focus:border-amber-400 focus:outline-none"
          >
            <option value="ALL">All Statuses ({orders.length})</option>
            <option value="CONFIRMED">Confirmed</option>
            <option value="PROCESSING">Processing</option>
            <option value="SHIPPED">Shipped</option>
            <option value="DELIVERED">Delivered</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-slate-950 border border-slate-800 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 bg-slate-900/50">
                <th className="py-3.5 px-6 font-semibold">Order</th>
                <th className="py-3.5 px-6 font-semibold">Customer</th>
                <th className="py-3.5 px-6 font-semibold">Items</th>
                <th className="py-3.5 px-6 font-semibold">Total Amount</th>
                <th className="py-3.5 px-6 font-semibold">Payment Gateway</th>
                <th className="py-3.5 px-6 font-semibold">Fulfillment Lifecycle</th>
                <th className="py-3.5 px-6 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-300">
              {filteredOrders.map((ord) => (
                <tr key={ord.id} className="hover:bg-slate-900/40 transition-colors">
                  <td className="py-4 px-6">
                    <Link
                      href={`/admin/orders/${ord.id}`}
                      className="font-mono font-bold text-amber-300 hover:underline flex items-center gap-1"
                    >
                      <span>{ord.orderNumber}</span>
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                    <span className="text-[10px] text-slate-500 block">{ord.date}</span>
                  </td>
                  <td className="py-4 px-6">
                    <div className="font-bold text-white">{ord.customerName}</div>
                    <div className="text-[11px] text-slate-400">{ord.customerPhone}</div>
                  </td>
                  <td className="py-4 px-6 text-slate-300 max-w-xs truncate">
                    {ord.items.map((i) => `${i.title} (${i.size})`).join(", ")}
                  </td>
                  <td className="py-4 px-6 font-bold text-white">
                    {storeConfig.currency.symbol}{ord.total.toLocaleString()}
                  </td>
                  <td className="py-4 px-6">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-900 text-slate-200 border border-slate-700">
                      {ord.paymentMethod} • {ord.paymentStatus}
                    </span>
                  </td>
                  <td className="py-4 px-6">
                    <select
                      value={ord.status}
                      onChange={(e) => handleStatusChange(ord.id, e.target.value)}
                      className={`rounded px-2.5 py-1 text-xs font-semibold focus:outline-none border ${
                        ord.status === "DELIVERED"
                          ? "bg-emerald-950 text-emerald-300 border-emerald-800"
                          : ord.status === "SHIPPED"
                          ? "bg-blue-950 text-blue-300 border-blue-800"
                          : ord.status === "CANCELLED"
                          ? "bg-red-950 text-red-300 border-red-800"
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
                  </td>
                  <td className="py-4 px-6 text-right">
                    <Link
                      href={`/admin/orders/${ord.id}`}
                      className="p-2 hover:bg-slate-800 rounded text-slate-400 hover:text-white transition-colors inline-block"
                      title="View Order Details & Print Invoice"
                    >
                      <Eye className="w-4 h-4" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
