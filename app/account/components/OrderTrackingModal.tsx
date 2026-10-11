"use client";

import React, { useState } from "react";
import { AdminOrder } from "@/types/admin.types";
import { CustomerService, OrderTrackingDetails } from "@/services/customer.service";
import { storeConfig } from "@/config/store.config";
import {
  X,
  Truck,
  CheckCircle2,
  Clock,
  Package,
  MapPin,
  Copy,
  Check,
  ExternalLink,
  ShieldCheck,
  FileText,
  Sparkles,
} from "lucide-react";

interface OrderTrackingModalProps {
  order: AdminOrder;
  onClose: () => void;
  onShowToast: (msg: string) => void;
}

export function OrderTrackingModal({ order, onClose, onShowToast }: OrderTrackingModalProps) {
  const [copied, setCopied] = useState(false);
  const [showInvoice, setShowInvoice] = useState(false);
  const tracking: OrderTrackingDetails = CustomerService.getOrderTrackingDetails(order);

  const handleCopyAwb = () => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(tracking.trackingNumber);
      setCopied(true);
      onShowToast(`Tracking AWB ${tracking.trackingNumber} copied to clipboard!`);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const formattedTotal = `${storeConfig.currency.symbol}${Number(
    order.totalAmount ?? order.total ?? 0
  ).toLocaleString()}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-950/70 backdrop-blur-sm animate-fade-in">
      <div
        className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-neutral-100 flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-6 sm:p-7 border-b border-neutral-100 flex items-center justify-between sticky top-0 bg-white/95 backdrop-blur-md z-10">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-widest text-amber-800 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
                White-Glove Courier Tracking
              </span>
              <span
                className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                  order.status === "DELIVERED"
                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                    : order.status === "CANCELLED"
                    ? "bg-rose-50 text-rose-700 border border-rose-200"
                    : "bg-neutral-900 text-white"
                }`}
              >
                {order.status || "CONFIRMED"}
              </span>
            </div>
            <h2 className="font-heading text-lg sm:text-xl font-bold tracking-tight text-neutral-900">
              Order {tracking.orderNumber}
            </h2>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-neutral-100 text-neutral-400 hover:text-neutral-700 transition-colors"
            aria-label="Close tracking modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 sm:p-7 space-y-6">
          {/* Estimated Delivery Banner */}
          <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-amber-50/80 via-amber-100/40 to-neutral-50 border border-amber-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-amber-600 text-white flex items-center justify-center flex-shrink-0 shadow-sm">
                <Truck className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-amber-800">
                  {order.status === "DELIVERED" ? "Delivered On" : "Estimated White-Glove Delivery"}
                </p>
                <p className="text-sm font-bold text-neutral-900 mt-0.5">
                  {tracking.estimatedDeliveryDate}
                </p>
                <p className="text-xs text-neutral-500 mt-0.5">
                  Handled by <span className="font-semibold text-neutral-800">{tracking.carrierName}</span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto">
              <div className="bg-white px-3 py-1.5 rounded-xl border border-neutral-200 text-xs font-mono text-neutral-800 flex items-center gap-2 shadow-xs">
                <span>{tracking.trackingNumber}</span>
                <button
                  onClick={handleCopyAwb}
                  className="hover:text-amber-700 transition-colors p-1"
                  title="Copy Tracking ID"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          </div>

          {/* Stepper Progress Timeline */}
          <div className="space-y-3 bg-neutral-50/70 p-5 rounded-2xl border border-neutral-100">
            <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-900 flex items-center gap-2">
              <Clock className="w-3.5 h-3.5 text-amber-700" />
              <span>Fulfillment Milestones</span>
            </h3>

            <div className="relative pl-6 sm:pl-8 space-y-6 pt-2">
              {/* Vertical connector line */}
              <div className="absolute left-2.5 sm:left-3.5 top-3 bottom-3 w-0.5 bg-neutral-200" />

              {tracking.stages.map((stage, idx) => {
                const isPassed = stage.isCompleted;
                const isCurrent = stage.isCurrent;

                return (
                  <div key={stage.key} className="relative flex items-start gap-4">
                    {/* Circle Node */}
                    <div
                      className={`absolute -left-6 sm:-left-8 top-0.5 w-6 h-6 rounded-full flex items-center justify-center transition-all ${
                        isPassed
                          ? "bg-emerald-600 text-white ring-4 ring-emerald-50"
                          : isCurrent
                          ? "bg-amber-600 text-white ring-4 ring-amber-100 animate-pulse"
                          : "bg-neutral-200 text-neutral-400"
                      }`}
                    >
                      {isPassed ? (
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      ) : (
                        <span className="w-2 h-2 rounded-full bg-white" />
                      )}
                    </div>

                    <div className="space-y-0.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`text-xs font-bold ${
                            isCurrent
                              ? "text-amber-900 font-extrabold"
                              : isPassed
                              ? "text-neutral-900"
                              : "text-neutral-400"
                          }`}
                        >
                          {stage.label}
                        </span>
                        {isCurrent && (
                          <span className="text-[9px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 font-bold">
                            Live Stage
                          </span>
                        )}
                        <span className="text-[10px] text-neutral-400 font-mono">
                          {stage.timestamp}
                        </span>
                      </div>
                      <p className="text-xs text-neutral-500 max-w-md">
                        {stage.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Ordered Garments Recap */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-900 flex items-center gap-2">
              <Package className="w-3.5 h-3.5 text-amber-700" />
              <span>Garments in Shipment</span>
            </h3>

            <div className="divide-y divide-neutral-100 rounded-2xl border border-neutral-100 overflow-hidden bg-white">
              {order.items && order.items.length > 0 ? (
                order.items.map((item: any, i: number) => {
                  const title = item.productName || item.title || "Luxury Garment";
                  const size = item.size || item.variantName || "Bespoke Size";
                  const qty = item.quantity || 1;
                  const price = item.price ? `${storeConfig.currency.symbol}${Number(item.price).toLocaleString()}` : formattedTotal;
                  const img = item.imageUrl || item.image || "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=500";

                  return (
                    <div key={i} className="p-3.5 flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={img}
                          alt={title}
                          className="w-12 h-14 object-cover rounded-xl border border-neutral-100 bg-neutral-50 flex-shrink-0"
                        />
                        <div className="space-y-0.5">
                          <p className="text-xs font-bold text-neutral-900 line-clamp-1">{title}</p>
                          <p className="text-[11px] text-neutral-500 font-mono">
                            Size: <span className="text-neutral-800 font-medium">{size}</span> • Qty: {qty}
                          </p>
                        </div>
                      </div>
                      <span className="text-xs font-bold text-neutral-900 font-mono">{price}</span>
                    </div>
                  );
                })
              ) : (
                <div className="p-4 text-xs text-neutral-500 text-center">
                  Couture Capsule Garments ({formattedTotal})
                </div>
              )}
            </div>
          </div>

          {/* Delivery & Payment Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl border border-neutral-100 bg-neutral-50/50 space-y-1 text-xs">
              <div className="flex items-center gap-1.5 font-bold text-neutral-900 uppercase tracking-wider text-[11px] mb-2">
                <MapPin className="w-3.5 h-3.5 text-amber-700" />
                <span>Delivery Address</span>
              </div>
              <p className="font-bold text-neutral-900">
                {order.customerName || "Valued Client"}
              </p>
              <p className="text-neutral-600">
                {order.customerPhone ? `Contact: ${order.customerPhone}` : "Phone on File"}
              </p>
              <p className="text-neutral-500 text-[11px]">
                {order.customerEmail || "Private Delivery Signature Required"}
              </p>
            </div>

            <div className="p-4 rounded-2xl border border-neutral-100 bg-neutral-50/50 space-y-1 text-xs">
              <div className="flex items-center gap-1.5 font-bold text-neutral-900 uppercase tracking-wider text-[11px] mb-2">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
                <span>Payment & Security</span>
              </div>
              <p className="font-bold text-neutral-900">
                {formattedTotal}
              </p>
              <p className="text-neutral-600">
                Method: <span className="font-semibold uppercase">{order.paymentMethod || "Razorpay / Prepaid"}</span>
              </p>
              <p className="text-emerald-700 font-semibold text-[11px] flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                Verified & Invoiced
              </p>
            </div>
          </div>

          {/* Invoice simulation drawer */}
          {showInvoice && (
            <div className="p-5 rounded-2xl border border-neutral-200 bg-white space-y-3 animate-fade-in shadow-inner">
              <div className="flex items-center justify-between border-b border-neutral-100 pb-2">
                <span className="text-xs font-bold uppercase tracking-widest text-neutral-900">
                  Tax Invoice • Maison De Élégance
                </span>
                <span className="text-[11px] font-mono text-neutral-500">
                  INV-{order.orderNumber || order.id.slice(0, 8)}
                </span>
              </div>
              <div className="text-xs space-y-1 text-neutral-600">
                <p>Client: {order.customerName || "Valued Client"}</p>
                <p>Date: {new Date(order.createdAt || Date.now()).toLocaleDateString("en-IN")}</p>
                <p>GSTIN: 27AABCM8291Q1Z4 (Registered Atelier)</p>
                <div className="pt-2 flex justify-between font-bold text-neutral-900 text-sm border-t border-neutral-100">
                  <span>Grand Total Paid:</span>
                  <span>{formattedTotal}</span>
                </div>
              </div>
              <p className="text-[10px] text-neutral-400 italic">
                Official electronic receipt certified for luxury apparel guarantee & return protocol.
              </p>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-6 border-t border-neutral-100 bg-neutral-50/60 rounded-b-3xl flex flex-col sm:flex-row items-center justify-between gap-3">
          <button
            onClick={() => setShowInvoice(!showInvoice)}
            className="w-full sm:w-auto px-4 py-2.5 bg-white hover:bg-neutral-100 border border-neutral-200 text-neutral-800 text-xs font-bold uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs"
          >
            <FileText className="w-3.5 h-3.5 text-neutral-600" />
            <span>{showInvoice ? "Hide Invoice" : "View Official Invoice"}</span>
          </button>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={() => {
                onShowToast("Connecting to live Atelier concierge...");
                window.open("mailto:concierge@maison-elegance.com?subject=Inquiry for " + tracking.orderNumber, "_blank");
              }}
              className="flex-1 sm:flex-none px-4 py-2.5 bg-neutral-900 hover:bg-amber-600 text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Contact Concierge</span>
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2.5 bg-neutral-200 hover:bg-neutral-300 text-neutral-800 text-xs font-bold uppercase tracking-wider rounded-xl transition-all cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
