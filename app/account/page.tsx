"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { notFound } from "next/navigation";
import { featureConfig } from "@/config/feature.config";
import { storeConfig } from "@/config/store.config";
import { useAuthStore } from "@/stores/auth.store";
import { User, MapPin, Package, Heart, LogOut, ArrowRight, LogIn, Sparkles, Plus } from "lucide-react";
import { AdminService } from "@/services/admin.service";
import { AdminOrder } from "@/types/admin.types";

export default function AccountPage() {
  const router = useRouter();
  const { user, isAuthenticated, logout } = useAuthStore();

  if (!featureConfig.customerAccounts) {
    notFound();
  }

  const [orders, setOrders] = React.useState<AdminOrder[]>([]);
  const [isLoadingOrders, setIsLoadingOrders] = React.useState(true);
  const [savedAddress, setSavedAddress] = React.useState<any>(null);

  React.useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const raw = localStorage.getItem("customer_saved_address");
        if (raw) setSavedAddress(JSON.parse(raw));
      } catch {}
    }
  }, []);

  React.useEffect(() => {
    async function loadUserOrders() {
      if (!user?.email) {
        setIsLoadingOrders(false);
        return;
      }
      try {
        const res = await AdminService.getOrdersList({ search: user.email });
        if (res.data && res.data.length > 0) {
          setOrders(res.data);
        } else {
          // Check local ledger if email matches
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
        setIsLoadingOrders(false);
      }
    }

    if (isAuthenticated) {
      loadUserOrders();
    }
  }, [user, isAuthenticated]);

  const handleSignOut = async () => {
    await logout();
    router.push("/login");
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-4 py-16">
        <div className="max-w-md w-full text-center bg-white p-8 sm:p-10 rounded-3xl border border-neutral-100 shadow-xl space-y-6">
          <div className="w-14 h-14 bg-amber-50 rounded-full flex items-center justify-center mx-auto text-amber-700">
            <User className="w-6 h-6" />
          </div>

          <div className="space-y-2">
            <h2 className="text-xl font-bold text-neutral-900">Sign In to Your Account</h2>
            <p className="text-xs text-neutral-500">
              Access your personal wardrobe wishlist, past order invoices, and saved delivery addresses.
            </p>
          </div>

          <div className="pt-2 flex flex-col gap-2.5">
            <Link
              href="/login?redirect=/account"
              className="w-full py-3.5 bg-neutral-900 hover:bg-amber-600 text-white font-bold text-xs uppercase tracking-widest rounded-2xl transition-all shadow-md flex items-center justify-center gap-2"
            >
              <LogIn className="w-4 h-4" />
              <span>Sign In</span>
            </Link>

            <Link
              href="/signup?redirect=/account"
              className="w-full py-3.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 font-bold text-xs uppercase tracking-widest rounded-2xl transition-all flex items-center justify-center"
            >
              <span>Create New Account</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const displayName = user?.name || "Valued Client";
  const displayEmail = user?.email || "customer@example.com";
  const displayPhone = user?.phone || "+91 98765 00002";

  return (
    <div className="py-12 bg-neutral-50/60 min-h-screen">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 sm:p-8 rounded-3xl border border-neutral-200/80 shadow-sm">
          <div className="flex items-center gap-4">
            {user?.avatarUrl ? (
              <img
                src={user.avatarUrl}
                alt={displayName}
                className="w-14 h-14 rounded-2xl border border-neutral-200 object-cover"
              />
            ) : (
              <div className="w-14 h-14 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-800 font-bold text-lg border border-amber-200">
                {displayName.charAt(0).toUpperCase()}
              </div>
            )}
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-amber-800 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
                  {user?.role || "CUSTOMER"}
                </span>
                {user?.isActive !== false && (
                  <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full flex items-center gap-1 border border-emerald-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                    Active
                  </span>
                )}
              </div>
              <h1 className="font-heading text-xl sm:text-2xl font-bold uppercase tracking-tight text-neutral-900">
                Welcome, {displayName}
              </h1>
              <p className="text-xs text-neutral-500 mt-0.5">
                {displayEmail}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            {(user?.role === "STORE_ADMIN" || user?.role === "SUPER_ADMIN") && (
              <Link
                href="/admin"
                className="px-4 py-2.5 bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all flex items-center gap-2"
              >
                <span>Admin Console</span>
              </Link>
            )}
            <button
              onClick={handleSignOut}
              className="px-4 py-2.5 bg-neutral-100 hover:bg-rose-50 text-neutral-700 hover:text-rose-600 text-xs font-bold uppercase tracking-wider rounded-xl transition-all flex items-center gap-2 cursor-pointer border border-neutral-200"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
          
          {/* Saved Delivery Addresses (5 cols) */}
          <div className="md:col-span-5 bg-white p-6 sm:p-8 rounded-3xl border border-neutral-200/80 shadow-sm space-y-4">
            <div className="flex items-center gap-2 text-neutral-900 border-b border-neutral-100 pb-3">
              <MapPin className="w-4 h-4 text-amber-700" />
              <h3 className="text-xs font-bold uppercase tracking-wider">
                Default Delivery Address
              </h3>
            </div>

            {savedAddress && savedAddress.street ? (
              <div className="text-xs space-y-1.5 text-neutral-600">
                <p className="font-bold text-neutral-900 text-sm">
                  {savedAddress.firstName ? `${savedAddress.firstName} ${savedAddress.lastName}` : displayName}
                </p>
                <p>{savedAddress.street}</p>
                <p>
                  {savedAddress.city}, {savedAddress.state} - {savedAddress.postalCode}
                </p>
                <p>{savedAddress.country || "India"}</p>
                <p className="pt-2 text-neutral-500 font-mono">
                  Phone: {savedAddress.phone || displayPhone}
                </p>
              </div>
            ) : (
              <div className="py-6 text-center space-y-2">
                <p className="text-xs text-neutral-500">
                  No delivery address saved yet.
                </p>
                <p className="text-[11px] text-neutral-400">
                  Your address will automatically be preserved when placing an order at checkout.
                </p>
                <Link
                  href="/products"
                  className="inline-block mt-2 text-xs font-bold text-amber-800 hover:underline"
                >
                  Shop Collection →
                </Link>
              </div>
            )}
          </div>

          {/* Past Order History (7 cols) */}
          <div className="md:col-span-7 bg-white p-6 sm:p-8 rounded-3xl border border-neutral-200/80 shadow-sm space-y-4">
            <div className="flex items-center gap-2 text-neutral-900 border-b border-neutral-100 pb-3">
              <Package className="w-4 h-4 text-amber-700" />
              <h3 className="text-xs font-bold uppercase tracking-wider">
                Order History & Status
              </h3>
            </div>

            {isLoadingOrders ? (
              <div className="py-12 text-center space-y-2">
                <div className="w-6 h-6 border-2 border-neutral-300 border-t-neutral-900 rounded-full animate-spin mx-auto" />
                <p className="text-xs text-neutral-400">Loading order ledger...</p>
              </div>
            ) : orders.length === 0 ? (
              <div className="py-10 text-center space-y-3">
                <div className="w-10 h-10 rounded-full bg-neutral-100 flex items-center justify-center mx-auto text-neutral-400">
                  <Package className="w-5 h-5" />
                </div>
                <p className="text-xs font-bold uppercase tracking-wider text-neutral-700">
                  No Past Orders Found
                </p>
                <p className="text-xs text-neutral-500 max-w-sm mx-auto">
                  When you acquire bespoke garments, live fulfillment milestones and courier tracking will appear here.
                </p>
                <Link
                  href="/products"
                  className="inline-block pt-2 text-xs font-bold text-amber-800 uppercase tracking-widest hover:underline"
                >
                  Explore Collection →
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {orders.map((ord) => {
                  const itemsSummary =
                    ord.items && ord.items.length > 0
                      ? ord.items
                          .map((i: any) => `${i.productName || i.title || "Garment"} (${i.size || i.variantName || "M"}) x${i.quantity || 1}`)
                          .join(", ")
                      : "Bespoke Couture Garments";

                  const orderDate = ord.createdAt
                    ? new Date(ord.createdAt).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })
                    : "Recently";

                  const formattedTotal = `${storeConfig.currency.symbol}${Number(
                    ord.totalAmount ?? ord.total ?? 0
                  ).toLocaleString()}`;

                  return (
                    <div
                      key={ord.id}
                      className="p-4 rounded-2xl border border-neutral-100 bg-neutral-50/60 flex items-center justify-between gap-4"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-xs text-neutral-900">
                            #{ord.orderNumber || ord.id.slice(0, 10)}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              ord.status === "DELIVERED"
                                ? "bg-emerald-100 text-emerald-800"
                                : ord.status === "CANCELLED"
                                ? "bg-rose-100 text-rose-800"
                                : "bg-neutral-900 text-white"
                            }`}
                          >
                            {ord.status}
                          </span>
                        </div>
                        <p className="text-xs text-neutral-600 font-medium line-clamp-1">
                          {itemsSummary}
                        </p>
                        <span className="text-[10px] text-neutral-400 font-mono block">
                          Ordered {orderDate}
                        </span>
                      </div>

                      <div className="text-right flex-shrink-0">
                        <span className="text-sm font-bold text-neutral-900 block">
                          {formattedTotal}
                        </span>
                        <Link
                          href={`/order-success/${ord.orderNumber || ord.id}?method=${ord.paymentMethod?.toLowerCase() || "cod"}&amount=${ord.totalAmount ?? ord.total ?? 0}&email=${encodeURIComponent(
                            ord.customerEmail || ""
                          )}&phone=${encodeURIComponent(ord.customerPhone || "")}`}
                          className="text-[10px] font-bold uppercase text-amber-700 hover:underline"
                        >
                          View Details →
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  );
}
