"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuthStore } from "@/stores/auth.store";
import { useWishlistStore } from "@/stores/wishlist.store";
import { AdminService } from "@/services/admin.service";
import { CustomerService } from "@/services/customer.service";
import { AdminOrder } from "@/types/admin.types";
import { ProductData } from "@/data/products.data";
import {
  User,
  Package,
  MapPin,
  Lock,
  Heart,
  Bell,
  LogOut,
  LogIn,
  Sparkles,
  ShieldCheck,
  ChevronRight,
  CheckCircle2,
  X,
  CreditCard,
  Crown,
} from "lucide-react";

import { ProfileTab } from "./components/ProfileTab";
import { SecurityTab } from "./components/SecurityTab";
import { AddressesTab } from "./components/AddressesTab";
import { OrdersTab } from "./components/OrdersTab";
import { FavouritesTab } from "./components/FavouritesTab";
import { PreferencesTab } from "./components/PreferencesTab";

type AccountTab = "orders" | "profile" | "addresses" | "security" | "favourites" | "preferences";

interface AccountClientProps {
  initialProducts: ProductData[];
}

export function AccountClient({ initialProducts }: AccountClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isAuthenticated, logout } = useAuthStore();
  const { wishlistIds } = useWishlistStore();

  const [activeTab, setActiveTab] = useState<AccountTab>("orders");
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(true);
  const [addressCount, setAddressCount] = useState(0);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Sync tab from URL query param if present
  useEffect(() => {
    const tabParam = searchParams.get("tab");
    if (
      tabParam &&
      ["orders", "profile", "addresses", "security", "favourites", "preferences"].includes(tabParam)
    ) {
      setActiveTab(tabParam as AccountTab);
    }
  }, [searchParams]);

  // Load orders
  useEffect(() => {
    async function loadOrders() {
      if (!user?.email) {
        setIsLoadingOrders(false);
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
        setIsLoadingOrders(false);
      }
    }

    if (isAuthenticated) {
      loadOrders();
      // Count saved addresses
      const addrs = CustomerService.getStoredAddresses();
      setAddressCount(addrs.length);
    }
  }, [user, isAuthenticated]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 4000);
  };

  const handleSignOut = async () => {
    await logout();
    router.push("/login");
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-[75vh] flex items-center justify-center px-4 py-16 bg-neutral-50/50">
        <div className="max-w-md w-full text-center bg-white p-8 sm:p-10 rounded-3xl border border-neutral-200/80 shadow-xl space-y-6 animate-fade-in">
          <div className="w-16 h-16 bg-amber-50 rounded-2xl flex items-center justify-center mx-auto text-amber-800 border border-amber-200">
            <User className="w-7 h-7" />
          </div>

          <div className="space-y-2">
            <h2 className="text-xl sm:text-2xl font-bold uppercase tracking-tight text-neutral-900 font-heading">
              Client Atelier Access
            </h2>
            <p className="text-xs text-neutral-500 leading-relaxed">
              Sign in to manage your haute couture profile, track active white-glove shipments, update saved delivery suites, and manage security.
            </p>
          </div>

          <div className="pt-2 flex flex-col gap-3">
            <Link
              href="/login?redirect=/account"
              className="w-full py-3.5 bg-neutral-900 hover:bg-amber-600 text-white font-bold text-xs uppercase tracking-widest rounded-2xl transition-all shadow-md flex items-center justify-center gap-2"
            >
              <LogIn className="w-4 h-4" />
              <span>Sign In to Account</span>
            </Link>

            <Link
              href="/signup?redirect=/account"
              className="w-full py-3.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 font-bold text-xs uppercase tracking-widest rounded-2xl transition-all flex items-center justify-center"
            >
              <span>Create New Client Account</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const displayName = user?.name || "Valued Client";
  const displayEmail = user?.email || "customer@example.com";

  const tabs: Array<{ id: AccountTab; label: string; icon: any; count?: number }> = [
    { id: "orders", label: "My Orders & Tracking", icon: Package, count: orders.length },
    { id: "profile", label: "Profile & Identity", icon: User },
    { id: "addresses", label: "Delivery Addresses", icon: MapPin, count: addressCount },
    { id: "security", label: "Security & Password", icon: Lock },
    { id: "favourites", label: "Saved Favourites", icon: Heart, count: wishlistIds.length },
    { id: "preferences", label: "Preferences & Privacy", icon: Bell },
  ];

  return (
    <div className="py-10 bg-neutral-50/60 min-h-screen">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        
        {/* Toast Notification Banner */}
        {toastMessage && (
          <div className="fixed top-20 right-4 sm:right-8 z-50 max-w-md bg-neutral-900 text-white px-5 py-3.5 rounded-2xl shadow-2xl border border-amber-500/30 flex items-center justify-between gap-3 animate-fade-in">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <p className="text-xs font-medium">{toastMessage}</p>
            </div>
            <button
              onClick={() => setToastMessage(null)}
              className="text-neutral-400 hover:text-white p-1"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Client Profile Header Card */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-neutral-200/80 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5">
            <div className="flex items-center gap-4 sm:gap-5">
              {user?.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt={displayName}
                  className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl border-2 border-amber-200 object-cover shadow-sm"
                />
              ) : (
                <div className="w-16 h-16 sm:w-20 sm:h-20 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-800 font-bold text-2xl border border-amber-200 shadow-sm">
                  {displayName.charAt(0).toUpperCase()}
                </div>
              )}

              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-amber-900 bg-amber-100/70 px-2.5 py-0.5 rounded-full border border-amber-300 flex items-center gap-1">
                    <Crown className="w-3 h-3 text-amber-700" />
                    <span>Privilege Client</span>
                  </span>
                  <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full flex items-center gap-1 border border-emerald-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block animate-pulse" />
                    Authenticated
                  </span>
                </div>

                <h1 className="font-heading text-xl sm:text-2xl font-bold uppercase tracking-tight text-neutral-900">
                  {displayName}
                </h1>
                <p className="text-xs text-neutral-500 font-mono">
                  {displayEmail}
                </p>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-2 self-start sm:self-auto">
              {(user?.role === "STORE_ADMIN" || user?.role === "SUPER_ADMIN") && (
                <Link
                  href="/admin"
                  className="px-4 py-2.5 bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow-xs flex items-center gap-1.5"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
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

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-neutral-100">
            <button
              onClick={() => setActiveTab("orders")}
              className={`p-3.5 rounded-2xl border text-left transition-all ${
                activeTab === "orders" ? "border-amber-400 bg-amber-50/30" : "border-neutral-100 bg-neutral-50/40 hover:bg-neutral-50"
              }`}
            >
              <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block">
                Total Orders
              </span>
              <span className="text-base font-bold text-neutral-900 font-mono mt-0.5 block">
                {orders.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab("favourites")}
              className={`p-3.5 rounded-2xl border text-left transition-all ${
                activeTab === "favourites" ? "border-amber-400 bg-amber-50/30" : "border-neutral-100 bg-neutral-50/40 hover:bg-neutral-50"
              }`}
            >
              <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block">
                Saved Favourites
              </span>
              <span className="text-base font-bold text-neutral-900 font-mono mt-0.5 block">
                {wishlistIds.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab("addresses")}
              className={`p-3.5 rounded-2xl border text-left transition-all ${
                activeTab === "addresses" ? "border-amber-400 bg-amber-50/30" : "border-neutral-100 bg-neutral-50/40 hover:bg-neutral-50"
              }`}
            >
              <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block">
                Delivery Addresses
              </span>
              <span className="text-base font-bold text-neutral-900 font-mono mt-0.5 block">
                {addressCount}
              </span>
            </button>

            <div className="p-3.5 rounded-2xl border border-neutral-100 bg-neutral-50/40">
              <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block">
                Atelier Tier
              </span>
              <span className="text-base font-bold text-amber-800 font-mono mt-0.5 block">
                VIP Gold
              </span>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-3 rounded-2xl text-xs font-bold uppercase tracking-wider whitespace-nowrap transition-all flex items-center gap-2 cursor-pointer ${
                  isActive
                    ? "bg-neutral-900 text-white shadow-md ring-2 ring-neutral-900/10"
                    : "bg-white text-neutral-600 hover:bg-neutral-100 border border-neutral-200/80 shadow-xs"
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? "text-amber-400" : "text-neutral-500"}`} />
                <span>{tab.label}</span>
                {typeof tab.count === "number" && (
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold ${
                      isActive ? "bg-white/20 text-white" : "bg-neutral-100 text-neutral-700"
                    }`}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Active Tab Panel */}
        <div className="min-h-[500px]">
          {activeTab === "orders" && (
            <OrdersTab
              orders={orders}
              isLoading={isLoadingOrders}
              onShowToast={showToast}
            />
          )}

          {activeTab === "profile" && (
            <ProfileTab onShowToast={showToast} />
          )}

          {activeTab === "addresses" && (
            <AddressesTab onShowToast={showToast} />
          )}

          {activeTab === "security" && (
            <SecurityTab onShowToast={showToast} />
          )}

          {activeTab === "favourites" && (
            <FavouritesTab
              products={initialProducts}
              onShowToast={showToast}
            />
          )}

          {activeTab === "preferences" && (
            <PreferencesTab onShowToast={showToast} />
          )}
        </div>

      </div>
    </div>
  );
}
