"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Search,
  ShoppingBag,
  Heart,
  User,
  Menu,
  X,
  ShieldAlert,
  Sparkles,
} from "lucide-react";
import { storeConfig } from "@/config/store.config";
import { featureConfig } from "@/config/feature.config";
import { useCartStore } from "@/stores/cart.store";
import { useUIStore } from "@/stores/ui.store";

export function Navbar() {
  const itemCount = useCartStore((state) => state.getItemCount());
  const openCart = useCartStore((state) => state.openCart);
  const { isMobileMenuOpen, toggleMobileMenu, closeMobileMenu, toggleSearch } = useUIStore();
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-40 bg-[var(--background)]/95 backdrop-blur-md border-b border-[var(--border)] transition-all duration-300 ${
        isScrolled ? "shadow-md py-0" : "py-1"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          
          {/* Mobile Menu Button */}
          <div className="flex items-center lg:hidden">
            <button
              onClick={toggleMobileMenu}
              className="p-2 text-[var(--foreground)] hover:opacity-75 focus:outline-none cursor-pointer"
              aria-label="Toggle navigation menu"
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

          {/* Left Navigation Links (Desktop) - Clean & Minimal */}
          <nav className="hidden lg:flex items-center gap-8">
            <Link
              href="/"
              className="text-xs font-semibold uppercase tracking-widest text-[var(--foreground)] hover:text-amber-700 transition-colors"
            >
              HOME
            </Link>

            <Link
              href="/products"
              className="text-xs font-bold uppercase tracking-widest text-[var(--foreground)] hover:text-amber-700 transition-colors flex items-center gap-1.5"
            >
              <span>SHOP</span>
              <span className="w-1.5 h-1.5 rounded-full bg-amber-600 inline-block" />
            </Link>

            <Link
              href="/products?sort=newest"
              className="text-xs font-semibold uppercase tracking-widest text-[var(--foreground)] hover:text-amber-700 transition-colors"
            >
              NEW ARRIVALS
            </Link>

            <Link
              href="/collections"
              className="text-xs font-semibold uppercase tracking-widest text-[var(--foreground)] hover:text-amber-700 transition-colors"
            >
              COLLECTIONS
            </Link>

            <Link
              href="/products?sort=discount"
              className="text-xs font-bold uppercase tracking-widest text-rose-600 hover:text-rose-800 transition-colors"
            >
              SALE
            </Link>
          </nav>

          {/* Center Brand Logo */}
          <div className="flex-1 lg:flex-none text-center">
            <Link href="/" className="inline-block">
              <span className="font-heading text-xl sm:text-2xl font-bold tracking-widest text-[var(--foreground)] uppercase">
                {storeConfig.name}
              </span>
            </Link>
          </div>

          {/* Right Action Icons */}
          <div className="flex items-center gap-5">
            {featureConfig.search && (
              <button
                onClick={toggleSearch}
                aria-label="Search garments"
                className="p-1.5 text-[var(--foreground)] hover:opacity-75 transition-opacity cursor-pointer"
              >
                <Search className="w-5 h-5" />
              </button>
            )}

            {featureConfig.customerAccounts && (
              <Link
                href="/account"
                aria-label="Customer Account"
                className="p-1.5 text-[var(--foreground)] hover:opacity-75 transition-opacity hidden sm:block"
              >
                <User className="w-5 h-5" />
              </Link>
            )}

            {featureConfig.wishlist && (
              <Link
                href="/wishlist"
                aria-label="Wishlist"
                className="p-1.5 text-[var(--foreground)] hover:opacity-75 transition-opacity relative hidden sm:block"
              >
                <Heart className="w-5 h-5" />
              </Link>
            )}

            <Link
              href="/admin"
              title="Store Admin Console"
              className="p-1.5 text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
            >
              <ShieldAlert className="w-5 h-5" />
            </Link>

            <button
              onClick={openCart}
              aria-label="Shopping Bag"
              className="p-1.5 text-[var(--foreground)] hover:opacity-75 transition-opacity relative flex items-center gap-2 cursor-pointer"
            >
              <ShoppingBag className="w-5 h-5" />
              {itemCount > 0 && (
                <span className="bg-[var(--primary)] text-[var(--primary-foreground)] text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center border border-[var(--background)] animate-in zoom-in-50">
                  {itemCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu - Clean & Minimal */}
      {isMobileMenuOpen && (
        <div className="lg:hidden bg-[var(--background)] border-b border-[var(--border)] px-6 py-6 space-y-4 animate-in slide-in-from-top-2">
          <Link
            href="/"
            onClick={closeMobileMenu}
            className="block text-sm font-semibold uppercase tracking-widest text-[var(--foreground)]"
          >
            Home
          </Link>

          <Link
            href="/products"
            onClick={closeMobileMenu}
            className="block text-sm font-bold uppercase tracking-widest text-amber-700"
          >
            Shop All
          </Link>

          <Link
            href="/products?sort=newest"
            onClick={closeMobileMenu}
            className="block text-sm font-semibold uppercase tracking-widest text-[var(--foreground)]"
          >
            New Arrivals
          </Link>

          <Link
            href="/collections"
            onClick={closeMobileMenu}
            className="block text-sm font-semibold uppercase tracking-widest text-[var(--foreground)]"
          >
            Collections
          </Link>

          <Link
            href="/products?sort=discount"
            onClick={closeMobileMenu}
            className="block text-sm font-bold uppercase tracking-widest text-rose-600"
          >
            Sale
          </Link>

          {featureConfig.wishlist && (
            <Link
              href="/wishlist"
              onClick={closeMobileMenu}
              className="block text-sm font-semibold uppercase tracking-widest text-[var(--foreground)] border-t border-[var(--border)] pt-3"
            >
              Saved Wishlist
            </Link>
          )}

          {featureConfig.customerAccounts && (
            <Link
              href="/account"
              onClick={closeMobileMenu}
              className="block text-sm font-semibold uppercase tracking-widest text-[var(--foreground)]"
            >
              My Account
            </Link>
          )}
        </div>
      )}
    </header>
  );
}
