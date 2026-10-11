"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/auth.store";
import { CustomerService, AccountDetails } from "@/services/customer.service";
import {
  Package,
  CreditCard,
  MapPin,
  Heart,
  ChevronRight,
  LogOut,
  ShieldCheck,
  User,
  LogIn,
  Contact2,
} from "lucide-react";

export default function AccountCenterPage() {
  const router = useRouter();
  const { user, isAuthenticated, logout } = useAuthStore();
  const [account, setAccount] = useState<AccountDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadAccount() {
      if (!isAuthenticated) {
        setIsLoading(false);
        return;
      }
      try {
        const res = await CustomerService.getAccountDetails();
        if (res.success && res.data) {
          setAccount(res.data);
        }
      } catch {
        // Fallback to auth store user
      } finally {
        setIsLoading(false);
      }
    }
    loadAccount();
  }, [isAuthenticated]);

  const handleSignOut = async () => {
    await logout();
    router.push("/login");
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-4 py-16 bg-[#fafafa]">
        <div className="max-w-md w-full text-center bg-white p-8 sm:p-10 rounded-2xl border border-neutral-200/80 shadow-md space-y-6">
          <div className="w-16 h-16 bg-[#eef8fb] rounded-full flex items-center justify-center mx-auto text-[#2b97ba]">
            <User className="w-7 h-7" />
          </div>

          <div className="space-y-2">
            <h2 className="text-xl font-bold uppercase tracking-tight text-neutral-900 font-heading">
              Account Center
            </h2>
            <p className="text-xs text-neutral-500 leading-relaxed">
              Please sign in to access your orders, account details, saved addresses, and favorites.
            </p>
          </div>

          <div className="pt-2 flex flex-col gap-3">
            <Link
              href="/login?redirect=/account"
              className="w-full py-3.5 bg-neutral-900 hover:bg-[#2b97ba] text-white font-bold text-xs uppercase tracking-widest rounded-xl transition-all shadow-sm flex items-center justify-center gap-2"
            >
              <LogIn className="w-4 h-4" />
              <span>Sign In</span>
            </Link>

            <Link
              href="/signup?redirect=/account"
              className="w-full py-3.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 font-bold text-xs uppercase tracking-widest rounded-xl transition-all flex items-center justify-center"
            >
              <span>Create New Account</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Display name formatting (e.g. "Aarav S" or "John Doe")
  const displayName = account?.name || user?.name || "Valued Client";

  return (
    <div className="min-h-screen bg-[#fafafa] py-10 sm:py-14">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        
        {/* Breadcrumb Navigation - matches image */}
        <nav className="flex items-center gap-1.5 text-xs text-neutral-500 font-medium">
          <Link href="/" className="hover:text-neutral-900 transition-colors">
            Home
          </Link>
          <span>/</span>
          <span className="text-neutral-900 font-semibold">Account Center</span>
        </nav>

        {/* Welcome Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-normal text-neutral-900 font-sans tracking-tight">
              Welcome, <span className="font-bold text-[#2b97ba]">{displayName}!</span>
            </h1>
          </div>

          <div className="flex items-center gap-3">
            {(user?.role === "STORE_ADMIN" || user?.role === "SUPER_ADMIN") && (
              <Link
                href="/admin"
                className="px-4 py-2 bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all flex items-center gap-1.5"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                <span>Admin Console</span>
              </Link>
            )}
            <button
              onClick={handleSignOut}
              className="px-4 py-2 bg-white hover:bg-rose-50 text-neutral-700 hover:text-rose-600 border border-neutral-200 text-xs font-bold uppercase tracking-wider rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>

        {/* 4 Feature Cards Grid - Identical layout to the uploaded screenshot */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
          
          {/* Card 1: Orders */}
          <Link
            href="/account/orders"
            className="group p-6 bg-[#f7f9fa] hover:bg-white border border-neutral-200/80 hover:border-[#2b97ba]/50 rounded-2xl shadow-xs hover:shadow-md transition-all flex items-center gap-5"
          >
            <div className="w-16 h-16 rounded-full bg-white border border-neutral-200/60 group-hover:border-[#2b97ba]/40 flex items-center justify-center flex-shrink-0 shadow-xs transition-colors">
              <Package className="w-8 h-8 text-[#2b97ba] stroke-[1.75]" />
            </div>
            <div className="space-y-1">
              <h2 className="text-lg font-semibold text-neutral-900 group-hover:text-[#2b97ba] transition-colors">
                Orders
              </h2>
              <p className="text-xs text-neutral-500 leading-relaxed">
                Track, return, cancel, or replace items.
              </p>
            </div>
          </Link>

          {/* Card 2: Account Details */}
          <Link
            href="/account/details"
            className="group p-6 bg-[#f7f9fa] hover:bg-white border border-neutral-200/80 hover:border-[#2b97ba]/50 rounded-2xl shadow-xs hover:shadow-md transition-all flex items-center gap-5"
          >
            <div className="w-16 h-16 rounded-full bg-white border border-neutral-200/60 group-hover:border-[#2b97ba]/40 flex items-center justify-center flex-shrink-0 shadow-xs transition-colors">
              <Contact2 className="w-8 h-8 text-[#2b97ba] stroke-[1.75]" />
            </div>
            <div className="space-y-1">
              <h2 className="text-lg font-semibold text-neutral-900 group-hover:text-[#2b97ba] transition-colors">
                Account Details
              </h2>
              <p className="text-xs text-neutral-500 leading-relaxed">
                Username, password, and contact information.
              </p>
            </div>
          </Link>

          {/* Card 3: Addresses */}
          <Link
            href="/account/addresses"
            className="group p-6 bg-[#f7f9fa] hover:bg-white border border-neutral-200/80 hover:border-[#2b97ba]/50 rounded-2xl shadow-xs hover:shadow-md transition-all flex items-center gap-5"
          >
            <div className="w-16 h-16 rounded-full bg-white border border-neutral-200/60 group-hover:border-[#2b97ba]/40 flex items-center justify-center flex-shrink-0 shadow-xs transition-colors">
              <MapPin className="w-8 h-8 text-[#2b97ba] stroke-[1.75]" />
            </div>
            <div className="space-y-1">
              <h2 className="text-lg font-semibold text-neutral-900 group-hover:text-[#2b97ba] transition-colors">
                Addresses
              </h2>
              <p className="text-xs text-neutral-500 leading-relaxed">
                Add and edit addresses, set your default address.
              </p>
            </div>
          </Link>

          {/* Card 4: Favorites and Lists */}
          <Link
            href="/account/wishlist"
            className="group p-6 bg-[#f7f9fa] hover:bg-white border border-neutral-200/80 hover:border-[#2b97ba]/50 rounded-2xl shadow-xs hover:shadow-md transition-all flex items-center gap-5"
          >
            <div className="w-16 h-16 rounded-full bg-white border border-neutral-200/60 group-hover:border-[#2b97ba]/40 flex items-center justify-center flex-shrink-0 shadow-xs transition-colors">
              <Heart className="w-8 h-8 text-[#2b97ba] stroke-[1.75]" />
            </div>
            <div className="space-y-1">
              <h2 className="text-lg font-semibold text-neutral-900 group-hover:text-[#2b97ba] transition-colors">
                Favorites and Lists
              </h2>
              <p className="text-xs text-neutral-500 leading-relaxed">
                Your saved products and collections of products.
              </p>
            </div>
          </Link>

        </div>

      </div>
    </div>
  );
}
