"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import {
  CheckCircle2,
  Clock,
  MessageSquare,
  Package,
  ArrowRight,
  Truck,
  ShieldCheck,
  MapPin,
  PhoneCall,
  AlertCircle,
} from "lucide-react";
import { storeConfig } from "@/config/store.config";
import { featureConfig } from "@/config/feature.config";
import { Button } from "@/components/ui/Button";
import { CheckoutService } from "@/services/checkout.service";
import { OrderConfirmationData } from "@/types/checkout.types";

export default function OrderSuccessPage() {
  const params = useParams();
  const searchParams = useSearchParams();

  const orderId = (params?.orderId as string) || "";
  const queryMethod = searchParams.get("method") || "";
  const queryAmount = searchParams.get("amount") || "";
  const queryEmail = searchParams.get("email") || "";
  const queryPhone = searchParams.get("phone") || "";

  const [confirmation, setConfirmation] = useState<OrderConfirmationData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!orderId) return;

    let isSubscribed = true;
    CheckoutService.getOrderConfirmation(orderId)
      .then((res) => {
        if (isSubscribed && res.success && res.data) {
          setConfirmation(res.data);
        }
      })
      .catch((err) => {
        console.warn("Failed to load order confirmation details:", err);
      })
      .finally(() => {
        if (isSubscribed) setIsLoading(false);
      });

    return () => {
      isSubscribed = false;
    };
  }, [orderId]);

  const isCod = (confirmation?.paymentMethod === "COD") || queryMethod.toLowerCase() === "cod";
  const isUpiQr = (confirmation?.paymentMethod === "UPI_QR") || queryMethod.toLowerCase() === "upi_qr";
  const utrNumber = searchParams.get("utr") || (confirmation as any)?.upiReference || "";
  const customerEmail = confirmation?.customerEmail || queryEmail || "client@maison.com";
  const customerPhone = confirmation?.customerPhone || queryPhone || "+91 98765 43210";
  const totalAmount = confirmation?.pricing.totalAmount ?? (queryAmount ? Number(queryAmount) : 0);

  return (
    <div className="py-16 bg-[var(--background)] min-h-screen">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        
        {/* Main Confirmation Card */}
        <div className="bg-[var(--background)] border border-[var(--border)] rounded-[var(--radius)] p-8 sm:p-12 text-center space-y-6 shadow-xl">
          
          <div className="inline-flex p-4 rounded-full bg-emerald-50 text-emerald-600 mb-2 border border-emerald-200">
            {isCod ? (
              <Clock className="w-12 h-12 text-amber-600" />
            ) : isUpiQr ? (
              <CheckCircle2 className="w-12 h-12 text-amber-500" />
            ) : (
              <CheckCircle2 className="w-12 h-12 text-emerald-600" />
            )}
          </div>

          <div className="space-y-2">
            <span className="text-[11px] font-bold uppercase tracking-[0.3em] text-[var(--secondary)]">
              {isCod
                ? "ORDER SUBMITTED • AWAITING ATELIER APPROVAL"
                : isUpiQr
                ? "ORDER SUBMITTED • AWAITING UPI VERIFICATION"
                : "ORDER CONFIRMED & SECURED"}
            </span>
            <h1 className="font-heading text-3xl sm:text-4xl font-bold uppercase tracking-tight text-[var(--foreground)]">
              {isCod
                ? "THANK YOU FOR YOUR COD ORDER"
                : isUpiQr
                ? "THANK YOU FOR YOUR UPI ORDER"
                : "THANK YOU FOR YOUR PURCHASE"}
            </h1>
            <p className="text-sm text-[var(--muted-foreground)] max-w-xl mx-auto">
              An electronic invoice and purchase receipt has been dispatched to{" "}
              <strong className="text-[var(--foreground)]">{customerEmail}</strong>.
            </p>
          </div>

          {/* COD Notice Banner */}
          {isCod && (
            <div className="max-w-xl mx-auto p-4 bg-amber-50 border border-amber-200 rounded-[var(--radius)] text-left flex items-start gap-3">
              <PhoneCall className="w-5 h-5 text-amber-700 flex-shrink-0 mt-0.5" />
              <div className="space-y-1 text-xs text-amber-900">
                <p className="font-bold uppercase tracking-wider">Cash on Delivery Verification</p>
                <p>
                  Our atelier concierge team will contact you at <strong>{customerPhone}</strong> to verify your delivery address before packaging and dispatch. Please keep cash of {storeConfig.currency.symbol}{totalAmount.toLocaleString()} ready upon delivery.
                </p>
              </div>
            </div>
          )}

          {/* UPI QR Notice Banner */}
          {isUpiQr && (
            <div className="max-w-xl mx-auto p-4 bg-amber-500/10 border border-amber-500/30 rounded-[var(--radius)] text-left flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
              <div className="space-y-1 text-xs text-amber-900 dark:text-amber-200">
                <p className="font-bold uppercase tracking-wider text-amber-800 dark:text-amber-300">
                  Direct UPI Payment Verification Pending
                </p>
                <p>
                  {utrNumber ? (
                    <>
                      Your 12-digit UPI UTR reference <strong>{utrNumber}</strong> has been logged. Our accounts team will verify the bank credit and confirm fulfillment.
                    </>
                  ) : (
                    "Your UPI payment order has been submitted. Our accounts team will verify the payment and confirm fulfillment shortly."
                  )}
                </p>
              </div>
            </div>
          )}

          {/* Order Details Header Chip */}
          <div className="bg-[var(--muted)] p-5 rounded-[var(--radius)] border border-[var(--border)] inline-block text-left text-xs space-y-2 max-w-md w-full">
            <div className="flex justify-between border-b border-[var(--border)] pb-2">
              <span className="text-[var(--muted-foreground)]">Order Reference:</span>
              <strong className="font-mono text-[var(--foreground)]">#{orderId}</strong>
            </div>
            <div className="flex justify-between border-b border-[var(--border)] pb-2">
              <span className="text-[var(--muted-foreground)]">Payment Method:</span>
              <span className="font-semibold text-[var(--foreground)]">
                {isCod
                  ? "Cash on Delivery (COD)"
                  : isUpiQr
                  ? "Direct UPI / Dynamic QR"
                  : "Online Card / UPI (Razorpay)"}
              </span>
            </div>
            {isUpiQr && utrNumber && (
              <div className="flex justify-between border-b border-[var(--border)] pb-2">
                <span className="text-[var(--muted-foreground)]">UPI UTR / Ref:</span>
                <span className="font-mono font-bold text-amber-600 dark:text-amber-400">
                  {utrNumber}
                </span>
              </div>
            )}
            <div className="flex justify-between border-b border-[var(--border)] pb-2">
              <span className="text-[var(--muted-foreground)]">Payment Status:</span>
              <span
                className={`font-semibold ${
                  isCod || isUpiQr ? "text-amber-700 dark:text-amber-400" : "text-emerald-700"
                }`}
              >
                {isCod
                  ? "Pending Doorstep Collection"
                  : isUpiQr
                  ? "Awaiting Admin Verification"
                  : "Completed & Verified"}
              </span>
            </div>
            <div className="flex justify-between pt-1">
              <span className="text-[var(--muted-foreground)]">Authoritative Total:</span>
              <strong className="text-sm text-[var(--foreground)]">
                {storeConfig.currency.symbol}{totalAmount.toLocaleString()}
              </strong>
            </div>
          </div>

          {/* Itemized Order Lines (when available from confirmation model) */}
          {confirmation && confirmation.items && confirmation.items.length > 0 && (
            <div className="pt-6 border-t border-[var(--border)] text-left space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--foreground)]">
                ORDERED GARMENTS ({confirmation.items.length})
              </h3>
              <div className="divide-y divide-[var(--border)] border border-[var(--border)] rounded-[var(--radius)] overflow-hidden">
                {confirmation.items.map((item) => (
                  <div key={item.id} className="p-4 flex items-center justify-between gap-4 bg-[var(--background)]">
                    <div className="flex items-center gap-3">
                      {item.imageUrl && (
                        <img
                          src={item.imageUrl}
                          alt={item.title}
                          className="w-12 h-16 object-cover rounded-[var(--radius)] flex-shrink-0"
                        />
                      )}
                      <div>
                        <h4 className="text-xs font-bold uppercase tracking-wide text-[var(--foreground)]">
                          {item.title}
                        </h4>
                        <p className="text-[11px] text-[var(--muted-foreground)]">
                          {item.sku ? `SKU: ${item.sku} • ` : ""}
                          {item.size ? `Size: ${item.size} • ` : ""}
                          Qty: {item.quantity}
                        </p>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-[var(--foreground)] whitespace-nowrap">
                      {storeConfig.currency.symbol}{item.totalPrice.toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Delivery Lifecycle Progress */}
          {featureConfig.orderTracking && (
            <div className="pt-6 border-t border-[var(--border)] space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--foreground)]">
                ATELIER FULFILLMENT LIFECYCLE
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-[10px] font-bold uppercase tracking-wider">
                <div className="p-3 bg-emerald-50 text-emerald-800 rounded-[var(--radius)] border border-emerald-200">
                  1. Order Placed
                </div>
                <div className={`p-3 rounded-[var(--radius)] border ${isCod ? "bg-amber-50 text-amber-800 border-amber-200" : "bg-[var(--muted)] text-[var(--muted-foreground)] border-[var(--border)]"}`}>
                  2. {isCod ? "Concierge Approval" : "Bespoke Packaging"}
                </div>
                <div className="p-3 bg-[var(--muted)] text-[var(--muted-foreground)] rounded-[var(--radius)] border border-[var(--border)]">
                  3. In Transit
                </div>
                <div className="p-3 bg-[var(--muted)] text-[var(--muted-foreground)] rounded-[var(--radius)] border border-[var(--border)]">
                  4. Doorstep Delivery
                </div>
              </div>
            </div>
          )}

          {/* WhatsApp Concierge Dispatch */}
          {featureConfig.whatsapp && (
            <div className="pt-6 border-t border-[var(--border)] flex flex-col sm:flex-row items-center justify-between gap-4 p-4 bg-emerald-50 text-emerald-950 rounded-[var(--radius)] border border-emerald-200 text-left">
              <div className="space-y-1">
                <h4 className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 text-emerald-900">
                  <MessageSquare className="w-4 h-4 text-emerald-700" />
                  <span>WhatsApp Concierge Dispatch Active</span>
                </h4>
                <p className="text-[11px] text-emerald-800">
                  Live dispatch notifications and courier tracking will be transmitted to {customerPhone}.
                </p>
              </div>
              <a
                href={`https://wa.me/${storeConfig.contact.whatsapp.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(
                  `Hello ${storeConfig.name}, I am inquiring regarding my Order #${orderId}`
                )}`}
                target="_blank"
                rel="noreferrer"
              >
                <Button variant="accent" size="sm" className="whitespace-nowrap">
                  CHAT WITH CONCIERGE
                </Button>
              </a>
            </div>
          )}

          {/* CTA Buttons */}
          <div className="pt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link href={`/orders/${orderId}`}>
              <Button variant="primary" size="md" rightIcon={<ArrowRight className="w-4 h-4" />}>
                TRACK & VIEW ORDER DETAILS
              </Button>
            </Link>
            <Link href={`/orders/${orderId}/confirmation`}>
              <Button variant="outline" size="md">
                VIEW ORDER INVOICE
              </Button>
            </Link>
            <Link href="/products">
              <Button variant="ghost" size="md">
                CONTINUE SHOPPING
              </Button>
            </Link>
          </div>

        </div>

      </div>
    </div>
  );
}
