"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/auth.store";
import { CheckoutService } from "@/services/checkout.service";
import { OrderConfirmationData } from "@/types/checkout.types";
import { storeConfig } from "@/config/store.config";
import {
  CheckCircle2,
  Clock,
  ArrowRight,
  Package,
  ShoppingBag,
  Gift,
  FileText,
  PhoneCall,
  AlertCircle,
  Truck,
} from "lucide-react";
import { Button } from "@/components/ui/Button";

export default function OrderConfirmationPage() {
  const params = useParams();
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();

  const orderNumber = (params?.orderNumber as string) || "";
  const [confirmation, setConfirmation] = useState<OrderConfirmationData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push(`/login?redirect=/orders/${orderNumber}/confirmation`);
      return;
    }

    if (orderNumber) {
      CheckoutService.getOrderConfirmation(orderNumber)
        .then((res) => {
          if (res.success && res.data) {
            setConfirmation(res.data);
          }
        })
        .catch((err) => {
          console.warn("Failed to load confirmation details:", err);
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  }, [isAuthenticated, orderNumber, router]);

  if (isLoading) {
    return (
      <div className="py-24 text-center min-h-[50vh] flex flex-col items-center justify-center space-y-4">
        <div className="w-8 h-8 rounded-full border-2 border-neutral-300 border-t-neutral-900 animate-spin" />
        <p className="text-xs uppercase tracking-wider text-[var(--muted-foreground)]">
          Generating Confirmation Dossier...
        </p>
      </div>
    );
  }

  if (!confirmation) {
    return (
      <div className="py-24 max-w-xl mx-auto px-4 text-center space-y-4">
        <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
        <h2 className="font-heading text-xl font-bold uppercase tracking-wider text-[var(--foreground)]">
          Order Confirmation Not Found
        </h2>
        <p className="text-xs text-[var(--muted-foreground)]">
          We could not load confirmation details for #{orderNumber}.
        </p>
        <Link href="/orders">
          <Button variant="primary" size="md">
            VIEW ALL ORDERS
          </Button>
        </Link>
      </div>
    );
  }

  const isCod = confirmation.paymentMethod === "COD";
  const totalPayable = Number(
    confirmation.pricing?.totalAmount ?? (confirmation as any).totalAmount ?? (confirmation as any).total ?? 0
  );

  return (
    <div className="py-16 bg-[var(--background)] min-h-screen">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        
        {/* Main Confirmation Hero Card */}
        <div className="bg-[var(--background)] border border-[var(--border)] rounded-[var(--radius)] p-8 sm:p-12 text-center space-y-6 shadow-xl">
          
          <div className="inline-flex p-4 rounded-full bg-emerald-50 text-emerald-600 mb-2 border border-emerald-200">
            {isCod ? (
              <Clock className="w-12 h-12 text-amber-600" />
            ) : (
              <CheckCircle2 className="w-12 h-12 text-emerald-600" />
            )}
          </div>

          <div className="space-y-2">
            <span className="text-[11px] font-bold uppercase tracking-[0.3em] text-[var(--secondary)]">
              {isCod ? "ORDER SUBMITTED • AWAITING ATELIER VERIFICATION" : "ORDER CONFIRMED & SECURED"}
            </span>
            <h1 className="font-heading text-3xl sm:text-4xl font-bold uppercase tracking-tight text-[var(--foreground)]">
              THANK YOU FOR YOUR ORDER
            </h1>
            <p className="text-sm text-[var(--muted-foreground)] max-w-xl mx-auto">
              An electronic tax invoice and confirmation receipt has been dispatched to{" "}
              <strong className="text-[var(--foreground)]">{confirmation.customerEmail}</strong>.
            </p>
          </div>

          {/* Payment Notice Banner */}
          {isCod ? (
            <div className="max-w-xl mx-auto p-4 bg-amber-50 border border-amber-200 rounded-[var(--radius)] text-left flex items-start gap-3">
              <PhoneCall className="w-5 h-5 text-amber-700 flex-shrink-0 mt-0.5" />
              <div className="space-y-1 text-xs text-amber-900">
                <p className="font-bold uppercase tracking-wider">Cash on Delivery Notice</p>
                <p>
                  Payment of <strong>{storeConfig.currency.symbol}{totalPayable.toLocaleString()}</strong> will be collected in cash upon doorstep delivery. Our concierge will contact you at <strong>{confirmation.customerPhone || "your registered number"}</strong> prior to dispatch.
                </p>
              </div>
            </div>
          ) : (
            <div className="max-w-xl mx-auto p-3.5 bg-emerald-50 border border-emerald-200 rounded-[var(--radius)] text-xs text-emerald-900 font-medium">
              Payment of {storeConfig.currency.symbol}{totalPayable.toLocaleString()} completed successfully via Razorpay.
            </div>
          )}

          {/* Summary Chip */}
          <div className="bg-[var(--muted)] p-5 rounded-[var(--radius)] border border-[var(--border)] inline-block text-left text-xs space-y-2 max-w-md w-full">
            <div className="flex justify-between border-b border-[var(--border)] pb-2">
              <span className="text-[var(--muted-foreground)]">Order Identifier:</span>
              <strong className="font-mono text-[var(--foreground)]">#{confirmation.orderNumber}</strong>
            </div>
            <div className="flex justify-between border-b border-[var(--border)] pb-2">
              <span className="text-[var(--muted-foreground)]">Payment Method:</span>
              <span className="font-semibold text-[var(--foreground)]">
                {isCod ? "Cash on Delivery (COD)" : "Online Payment (Razorpay)"}
              </span>
            </div>
            <div className="flex justify-between border-b border-[var(--border)] pb-2">
              <span className="text-[var(--muted-foreground)]">Financial Status:</span>
              <span className={`font-semibold ${isCod ? "text-amber-700" : "text-emerald-700"}`}>
                {isCod ? "Pending Collection" : "Completed & Verified"}
              </span>
            </div>
            <div className="flex justify-between pt-1">
              <span className="text-[var(--muted-foreground)]">Total Payable:</span>
              <strong className="text-sm text-[var(--foreground)] font-mono">
                {storeConfig.currency.symbol}{totalPayable.toLocaleString()}
              </strong>
            </div>
          </div>

          {/* Items Preview */}
          {confirmation.items && confirmation.items.length > 0 && (
            <div className="pt-6 border-t border-[var(--border)] text-left space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--foreground)]">
                ORDERED GARMENTS ({confirmation.items.length})
              </h3>
              <div className="divide-y divide-[var(--border)] border border-[var(--border)] rounded-[var(--radius)] overflow-hidden">
                {confirmation.items.map((it) => (
                  <div key={it.id} className="p-4 flex items-center justify-between gap-4 bg-[var(--background)]">
                    <div className="flex items-center gap-3">
                      {it.imageUrl && (
                        <img
                          src={it.imageUrl}
                          alt={it.title}
                          className="w-12 h-16 object-cover rounded-[var(--radius)] shrink-0"
                        />
                      )}
                      <div>
                        <h4 className="text-xs font-bold uppercase tracking-wide text-[var(--foreground)]">
                          {it.title}
                        </h4>
                        <p className="text-[11px] text-[var(--muted-foreground)]">
                          {it.sku ? `SKU: ${it.sku} • ` : ""}
                          {it.size ? `Size: ${it.size} • ` : ""}
                          Qty: {it.quantity}
                        </p>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-[var(--foreground)] font-mono">
                      {storeConfig.currency.symbol}{Number(it.totalPrice || 0).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action Navigation */}
          <div className="pt-6 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href={`/orders/${confirmation.orderNumber}`}>
              <Button variant="primary" size="md" rightIcon={<ArrowRight className="w-4 h-4" />}>
                VIEW ORDER DETAILS & TRACKING
              </Button>
            </Link>
            <Link href="/products">
              <Button variant="outline" size="md">
                CONTINUE SHOPPING
              </Button>
            </Link>
          </div>

        </div>

      </div>
    </div>
  );
}
