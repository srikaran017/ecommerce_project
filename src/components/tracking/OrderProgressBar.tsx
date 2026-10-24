"use client";

import React from "react";
import { Check, Clock, Truck, Package, ShieldCheck, Home, AlertCircle, Ban } from "lucide-react";
import { OrderTrackingInfo, TrackingStep } from "@/types/tracking.types";

interface OrderProgressBarProps {
  tracking: OrderTrackingInfo;
  className?: string;
  compact?: boolean;
}

export function OrderProgressBar({
  tracking,
  className = "",
  compact = false,
}: OrderProgressBarProps) {
  if (!tracking) return null;

  // Handle Order Cancellation Special State
  if (tracking.isCancelled) {
    return (
      <div className={`p-5 rounded-2xl bg-rose-50/90 border border-rose-200 text-rose-900 space-y-2 ${className}`}>
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-rose-100 flex items-center justify-center text-rose-600 shrink-0">
            <Ban className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-sm font-bold tracking-tight text-rose-950">Order Cancelled</h4>
            <p className="text-xs text-rose-700">
              {tracking.cancelledAt
                ? `Cancelled on ${new Date(tracking.cancelledAt).toLocaleString("en-IN", {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })}`
                : "This order was cancelled."}
            </p>
          </div>
        </div>
        {tracking.cancelReason && (
          <div className="pl-10 text-xs text-rose-800 bg-rose-100/60 p-2.5 rounded-xl border border-rose-200/60">
            <span className="font-semibold">Reason:</span> {tracking.cancelReason}
          </div>
        )}
      </div>
    );
  }

  // Handle Return / Refund Special State
  if (tracking.isReturn) {
    return (
      <div className={`p-5 rounded-2xl bg-amber-50/90 border border-amber-200 text-amber-950 space-y-2 ${className}`}>
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-amber-700 shrink-0">
            <AlertCircle className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-sm font-bold tracking-tight text-amber-950">Return / Refund In Progress</h4>
            <p className="text-xs text-amber-700">
              Current Status: <span className="font-semibold">{tracking.statusLabel || tracking.status}</span>
            </p>
          </div>
        </div>
      </div>
    );
  }

  const steps = tracking.steps || [];

  const getStepIcon = (key: string, stepNumber: number, isCompleted: boolean) => {
    if (isCompleted) {
      return <Check className="w-4 h-4 stroke-[2.5]" />;
    }
    switch (key) {
      case "ORDER_PLACED":
        return <Package className="w-3.5 h-3.5" />;
      case "ORDER_CONFIRMED":
        return <ShieldCheck className="w-3.5 h-3.5" />;
      case "SHIPPED":
        return <Truck className="w-3.5 h-3.5" />;
      case "OUT_FOR_DELIVERY":
        return <Clock className="w-3.5 h-3.5" />;
      case "DELIVERED":
        return <Home className="w-3.5 h-3.5" />;
      default:
        return <span>{stepNumber}</span>;
    }
  };

  return (
    <div className={`w-full ${className}`}>
      {/* Desktop / Tablet Stepper */}
      <div className="hidden sm:block">
        <div className="flex items-start justify-between w-full relative">
          {steps.map((step, idx) => {
            const isCompleted = step.isCompleted;
            const isCurrent = step.isCurrent;
            const hasTimestamp = Boolean(step.timestamp);

            return (
              <div
                key={step.step}
                className="flex flex-col items-center flex-1 relative px-1 group"
              >
                {/* Connector Line (Left side of node for idx > 0) */}
                {idx > 0 && (
                  <div
                    className={`absolute top-4 -left-1/2 w-full h-[2.5px] -z-0 transition-all duration-500 ${
                      isCompleted ? "bg-emerald-600" : "bg-neutral-200"
                    }`}
                  />
                )}

                {/* Step Circle / Badge */}
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs z-10 transition-all duration-300 shadow-xs ${
                    isCompleted
                      ? "bg-emerald-600 text-white ring-4 ring-emerald-50 shadow-emerald-200"
                      : isCurrent
                      ? "bg-amber-600 text-white ring-4 ring-amber-100 shadow-amber-200 animate-pulse scale-105"
                      : "bg-white text-neutral-400 border-2 border-neutral-200"
                  }`}
                  title={step.title}
                >
                  {getStepIcon(step.key, step.step, isCompleted)}
                </div>

                {/* Step Label & Meta */}
                <div className="text-center mt-3 space-y-0.5 max-w-[130px]">
                  <p
                    className={`text-xs font-semibold leading-tight transition-colors ${
                      isCurrent
                        ? "text-amber-900 font-bold"
                        : isCompleted
                        ? "text-neutral-900"
                        : "text-neutral-400"
                    }`}
                  >
                    {step.title}
                  </p>

                  {isCurrent && (
                    <span className="inline-block px-1.5 py-0.2 text-[9px] font-bold uppercase tracking-wider bg-amber-100 text-amber-800 rounded-full">
                      Live
                    </span>
                  )}

                  {hasTimestamp && (
                    <p className="text-[10px] text-neutral-500 font-medium">
                      {new Date(step.timestamp!).toLocaleDateString("en-IN", {
                        month: "short",
                        day: "numeric",
                      })}
                    </p>
                  )}

                  {!compact && (
                    <p className="text-[10px] text-neutral-400 line-clamp-2 leading-tight hidden lg:block pt-0.5">
                      {step.description}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Mobile Vertical Stepper */}
      <div className="sm:hidden relative pl-6 space-y-5">
        {/* Continuous connector line behind nodes */}
        <div className="absolute left-[11px] top-3 bottom-3 w-0.5 bg-neutral-200" />

        {steps.map((step) => {
          const isCompleted = step.isCompleted;
          const isCurrent = step.isCurrent;

          return (
            <div key={step.step} className="relative flex items-start gap-3.5">
              {/* Node */}
              <div
                className={`absolute -left-6 top-0 w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold z-10 transition-all ${
                  isCompleted
                    ? "bg-emerald-600 text-white ring-3 ring-emerald-50"
                    : isCurrent
                    ? "bg-amber-600 text-white ring-3 ring-amber-100 animate-pulse"
                    : "bg-white text-neutral-400 border border-neutral-300"
                }`}
              >
                {isCompleted ? <Check className="w-3.5 h-3.5 stroke-[2.5]" /> : step.step}
              </div>

              {/* Content */}
              <div className="space-y-0.5 flex-1 pb-1">
                <div className="flex items-center justify-between gap-2">
                  <span
                    className={`text-xs font-bold ${
                      isCurrent
                        ? "text-amber-900 font-extrabold"
                        : isCompleted
                        ? "text-neutral-900"
                        : "text-neutral-400"
                    }`}
                  >
                    {step.title}
                  </span>
                  {step.timestamp && (
                    <span className="text-[10px] text-neutral-400 font-mono">
                      {new Date(step.timestamp).toLocaleDateString("en-IN", {
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-neutral-500 leading-snug">
                  {step.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
