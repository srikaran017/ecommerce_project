import React from "react";
import Link from "next/link";
import { CheckCircle2, MessageSquare, Package, ArrowRight, Truck } from "lucide-react";
import { storeConfig } from "@/config/store.config";
import { featureConfig } from "@/config/feature.config";
import { Button } from "@/components/ui/Button";

interface OrderSuccessPageProps {
  params: Promise<{ orderId: string }>;
  searchParams: Promise<{
    method?: string;
    amount?: string;
    email?: string;
    phone?: string;
  }>;
}

export default async function OrderSuccessPage({
  params,
  searchParams,
}: OrderSuccessPageProps) {
  const { orderId } = await params;
  const { method, amount, email, phone } = await searchParams;

  const total = amount ? Number(amount) : 18999;
  const customerEmail = email || "customer@example.com";
  const customerPhone = phone || "+91 98765 43210";

  return (
    <div className="py-16 bg-[var(--background)] min-h-screen">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Main Confirmation Card */}
        <div className="bg-[var(--background)] border border-[var(--border)] rounded-[var(--radius)] p-8 sm:p-12 text-center space-y-6 shadow-xl">
          
          <div className="inline-flex p-4 rounded-full bg-emerald-50 text-emerald-600 mb-2 border border-emerald-200">
            <CheckCircle2 className="w-12 h-12" />
          </div>

          <div className="space-y-2">
            <span className="text-[11px] font-bold uppercase tracking-[0.3em] text-[var(--secondary)]">
              ORDER CONFIRMED
            </span>
            <h1 className="font-heading text-3xl sm:text-4xl font-bold uppercase tracking-tight text-[var(--foreground)]">
              THANK YOU FOR YOUR ORDER
            </h1>
            <p className="text-sm text-[var(--muted-foreground)]">
              An electronic invoice and receipt has been sent to{" "}
              <strong className="text-[var(--foreground)]">{customerEmail}</strong>.
            </p>
          </div>

          {/* Order Details Chip */}
          <div className="bg-[var(--muted)] p-4 rounded-[var(--radius)] border border-[var(--border)] inline-block text-left text-xs space-y-1">
            <p>
              <strong>Order ID:</strong> #{orderId}
            </p>
            <p>
              <strong>Payment Status:</strong>{" "}
              {method === "cod" ? "Pending (Cash On Delivery)" : "Completed (Online Payment)"}
            </p>
            <p>
              <strong>Total Amount:</strong> {storeConfig.currency.symbol}
              {total.toLocaleString()}
            </p>
          </div>

          {/* Order Lifecycle Progress */}
          {featureConfig.orderTracking && (
            <div className="pt-6 border-t border-[var(--border)] space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--foreground)]">
                DELIVERY LIFECYCLE
              </h3>
              <div className="grid grid-cols-4 gap-2 text-center text-[10px] font-bold uppercase tracking-wider">
                <div className="p-3 bg-emerald-50 text-emerald-800 rounded-[var(--radius)] border border-emerald-200">
                  1. Confirmed
                </div>
                <div className="p-3 bg-[var(--muted)] text-[var(--muted-foreground)] rounded-[var(--radius)] border border-[var(--border)]">
                  2. Tailoring / Packing
                </div>
                <div className="p-3 bg-[var(--muted)] text-[var(--muted-foreground)] rounded-[var(--radius)] border border-[var(--border)]">
                  3. In Transit
                </div>
                <div className="p-3 bg-[var(--muted)] text-[var(--muted-foreground)] rounded-[var(--radius)] border border-[var(--border)]">
                  4. Delivered
                </div>
              </div>
            </div>
          )}

          {/* WhatsApp Concierge Dispatch (Respecting feature flag) */}
          {featureConfig.whatsapp && (
            <div className="pt-6 border-t border-[var(--border)] flex flex-col sm:flex-row items-center justify-between gap-4 p-4 bg-emerald-50 text-emerald-950 rounded-[var(--radius)] border border-emerald-200 text-left">
              <div className="space-y-1">
                <h4 className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 text-emerald-900">
                  <MessageSquare className="w-4 h-4 text-emerald-700" />
                  <span>WhatsApp Order Tracking Active</span>
                </h4>
                <p className="text-[11px] text-emerald-800">
                  Live dispatch updates will be sent to {customerPhone}.
                </p>
              </div>
              <a
                href={`https://wa.me/${storeConfig.contact.whatsapp.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(
                  `Hello ${storeConfig.name}, I am inquiring about my Order #${orderId}`
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
          <div className="pt-6 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/products">
              <Button variant="primary" size="md" rightIcon={<ArrowRight className="w-4 h-4" />}>
                CONTINUE SHOPPING
              </Button>
            </Link>
          </div>

        </div>

      </div>
    </div>
  );
}
