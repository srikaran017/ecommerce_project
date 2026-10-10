"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  ShoppingBag,
  Package,
  Layers,
  FolderTree,
  Sparkles,
  Tag,
  Sliders,
  Store,
  ArrowLeft,
  ShieldAlert,
  Lock,
} from "lucide-react";
import { storeConfig } from "@/config/store.config";
import { useAuthStore } from "@/stores/auth.store";

import { canAccessAdmin } from "@/lib/rbac";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const isAdmin = Boolean(isAuthenticated && canAccessAdmin(user?.role));

  useEffect(() => {
    if (!isMounted) return;

    if (!isAuthenticated) {
      // Logged-out user -> Redirect to existing Login page
      const redirectParam = pathname ? `?redirect=${encodeURIComponent(pathname)}` : "?redirect=/admin";
      router.replace(`/login${redirectParam}`);
    } else if (!isAdmin) {
      // Logged-in normal customer -> Cannot access Admin page -> Redirect to non-admin home page
      router.replace("/");
    }
  }, [isMounted, isAuthenticated, isAdmin, router, pathname]);

  // Loading state during hydration
  if (!isMounted) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 rounded-full border-2 border-slate-700 border-t-amber-400 animate-spin mx-auto" />
          <p className="text-xs text-slate-400 font-medium">Verifying authorization...</p>
        </div>
      </div>
    );
  }

  // Logged-out state: Redirecting to login
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 text-center">
        <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-8 space-y-4 shadow-2xl">
          <div className="w-12 h-12 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center mx-auto">
            <Lock className="w-6 h-6" />
          </div>
          <h2 className="text-base font-bold text-white uppercase tracking-wider">
            Sign In Required
          </h2>
          <p className="text-xs text-slate-400">
            Please sign in with administrator credentials to access this console.
          </p>
        </div>
      </div>
    );
  }

  // Normal Customer trying to access Admin: Access Denied
  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 text-center">
        <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-8 space-y-4 shadow-2xl">
          <div className="w-12 h-12 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-400 flex items-center justify-center mx-auto">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <h2 className="text-base font-bold text-white uppercase tracking-wider">
            Access Restricted
          </h2>
          <p className="text-xs text-slate-400">
            You are signed in as a customer ({user?.email}). Administrator privileges are required to access this portal.
          </p>
          <div className="pt-2">
            <Link
              href="/"
              className="inline-flex items-center justify-center px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs uppercase tracking-wider transition-colors"
            >
              Return to Storefront
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const mainNav = [
    { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
    { label: "Orders", href: "/admin/orders", icon: ShoppingBag },
    { label: "Products", href: "/admin/products", icon: Package },
    { label: "Inventory", href: "/admin/inventory", icon: Layers },
    { label: "Categories", href: "/admin/categories", icon: FolderTree },
    { label: "Collections", href: "/admin/collections", icon: Sparkles },
    { label: "Flash Sales", href: "/admin/promotions", icon: Sparkles },
    { label: "Discounts", href: "/admin/discounts", icon: Tag },
  ];

  const storeNav = [
    { label: "Theme & Feature Flags", href: "/admin/settings", icon: Sliders },
  ];

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col md:flex-row">
      
      {/* Shopify-Style Dark Sidebar */}
      <aside className="w-full md:w-64 bg-slate-950 border-r border-slate-800 p-6 flex flex-col justify-between flex-shrink-0">
        <div className="space-y-8">
          
          {/* Brand header */}
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-amber-400">
              <Store className="w-5 h-5" />
              <span className="text-[11px] font-bold uppercase tracking-wider">Fashion Admin Pro</span>
            </div>
            <h2 className="text-base font-bold tracking-tight text-white truncate">
              {storeConfig.name}
            </h2>
            <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span>Multi-Client Online</span>
            </div>
          </div>

          {/* Main Navigation Group */}
          <div className="space-y-4">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 block px-3 mb-2">
                CORE STORE
              </span>
              <nav className="space-y-1">
                {mainNav.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href || (item.href !== "/admin" && pathname.startsWith(item.href));
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center gap-3 px-3 py-2 rounded-md text-xs font-semibold uppercase tracking-wider transition-colors ${
                        isActive
                          ? "bg-amber-500/10 text-amber-400 border border-amber-500/30"
                          : "text-slate-400 hover:text-slate-100 hover:bg-slate-900"
                      }`}
                    >
                      <Icon className="w-4 h-4 flex-shrink-0" />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </nav>
            </div>

            {/* Sales Channels Group */}
            <div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 block px-3 mb-2">
                CHANNELS & THEMES
              </span>
              <nav className="space-y-1">
                {storeNav.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center gap-3 px-3 py-2 rounded-md text-xs font-semibold uppercase tracking-wider transition-colors ${
                        isActive
                          ? "bg-amber-500/10 text-amber-400 border border-amber-500/30"
                          : "text-slate-400 hover:text-slate-100 hover:bg-slate-900"
                      }`}
                    >
                      <Icon className="w-4 h-4 flex-shrink-0" />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </nav>
            </div>
          </div>
        </div>

        {/* Back to storefront link */}
        <div className="pt-6 border-t border-slate-800 space-y-2">
          <Link
            href="/"
            className="flex items-center gap-2 text-xs font-medium text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>View Live Storefront</span>
          </Link>
        </div>
      </aside>

      {/* Main Content Viewport */}
      <main className="flex-1 p-6 sm:p-10 bg-slate-900 overflow-y-auto">
        {children}
      </main>

    </div>
  );
}
