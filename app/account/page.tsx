"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/auth.store";
import { useWishlistStore } from "@/stores/wishlist.store";
import { CustomerService, AccountDetails } from "@/services/customer.service";
import {
  Package,
  MapPin,
  Heart,
  ChevronRight,
  LogOut,
  ShieldCheck,
  User,
  LogIn,
  Contact2,
  Lock,
  ArrowRight,
  ShoppingBag,
  ExternalLink,
} from "lucide-react";

export default function AccountCenterPage() {
  const router = useRouter();
  const { user, isAuthenticated, logout } = useAuthStore();
  const { wishlistIds } = useWishlistStore();

  const [account, setAccount] = useState<AccountDetails | null>(null);
  const [orderCount, setOrderCount] = useState<number>(0);
  const [addressCount, setAddressCount] = useState<number>(0);
  const [defaultAddress, setDefaultAddress] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    async function loadAccountData() {
      if (!isAuthenticated) {
        setIsLoading(false);
        return;
      }
      try {
        // Fetch account profile
        const accRes = await CustomerService.getAccountDetails();
        if (accRes.success && accRes.data) {
          setAccount(accRes.data);
        }

        // Fetch addresses count and default
        const addrs = await CustomerService.getAddresses();
        setAddressCount(addrs.length);
        const def = addrs.find((a) => a.isDefault) || addrs[0];
        if (def) {
          setDefaultAddress(`${def.address1 || def.addressLine1 || ""}, ${def.city}, ${def.state} ${def.postalCode}`);
        }

        // Fetch orders count
        try {
          const { OrderService } = await import("@/services/order.service");
          const ordRes = await OrderService.getCustomerOrders({ limit: 1 });
          if (ordRes.pagination && typeof ordRes.pagination.total === "number") {
            setOrderCount(ordRes.pagination.total);
          } else if (ordRes.data && Array.isArray(ordRes.data)) {
            setOrderCount(ordRes.data.length);
          } else {
            const { AdminService } = await import("@/services/admin.service");
            const local = AdminService.getLocalOrders();
            const userOrders = user?.email
              ? local.filter((o) => o.customerEmail?.toLowerCase() === user.email.toLowerCase())
              : local;
            setOrderCount(userOrders.length);
          }
        } catch {
          const { AdminService } = await import("@/services/admin.service");
          const local = AdminService.getLocalOrders();
          const userOrders = user?.email
            ? local.filter((o) => o.customerEmail?.toLowerCase() === user.email.toLowerCase())
            : local;
          setOrderCount(userOrders.length);
        }
      } catch {
        // Graceful fallback
      } finally {
        setIsLoading(false);
      }
    }

    if (isAuthenticated) {
      loadAccountData();
    } else {
      setIsLoading(false);
    }
  }, [isAuthenticated, user?.email]);

  const handleSignOut = async () => {
    await logout();
    router.push("/login");
  };

  if (!isMounted) {
    return (
      <div className="min-h-screen bg-[var(--background)] flex items-center justify-center">
        <div className="w-7 h-7 rounded-full border-2 border-neutral-300 border-t-neutral-900 animate-spin" />
      </div>
    );
  }

  // Unauthenticated State: Shopify-style clean sign-in prompt
  if (!isAuthenticated) {
    return (
      <div className="min-h-[75vh] flex items-center justify-center px-4 py-16 bg-[var(--background)]">
        <div className="max-w-md w-full bg-white p-6 sm:p-8 rounded-xl border border-neutral-200/90 shadow-xs space-y-6 text-center">
          <div className="w-12 h-12 rounded-full bg-neutral-100 flex items-center justify-center mx-auto text-neutral-600">
            <User className="w-6 h-6 stroke-[1.75]" />
          </div>

          <div className="space-y-1.5">
            <h1 className="text-xl font-semibold text-neutral-900">
              Sign in to your account
            </h1>
            <p className="text-xs sm:text-sm text-neutral-500 max-w-sm mx-auto">
              Access your order history, saved addresses, and personal details.
            </p>
          </div>

          <div className="pt-2 flex flex-col gap-2.5">
            <Link
              href="/login?redirect=/account"
              className="w-full py-2.5 bg-neutral-900 hover:bg-neutral-800 text-white font-medium text-xs rounded-lg transition-colors shadow-xs flex items-center justify-center gap-2"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Sign in</span>
            </Link>

            <Link
              href="/signup?redirect=/account"
              className="w-full py-2.5 bg-white hover:bg-neutral-50 text-neutral-800 font-medium text-xs rounded-lg border border-neutral-300 transition-colors flex items-center justify-center"
            >
              <span>Create account</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const displayName = account?.name || user?.name || "Customer";
  const displayEmail = account?.email || user?.email || "";
  const initialLetter = displayName.charAt(0).toUpperCase();

  return (
    <div className="min-h-screen bg-[var(--background)] py-8 sm:py-12">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        
        {/* Breadcrumb Navigation */}
        <nav className="flex items-center gap-2 text-xs text-neutral-500 font-medium">
          <Link href="/" className="hover:text-neutral-900 transition-colors">
            Home
          </Link>
          <span className="text-neutral-300">/</span>
          <span className="text-neutral-900 font-semibold">Account</span>
        </nav>

        {/* Customer Profile Header Card (Shopify Polaris style) */}
        <div className="bg-white rounded-xl border border-neutral-200/90 p-5 sm:p-6 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              {/* Initials Avatar */}
              {user?.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt={displayName}
                  className="w-14 h-14 rounded-full object-cover border border-neutral-200 shrink-0"
                />
              ) : (
                <div className="w-14 h-14 rounded-full bg-neutral-100 border border-neutral-200 text-neutral-700 font-semibold text-lg flex items-center justify-center shrink-0">
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
                {defaultAddress && (
                  <p className="text-xs text-neutral-500 truncate max-w-md pt-0.5">
                    Default: {defaultAddress}
                  </p>
                )}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-2 self-start sm:self-auto">
              {(user?.role === "STORE_ADMIN" || user?.role === "SUPER_ADMIN") && (
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
        </div>

        {/* 4 Logical Shopify Navigation Cards (2x2 Grid) */}
        <div>
          <h2 className="text-sm font-semibold text-neutral-900 uppercase tracking-wider mb-3">
            Account overview
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Card 1: Orders */}
            <Link
              href="/account/orders"
              className="group p-5 bg-white hover:bg-neutral-50/50 border border-neutral-200/90 hover:border-neutral-300 rounded-xl shadow-xs transition-all flex items-start gap-4"
            >
              <div className="w-10 h-10 rounded-lg bg-neutral-100 flex items-center justify-center shrink-0 text-neutral-700 group-hover:bg-neutral-200/80 transition-colors">
                <Package className="w-5 h-5 stroke-[1.75]" />
              </div>
              <div className="space-y-1 flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-neutral-900 group-hover:text-neutral-950">
                    Orders
                  </h3>
                  <span className="text-xs font-medium text-neutral-500 bg-neutral-100 px-2 py-0.5 rounded-full">
                    {orderCount} {orderCount === 1 ? "order" : "orders"}
                  </span>
                </div>
                <p className="text-xs text-neutral-500 leading-relaxed">
                  Track shipments, view past receipts, and reorder items.
                </p>
                <div className="pt-1 flex items-center gap-1 text-xs font-medium text-neutral-700 group-hover:text-neutral-900">
                  <span>View orders</span>
                  <ChevronRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
                </div>
              </div>
            </Link>

            {/* Card 2: Account Details & Security */}
            <Link
              href="/account/details"
              className="group p-5 bg-white hover:bg-neutral-50/50 border border-neutral-200/90 hover:border-neutral-300 rounded-xl shadow-xs transition-all flex items-start gap-4"
            >
              <div className="w-10 h-10 rounded-lg bg-neutral-100 flex items-center justify-center shrink-0 text-neutral-700 group-hover:bg-neutral-200/80 transition-colors">
                <Contact2 className="w-5 h-5 stroke-[1.75]" />
              </div>
              <div className="space-y-1 flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-neutral-900 group-hover:text-neutral-950">
                    Profile & security
                  </h3>
                  <span className="text-xs font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/60">
                    Protected
                  </span>
                </div>
                <p className="text-xs text-neutral-500 leading-relaxed">
                  Update your contact details, personal name, and password.
                </p>
                <div className="pt-1 flex items-center gap-1 text-xs font-medium text-neutral-700 group-hover:text-neutral-900">
                  <span>Edit profile</span>
                  <ChevronRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
                </div>
              </div>
            </Link>

            {/* Card 3: Addresses */}
            <Link
              href="/account/addresses"
              className="group p-5 bg-white hover:bg-neutral-50/50 border border-neutral-200/90 hover:border-neutral-300 rounded-xl shadow-xs transition-all flex items-start gap-4"
            >
              <div className="w-10 h-10 rounded-lg bg-neutral-100 flex items-center justify-center shrink-0 text-neutral-700 group-hover:bg-neutral-200/80 transition-colors">
                <MapPin className="w-5 h-5 stroke-[1.75]" />
              </div>
              <div className="space-y-1 flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-neutral-900 group-hover:text-neutral-950">
                    Addresses
                  </h3>
                  <span className="text-xs font-medium text-neutral-500 bg-neutral-100 px-2 py-0.5 rounded-full">
                    {addressCount} {addressCount === 1 ? "address" : "addresses"}
                  </span>
                </div>
                <p className="text-xs text-neutral-500 leading-relaxed">
                  Manage shipping addresses and set your default destination.
                </p>
                <div className="pt-1 flex items-center gap-1 text-xs font-medium text-neutral-700 group-hover:text-neutral-900">
                  <span>Manage addresses</span>
                  <ChevronRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
                </div>
              </div>
            </Link>

            {/* Card 4: Wishlist */}
            <Link
              href="/account/wishlist"
              className="group p-5 bg-white hover:bg-neutral-50/50 border border-neutral-200/90 hover:border-neutral-300 rounded-xl shadow-xs transition-all flex items-start gap-4"
            >
              <div className="w-10 h-10 rounded-lg bg-neutral-100 flex items-center justify-center shrink-0 text-neutral-700 group-hover:bg-neutral-200/80 transition-colors">
                <Heart className="w-5 h-5 stroke-[1.75]" />
              </div>
              <div className="space-y-1 flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-neutral-900 group-hover:text-neutral-950">
                    Wishlist
                  </h3>
                  <span className="text-xs font-medium text-neutral-500 bg-neutral-100 px-2 py-0.5 rounded-full">
                    {wishlistIds.length} {wishlistIds.length === 1 ? "item" : "items"}
                  </span>
                </div>
                <p className="text-xs text-neutral-500 leading-relaxed">
                  View and manage garments saved to your private wishlist.
                </p>
                <div className="pt-1 flex items-center gap-1 text-xs font-medium text-neutral-700 group-hover:text-neutral-900">
                  <span>View wishlist</span>
                  <ChevronRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
                </div>
              </div>
            </Link>

          </div>
        </div>

        {/* Quick Help & Catalog Access Card */}
        <div className="rounded-xl border border-neutral-200/90 bg-white p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
          <div>
            <h3 className="text-sm font-semibold text-neutral-900">
              Need assistance with an order?
            </h3>
            <p className="text-xs text-neutral-500 mt-0.5">
              Contact our support team for sizing recommendations or order questions.
            </p>
          </div>

          <Link
            href="/products"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-neutral-900 hover:bg-neutral-800 text-white rounded-lg text-xs font-medium transition-colors shadow-xs self-start sm:self-auto"
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>Continue shopping</span>
          </Link>
        </div>

      </div>
    </div>
  );
}
