"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuthStore } from "@/stores/auth.store";
import { useWishlistStore } from "@/stores/wishlist.store";
import { canAccessAdmin } from "@/lib/rbac";
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
  ShieldCheck,
  CheckCircle2,
  X,
  ChevronRight,
  Star,
} from "lucide-react";

import { ProfileTab } from "./components/ProfileTab";
import { SecurityTab } from "./components/SecurityTab";
import { AddressesTab } from "./components/AddressesTab";
import { OrdersTab } from "./components/OrdersTab";
import { FavouritesTab } from "./components/FavouritesTab";
import { PreferencesTab } from "./components/PreferencesTab";
import { ReviewsTab } from "./components/ReviewsTab";

type AccountTab =
  | "orders"
  | "profile"
  | "addresses"
  | "security"
  | "favourites"
  | "preferences"
  | "reviews";

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
  const [reviewsCount, setReviewsCount] = useState(0);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Sync tab from URL query param if present
  useEffect(() => {
    const tabParam = searchParams.get("tab");
    if (
      tabParam &&
      [
        "orders",
        "profile",
        "addresses",
        "security",
        "favourites",
        "preferences",
        "reviews",
      ].includes(tabParam)
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

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace("/login?redirect=/account");
    }
  }, [isAuthenticated, router]);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[var(--background)] flex items-center justify-center">
        <div className="w-7 h-7 rounded-full border-2 border-neutral-300 border-t-neutral-900 animate-spin" />
      </div>
    );
  }

  const displayName = user?.name || "Customer";
  const displayEmail = user?.email || "";
  const initialLetter = displayName.charAt(0).toUpperCase();

  const tabs: Array<{ id: AccountTab; label: string; icon: any; count?: number }> = [
    { id: "orders", label: "Orders", icon: Package, count: orders.length },
    { id: "reviews", label: "Reviews", icon: Star, count: reviewsCount },
    { id: "profile", label: "Profile", icon: User },
    { id: "addresses", label: "Addresses", icon: MapPin, count: addressCount },
    { id: "security", label: "Security", icon: Lock },
    { id: "favourites", label: "Wishlist", icon: Heart, count: wishlistIds.length },
    { id: "preferences", label: "Preferences", icon: Bell },
  ];

  return (
    <div className="py-8 sm:py-12 bg-[var(--background)] min-h-screen">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        
        {/* Toast Notification Banner */}
        {toastMessage && (
          <div className="fixed top-20 right-4 sm:right-8 z-50 max-w-md bg-neutral-900 text-white px-4 py-3 rounded-xl shadow-lg border border-neutral-700 flex items-center justify-between gap-3 animate-fade-in">
            <div className="flex items-center gap-2 text-xs">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <p className="font-medium">{toastMessage}</p>
            </div>
            <button
              onClick={() => setToastMessage(null)}
              className="text-neutral-400 hover:text-white p-1"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Customer Profile Header Card */}
        <div className="bg-white p-5 sm:p-6 rounded-xl border border-neutral-200/90 shadow-xs space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              {user?.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt={displayName}
                  className="w-14 h-14 rounded-full object-cover border border-neutral-200 shadow-2xs"
                />
              ) : (
                <div className="w-14 h-14 bg-neutral-100 rounded-full flex items-center justify-center text-neutral-700 font-semibold text-lg border border-neutral-200">
                  {initialLetter}
                </div>
              )}

              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <h1 className="text-lg sm:text-xl font-semibold text-neutral-900">
                    {displayName}
                  </h1>
                  {(user?.role === "STORE_ADMIN" || user?.role === "SUPER_ADMIN") && (
                    <span className="text-[10px] font-semibold bg-neutral-100 text-neutral-700 px-2 py-0.5 rounded border border-neutral-200">
                      Staff
                    </span>
                  )}
                </div>
                <p className="text-xs text-neutral-500 font-mono">
                  {displayEmail}
                </p>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-2 self-start sm:self-auto">
              {canAccessAdmin(user?.role) && (
                <Link
                  href="/admin"
                  className="px-3.5 py-2 bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-medium rounded-lg transition-colors shadow-xs flex items-center gap-1.5"
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Admin console</span>
                </Link>
              )}

              <button
                onClick={handleSignOut}
                className="px-3.5 py-2 bg-white hover:bg-neutral-50 text-neutral-700 border border-neutral-300 text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
              >
                <LogOut className="w-3.5 h-3.5 text-neutral-500" />
                <span>Log out</span>
              </button>
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-4 border-t border-neutral-100 text-xs">
            <button
              onClick={() => setActiveTab("orders")}
              className={`p-3 rounded-lg border text-left transition-all ${
                activeTab === "orders" ? "border-neutral-900 bg-neutral-50" : "border-neutral-200 bg-white hover:bg-neutral-50"
              }`}
            >
              <span className="text-[11px] text-neutral-500 block">
                Total orders
              </span>
              <span className="text-sm font-semibold text-neutral-900 font-mono mt-0.5 block">
                {orders.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab("favourites")}
              className={`p-3 rounded-lg border text-left transition-all ${
                activeTab === "favourites" ? "border-neutral-900 bg-neutral-50" : "border-neutral-200 bg-white hover:bg-neutral-50"
              }`}
            >
              <span className="text-[11px] text-neutral-500 block">
                Saved wishlist
              </span>
              <span className="text-sm font-semibold text-neutral-900 font-mono mt-0.5 block">
                {wishlistIds.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab("addresses")}
              className={`p-3 rounded-lg border text-left transition-all ${
                activeTab === "addresses" ? "border-neutral-900 bg-neutral-50" : "border-neutral-200 bg-white hover:bg-neutral-50"
              }`}
            >
              <span className="text-[11px] text-neutral-500 block">
                Saved addresses
              </span>
              <span className="text-sm font-semibold text-neutral-900 font-mono mt-0.5 block">
                {addressCount}
              </span>
            </button>
          </div>
        </div>

        {/* Tab Navigation (Shopify Polaris style) */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
                  isActive
                    ? "bg-neutral-900 text-white shadow-xs"
                    : "bg-white text-neutral-600 hover:bg-neutral-100 border border-neutral-200"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
                {typeof tab.count === "number" && (
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-medium ${
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
        <div className="min-h-[400px]">
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

          {activeTab === "reviews" && (
            <ReviewsTab onShowToast={showToast} onRefreshCount={setReviewsCount} />
          )}
        </div>

      </div>
    </div>
  );
}
