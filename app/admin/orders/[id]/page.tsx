"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
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
} from "lucide-react";
import { storeConfig } from "@/config/store.config";
import { SAMPLE_ADMIN_ORDERS } from "../page";
import { AdminOrder, AdminOrderItem } from "@/types/admin.types";
import { Button } from "@/components/ui/Button";

export default function OrderDetailsPage() {
  const params = useParams();
  const orderId = params.id as string;

  const initialOrder =
    SAMPLE_ADMIN_ORDERS.find((o) => o.id === orderId || o.orderNumber === orderId) ||
    SAMPLE_ADMIN_ORDERS[0];

  const [order, setOrder] = useState<AdminOrder>(initialOrder);
  const [isInvoiceOpen, setIsInvoiceOpen] = useState(false);
  const [trackingNumber, setTrackingNumber] = useState("BLUEDART-89218921");
  const [courier, setCourier] = useState("BlueDart Express");

  const handleStatusChange = (newStatus: any) => {
    setOrder({ ...order, status: newStatus });
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-16">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/orders"
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-md transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-white tracking-tight font-mono">
                {order.orderNumber}
              </h1>
              <span className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                {order.status}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Placed on {order.createdAt || "Recent"} • Paid via {order.paymentMethod}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsInvoiceOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold uppercase tracking-wider rounded-md transition-colors cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Print Tax Invoice</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left 8 Cols: Items, Timeline, Fulfillment Actions */}
        <div className="lg:col-span-8 space-y-8">
          
          {/* Order Items List */}
          <div className="bg-slate-950 border border-slate-800 rounded-lg p-6 space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-white border-b border-slate-800 pb-3 flex items-center gap-2">
              <Package className="w-4 h-4 text-amber-400" />
              <span>Garment Items Ordered ({order.items.reduce((acc: number, i: AdminOrderItem) => acc + i.quantity, 0)})</span>
            </h3>

            <div className="divide-y divide-slate-800">
              {order.items.map((item: AdminOrderItem, idx: number) => (
                <div key={idx} className="py-4 flex items-center justify-between gap-4">
                  <div>
                    <h4 className="font-bold text-white text-xs uppercase">{item.title}</h4>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Size: <strong className="text-slate-200">{item.size}</strong> • Color:{" "}
                      <strong className="text-slate-200">{item.color}</strong> • Qty: {item.quantity}
                    </p>
                  </div>
                  <span className="font-bold text-white text-xs">
                    {storeConfig.currency.symbol}{(item.price * item.quantity).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>

            {/* Financial Totals */}
            <div className="pt-4 border-t border-slate-800 space-y-2 text-xs">
              <div className="flex justify-between text-slate-400">
                <span>Subtotal</span>
                <span>{storeConfig.currency.symbol}{order.subtotal.toLocaleString()}</span>
              </div>
              {order.discount > 0 && (
                <div className="flex justify-between text-emerald-400">
                  <span>Promotional Discount</span>
                  <span>-{storeConfig.currency.symbol}{order.discount.toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between text-slate-400">
                <span>Express Insured Shipping</span>
                <span>{order.shipping === 0 ? "FREE" : `${storeConfig.currency.symbol}${order.shipping}`}</span>
              </div>
              <div className="flex justify-between text-sm font-bold text-white pt-2 border-t border-slate-800">
                <span>Total Paid</span>
                <span>{storeConfig.currency.symbol}{order.total.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Fulfillment Status Transitions */}
          <div className="bg-slate-950 border border-slate-800 rounded-lg p-6 space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-white border-b border-slate-800 pb-3 flex items-center gap-2">
              <Truck className="w-4 h-4 text-amber-400" />
              <span>Fulfillment & Dispatch Actions</span>
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              <button
                onClick={() => handleStatusChange("PROCESSING")}
                className={`py-2 px-3 rounded font-bold uppercase transition-colors ${
                  order.status === "PROCESSING"
                    ? "bg-amber-500 text-slate-950"
                    : "bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-700"
                }`}
              >
                Mark Processing
              </button>
              <button
                onClick={() => handleStatusChange("PACKED")}
                className={`py-2 px-3 rounded font-bold uppercase transition-colors ${
                  order.status === "PACKED"
                    ? "bg-amber-500 text-slate-950"
                    : "bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-700"
                }`}
              >
                Mark Packed
              </button>
              <button
                onClick={() => handleStatusChange("SHIPPED")}
                className={`py-2 px-3 rounded font-bold uppercase transition-colors ${
                  order.status === "SHIPPED"
                    ? "bg-blue-500 text-white"
                    : "bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-700"
                }`}
              >
                Ship Order
              </button>
              <button
                onClick={() => handleStatusChange("DELIVERED")}
                className={`py-2 px-3 rounded font-bold uppercase transition-colors ${
                  order.status === "DELIVERED"
                    ? "bg-emerald-500 text-white"
                    : "bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-700"
                }`}
              >
                Mark Delivered
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs">
              <div>
                <label className="font-bold text-slate-400 uppercase block mb-1">Courier Partner</label>
                <input
                  type="text"
                  value={courier}
                  onChange={(e) => setCourier(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-900 text-white border border-slate-700 rounded text-xs"
                />
              </div>
              <div>
                <label className="font-bold text-slate-400 uppercase block mb-1">Tracking Number / AWB</label>
                <input
                  type="text"
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-900 text-amber-300 font-mono border border-slate-700 rounded text-xs"
                />
              </div>
            </div>
          </div>

        </div>

        {/* Right 4 Cols: Client Information & Address */}
        <div className="lg:col-span-4 space-y-8 text-xs">
          
          {/* Customer Details */}
          <div className="bg-slate-950 border border-slate-800 rounded-lg p-6 space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-white border-b border-slate-800 pb-3">
              Client Information
            </h3>

            <div className="space-y-3">
              <div className="font-bold text-white text-sm">{order.customerName}</div>
              <div className="flex items-center gap-2 text-slate-300">
                <Mail className="w-4 h-4 text-slate-500" />
                <span>{order.customerEmail}</span>
              </div>
              <div className="flex items-center gap-2 text-slate-300">
                <Phone className="w-4 h-4 text-slate-500" />
                <span>{order.customerPhone}</span>
              </div>
            </div>
          </div>

          {/* Shipping Address */}
          <div className="bg-slate-950 border border-slate-800 rounded-lg p-6 space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-white border-b border-slate-800 pb-3 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-amber-400" />
              <span>Delivery Address</span>
            </h3>

            <p className="text-slate-300 leading-relaxed">
              {typeof order.shippingAddress === "object"
                ? `${order.shippingAddress.street}, ${order.shippingAddress.city}, ${order.shippingAddress.state} - ${order.shippingAddress.postalCode}, ${order.shippingAddress.country}`
                : order.shippingAddress}
            </p>
          </div>

          {/* Payment Status */}
          <div className="bg-slate-950 border border-slate-800 rounded-lg p-6 space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-white border-b border-slate-800 pb-3 flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-amber-400" />
              <span>Payment Details</span>
            </h3>

            <div className="space-y-2">
              <div className="flex justify-between text-slate-400">
                <span>Method</span>
                <span className="font-bold text-white">{order.paymentMethod}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Status</span>
                <span className="font-bold text-emerald-400">{order.paymentStatus}</span>
              </div>
            </div>
          </div>

        </div>

      </div>

      {/* Printable Tax Invoice Modal */}
      {isInvoiceOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white text-black p-8 sm:p-12 rounded-lg max-w-2xl w-full shadow-2xl space-y-6 print:m-0 print:p-0 print:shadow-none">
            
            {/* Modal Controls (Hidden during print) */}
            <div className="flex items-center justify-between border-b pb-4 print:hidden">
              <span className="text-xs font-bold uppercase tracking-wider text-gray-500">
                Official Electronic Tax Invoice
              </span>
              <div className="flex items-center gap-3">
                <button
                  onClick={handlePrint}
                  className="px-4 py-1.5 bg-black text-white text-xs font-bold uppercase rounded flex items-center gap-1.5 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print</span>
                </button>
                <button
                  onClick={() => setIsInvoiceOpen(false)}
                  className="text-gray-500 hover:text-black cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Printable Invoice Document */}
            <div className="space-y-6 text-xs">
              
              {/* Brand & Invoice Heading */}
              <div className="flex items-start justify-between border-b pb-6">
                <div>
                  <h2 className="text-xl font-bold font-serif tracking-wider uppercase">
                    {storeConfig.name}
                  </h2>
                  <p className="text-gray-600 mt-1">{storeConfig.contact.address.street}</p>
                  <p className="text-gray-600">{storeConfig.contact.address.city}, {storeConfig.contact.address.state} - {storeConfig.contact.address.postalCode}</p>
                  <p className="text-gray-600 font-mono">GSTIN: 27AABCM8921R1Z8</p>
                </div>
                <div className="text-right">
                  <h3 className="text-lg font-bold uppercase">TAX INVOICE</h3>
                  <p className="font-mono font-bold mt-1">{order.orderNumber}</p>
                  <p className="text-gray-500">Date: {order.createdAt || "Today"}</p>
                </div>
              </div>

              {/* Billed To */}
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
                      <td className="py-2.5 text-gray-600">{item.size} / {item.color}</td>
                      <td className="py-2.5 text-center">{item.quantity}</td>
                      <td className="py-2.5 text-right">{storeConfig.currency.symbol}{item.price.toLocaleString()}</td>
                      <td className="py-2.5 text-right font-bold">{storeConfig.currency.symbol}{(item.price * item.quantity).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Subtotals */}
              <div className="border-t pt-4 space-y-1.5 text-right">
                <p className="text-gray-600">Subtotal: {storeConfig.currency.symbol}{order.subtotal.toLocaleString()}</p>
                {order.discount > 0 && (
                  <p className="text-emerald-700 font-semibold">Discount Applied: -{storeConfig.currency.symbol}{order.discount.toLocaleString()}</p>
                )}
                <p className="text-gray-600">GST (12% Included): {storeConfig.currency.symbol}{Math.round((order.total * 12) / 112).toLocaleString()}</p>
                <p className="text-gray-600">Shipping: {order.shipping === 0 ? "FREE" : `${storeConfig.currency.symbol}${order.shipping}`}</p>
                <p className="text-base font-bold text-black pt-2 border-t">
                  Grand Total Paid: {storeConfig.currency.symbol}{order.total.toLocaleString()}
                </p>
              </div>

              <div className="pt-4 border-t text-center text-gray-500 text-[10px]">
                Thank you for choosing {storeConfig.name}. For questions or bespoke tailoring, contact {storeConfig.contact.email}.
              </div>

            </div>

          </div>
        </div>
      )}

    </div>
  );
}
