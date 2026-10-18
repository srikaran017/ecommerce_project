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
  Users,
  FileText,
  TrendingUp,
  Moon,
  Palette,
} from "lucide-react";
import { storeConfig } from "@/config/store.config";
import { useAuthStore } from "@/stores/auth.store";

import { canAccessAdmin } from "@/lib/rbac";

import { useUIStore } from "@/stores/ui.store";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const { adminTheme, setAdminTheme, toggleAdminTheme } = useUIStore();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    try {
      const saved = localStorage.getItem("admin_theme_mode") as "dark" | "pastel" | null;
      if (saved === "pastel" || saved === "dark") {
        setAdminTheme(saved);
      }
    } catch {}
  }, [setAdminTheme]);

  const toggleTheme = (mode?: "dark" | "pastel") => {
    if (mode) {
      setAdminTheme(mode);
    } else {
      toggleAdminTheme();
    }
  };

  const isAdmin = Boolean(isAuthenticated && canAccessAdmin(user?.role));

  useEffect(() => {
    if (!isMounted) return;

    if (!isAuthenticated) {
      const redirectParam = pathname ? `?redirect=${encodeURIComponent(pathname)}` : "?redirect=/admin";
      router.replace(`/login${redirectParam}`);
    } else if (!isAdmin) {
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

  // Not signed in
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

  // Signed in but not an admin
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
    { label: "Analytics", href: "/admin/analytics", icon: TrendingUp },
    { label: "Orders", href: "/admin/orders", icon: ShoppingBag },
    { label: "Products", href: "/admin/products", icon: Package },
    { label: "Inventory", href: "/admin/inventory", icon: Layers },
    { label: "Categories", href: "/admin/categories", icon: FolderTree },
    { label: "Collections", href: "/admin/collections", icon: Sparkles },
    { label: "Flash Sales", href: "/admin/promotions", icon: Sparkles },
    { label: "Discounts", href: "/admin/discounts", icon: Tag },
    { label: "Staff & Users", href: "/admin/users", icon: Users },
  ];

  const storeNav = [
    { label: "Theme & Feature Flags", href: "/admin/settings", icon: Sliders },
    { label: "Audit Logs", href: "/admin/audit-logs", icon: FileText },
  ];

  return (
    <div
      className={`min-h-screen flex flex-col md:flex-row transition-colors duration-200 relative ${
        adminTheme === "pastel"
          ? "admin-theme-pastel"
          : "admin-theme-dark bg-slate-900 text-slate-100"
      }`}
    >
      
      {/* Dark & Pastel Admin Sidebar */}
      <aside className="w-full md:w-64 bg-slate-950 border-r border-slate-800 p-6 flex flex-col justify-between flex-shrink-0">
        <div className="space-y-6">
          
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

        {/* Sidebar Footer Link */}
        <div className="pt-6 border-t border-slate-800 space-y-4">
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
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Admin Access Sticky Header Bar with Dedicated Theme Switcher */}
        <header className="h-16 border-b border-slate-800 px-6 sm:px-10 flex items-center justify-between flex-shrink-0 bg-slate-950/80 backdrop-blur-md sticky top-0 z-20">
          {/* Breadcrumb / Section identifier */}
          <div className="flex items-center gap-2.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 hidden sm:inline-block">
              Admin Portal
            </span>
            <span className="text-slate-600 hidden sm:inline-block">/</span>
            <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">
              {pathname === "/admin"
                ? "Dashboard"
                : pathname.replace("/admin/", "").replace(/-/g, " ")}
            </span>
          </div>

          {/* Right Action Cluster with The Single Navbar Theme Toggle Button */}
          <div className="flex items-center gap-3 sm:gap-4">
            {/* The single Admin Theme Toggle in the Navbar */}
            <div className="flex items-center bg-slate-900 border border-slate-700/80 p-1 rounded-xl shadow-xs">
              <button
                type="button"
                onClick={() => toggleTheme("dark")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  adminTheme === "dark"
                    ? "bg-amber-500 text-slate-950 shadow-xs"
                    : "text-slate-400 hover:text-white"
                }`}
                title="Switch admin panel to Dark Mode"
              >
                <Moon className="w-3.5 h-3.5" />
                <span>Dark</span>
              </button>
              <button
                type="button"
                onClick={() => toggleTheme("pastel")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  adminTheme === "pastel"
                    ? "bg-amber-600 text-white shadow-xs"
                    : "text-slate-400 hover:text-white"
                }`}
                title="Switch admin panel to Pastel Light Mode"
              >
                <Palette className="w-3.5 h-3.5" />
                <span>Pastel</span>
              </button>
            </div>

            {/* Admin Badge */}
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-xl text-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span className="font-medium text-slate-300 max-w-[130px] truncate">
                {user?.name || user?.email}
              </span>
              <span className="text-[10px] uppercase font-bold text-amber-400 bg-amber-400/10 px-1.5 py-0.5 rounded border border-amber-400/20 font-mono">
                {user?.role || "ADMIN"}
              </span>
            </div>

            {/* Storefront return link */}
            <Link
              href="/"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Storefront</span>
            </Link>
          </div>
        </header>

        {/* Page Content Viewport */}
        <main className="flex-1 p-6 sm:p-10 bg-slate-900 overflow-y-auto">
          {children}
        </main>
      </div>

    </div>
  );
}
