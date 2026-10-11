"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/auth.store";
import { AdminService } from "@/services/admin.service";
import { AdminOrder } from "@/types/admin.types";
import { OrdersTab } from "../components/OrdersTab";
import { ArrowLeft, Package, CheckCircle2, X } from "lucide-react";

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
      if (!user?.email) {
        setIsLoading(false);
        return;
      }
      try {
        const res = await AdminService.getOrdersList({ search: user.email });
        if (res.data && res.data.length > 0) {
          setOrders(res.data);
        } else {
          const local = AdminService.getLocalOrders();
          const userOrders = local.filter(
            (o) => o.customerEmail?.toLowerCase() === user.email.toLowerCase()
          );
          setOrders(userOrders);
        }
      } catch {
        const local = AdminService.getLocalOrders();
        const userOrders = local.filter(
          (o) => o.customerEmail?.toLowerCase() === user.email.toLowerCase()
        );
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
    <div className="min-h-screen bg-[#fafafa] py-10 sm:py-14">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        
        {/* Toast */}
        {toastMessage && (
          <div className="fixed top-20 right-4 sm:right-8 z-50 max-w-md bg-neutral-900 text-white px-5 py-3.5 rounded-2xl shadow-xl flex items-center justify-between gap-3 animate-fade-in">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <p className="text-xs font-medium">{toastMessage}</p>
            </div>
            <button onClick={() => setToastMessage(null)} className="text-neutral-400 hover:text-white p-1">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Breadcrumb Navigation */}
        <nav className="flex items-center gap-1.5 text-xs text-neutral-500 font-medium">
          <Link href="/" className="hover:text-neutral-900 transition-colors">
            Home
          </Link>
          <span>/</span>
          <Link href="/account" className="hover:text-neutral-900 transition-colors">
            Account Center
          </Link>
          <span>/</span>
          <span className="text-neutral-900 font-semibold">Orders</span>
        </nav>

        {/* Header & Back Link */}
        <div className="space-y-2">
          <Link
            href="/account"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#2b97ba] hover:underline"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Account Center</span>
          </Link>
          <h1 className="text-2xl sm:text-3xl font-bold text-neutral-900 tracking-tight font-sans">
            Orders
          </h1>
          <p className="text-xs text-neutral-500">
            Track, return, cancel, or replace items.
          </p>
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
