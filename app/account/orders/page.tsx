"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/auth.store";
import { AdminService } from "@/services/admin.service";
import { AdminOrder } from "@/types/admin.types";
import { OrdersTab } from "../components/OrdersTab";
import { ArrowLeft, CheckCircle2, X } from "lucide-react";

export default function AccountOrdersPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login?redirect=/account/orders");
      return;
    }

    async function loadOrders() {
      try {
        const { OrderService } = await import("@/services/order.service");
        const res = await OrderService.getCustomerOrders({ limit: 50 });
        if (res.success && res.data && res.data.length > 0) {
          setOrders(res.data as any);
        } else {
          const local = AdminService.getLocalOrders();
          const userOrders = user?.email
            ? local.filter((o) => o.customerEmail?.toLowerCase() === user.email.toLowerCase())
            : local;
          setOrders(userOrders);
        }
      } catch {
        const local = AdminService.getLocalOrders();
        const userOrders = user?.email
          ? local.filter((o) => o.customerEmail?.toLowerCase() === user.email.toLowerCase())
          : local;
        setOrders(userOrders);
      } finally {
        setIsLoading(false);
      }
    }

    loadOrders();
  }, [user, isAuthenticated, router]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 4000);
  };

  return (
    <div className="min-h-screen bg-[var(--background)] py-8 sm:py-12">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        
        {/* Toast */}
        {toastMessage && (
          <div className="fixed top-20 right-4 sm:right-8 z-50 max-w-md bg-neutral-900 text-white px-4 py-3 rounded-xl shadow-lg flex items-center justify-between gap-3 animate-fade-in border border-neutral-700">
            <div className="flex items-center gap-2 text-xs">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <p className="font-medium">{toastMessage}</p>
            </div>
            <button onClick={() => setToastMessage(null)} className="text-neutral-400 hover:text-white p-1 cursor-pointer">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Clean Breadcrumb Navigation */}
        <nav className="flex items-center gap-2 text-xs text-neutral-500 font-medium">
          <Link href="/" className="hover:text-neutral-900 transition-colors">
            Home
          </Link>
          <span className="text-neutral-300">/</span>
          <Link href="/account" className="hover:text-neutral-900 transition-colors">
            Account
          </Link>
          <span className="text-neutral-300">/</span>
          <span className="text-neutral-900 font-semibold">Orders</span>
        </nav>

        {/* Header & Back Link */}
        <div className="space-y-2 border-b border-neutral-200/80 pb-5">
          <Link
            href="/account"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-neutral-600 hover:text-neutral-900 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to account</span>
          </Link>

          <div>
            <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-neutral-900">
              Orders
            </h1>
            <p className="text-xs sm:text-sm text-neutral-500 mt-1">
              Track shipments, review past receipts, and reorder items.
            </p>
          </div>
        </div>

        {/* Orders Tab Component */}
        <OrdersTab
          orders={orders}
          isLoading={isLoading}
          onShowToast={showToast}
        />

      </div>
    </div>
  );
}
