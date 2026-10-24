"use client";

import React, { useState } from "react";
import { Truck, Copy, Check, Calendar, ExternalLink, ShieldCheck } from "lucide-react";
import { OrderTrackingInfo } from "@/types/tracking.types";

interface OrderCourierCardProps {
  tracking: OrderTrackingInfo;
  className?: string;
  onCopied?: (awb: string) => void;
}

export function OrderCourierCard({
  tracking,
  className = "",
  onCopied,
}: OrderCourierCardProps) {
  const [copied, setCopied] = useState(false);

  const courierName = tracking.courierPartner || "Express Courier Network";
  const awb = tracking.trackingNumber;
  const estimatedDelivery = tracking.estimatedDelivery;

  const handleCopy = () => {
    if (!awb) return;
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(awb);
      setCopied(true);
      if (onCopied) onCopied(awb);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <div
      className={`rounded-2xl p-5 sm:p-6 bg-gradient-to-br from-amber-50/60 via-white to-amber-50/30 border border-amber-200/80 shadow-xs space-y-4 ${className}`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Courier Partner & Status */}
        <div className="flex items-start gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-amber-600 text-white flex items-center justify-center shrink-0 shadow-xs">
            <Truck className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 bg-amber-100/70 px-2 py-0.5 rounded-full border border-amber-200">
                Logistics Partner
              </span>
              <span className="text-xs font-bold text-neutral-900">
                {courierName}
              </span>
            </div>
            <p className="text-xs text-neutral-600 mt-1">
              {tracking.statusLabel || "Dispatched & In Transit"}
            </p>
          </div>
        </div>

        {/* AWB Tracking Number with Copy */}
        {awb && (
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <div className="bg-white px-3.5 py-2 rounded-xl border border-neutral-200 shadow-2xs flex items-center gap-2.5">
              <div className="text-left">
                <span className="block text-[9px] font-bold uppercase tracking-widest text-neutral-400">
                  AWB Tracking ID
                </span>
                <span className="font-mono text-xs font-bold text-neutral-900 tracking-wider">
                  {awb}
                </span>
              </div>
              <button
                type="button"
                onClick={handleCopy}
                className="p-1.5 hover:bg-neutral-100 text-neutral-600 hover:text-neutral-900 rounded-lg transition-colors cursor-pointer"
                title="Copy tracking number"
                aria-label="Copy AWB Tracking ID"
              >
                {copied ? (
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Delivery Schedule Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-amber-100/80">
        {estimatedDelivery && (
          <div className="flex items-center gap-2.5 bg-white/70 p-3 rounded-xl border border-amber-100">
            <Calendar className="w-4 h-4 text-amber-700 shrink-0" />
            <div>
              <span className="block text-[10px] font-bold uppercase tracking-wider text-neutral-500">
                {tracking.isDelivered ? "Delivered On" : "Estimated Arrival"}
              </span>
              <span className="text-xs font-bold text-neutral-900">
                {new Date(estimatedDelivery).toLocaleDateString("en-IN", {
                  weekday: "short",
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </span>
            </div>
          </div>
        )}

        <div className="flex items-center gap-2.5 bg-white/70 p-3 rounded-xl border border-amber-100">
          <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
          <div>
            <span className="block text-[10px] font-bold uppercase tracking-wider text-neutral-500">
              White-Glove Garment Protection
            </span>
            <span className="text-xs font-semibold text-neutral-800">
              Tamper-Evident Atelier Seal
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
