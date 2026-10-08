"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  Search,
  ShoppingBag,
  Heart,
  User,
  Menu,
  X,
  ShieldAlert,
  ChevronDown,
  ArrowRight,
} from "lucide-react";
import { storeConfig } from "@/config/store.config";
import { featureConfig } from "@/config/feature.config";
import { useCartStore } from "@/stores/cart.store";
import { useUIStore } from "@/stores/ui.store";

export function Navbar() {
  const itemCount = useCartStore((state) => state.getItemCount());
  const { isMobileMenuOpen, toggleMobileMenu, closeMobileMenu, toggleSearch } = useUIStore();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isCategoryMenuOpen, setIsCategoryMenuOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const closeTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setIsMounted(true);
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleMouseEnter = () => {
    if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    setIsCategoryMenuOpen(true);
  };

  const handleMouseLeave = () => {
    closeTimerRef.current = setTimeout(() => {
      setIsCategoryMenuOpen(false);
    }, 150);
  };

  return (
    <header
      className={`sticky top-0 z-40 bg-[var(--background)]/95 backdrop-blur-md border-b border-[var(--border)] transition-all duration-300 ${
        isScrolled ? "shadow-sm py-0" : "py-1"
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

          {/* Left Navigation Links (Desktop) - Clean & Focused */}
          <nav className="hidden lg:flex items-center gap-7">
            <Link
              href="/categories/womens-couture"
              className="text-xs font-semibold uppercase tracking-widest text-[var(--foreground)] hover:text-amber-700 transition-colors"
            >
              WOMEN
            </Link>

            <Link
              href="/categories/mens-apparel"
              className="text-xs font-semibold uppercase tracking-widest text-[var(--foreground)] hover:text-amber-700 transition-colors"
            >
              MEN
            </Link>

            {/* Simple, Non-Intrusive Categories Dropdown */}
            <div
              className="relative"
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
            >
              <Link
                href="/categories"
                className={`text-xs font-semibold uppercase tracking-widest transition-colors flex items-center gap-1 py-2 cursor-pointer ${
                  isCategoryMenuOpen ? "text-amber-700" : "text-[var(--foreground)] hover:text-amber-700"
                }`}
              >
                <span>CATEGORIES</span>
                <ChevronDown
                  className={`w-3.5 h-3.5 transition-transform duration-200 ${
                    isCategoryMenuOpen ? "rotate-180 text-amber-700" : ""
                  }`}
                />
              </Link>

              {/* Clean Lightweight Dropdown Menu */}
              {isCategoryMenuOpen && (
                <div className="absolute top-full left-0 w-80 bg-white border border-neutral-200 rounded-2xl shadow-xl p-5 animate-in fade-in slide-in-from-top-2 duration-150 z-50 text-neutral-900">
                  <div className="space-y-4">
                    {/* Women's Quick Links */}
                    <div>
                      <Link
                        href="/categories/womens-couture"
                        onClick={() => setIsCategoryMenuOpen(false)}
                        className="text-[11px] font-bold uppercase tracking-wider text-amber-800 hover:text-amber-900 block mb-2"
                      >
                        Women&apos;s Couture
                      </Link>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <Link
                          href="/categories/evening-gowns"
                          onClick={() => setIsCategoryMenuOpen(false)}
                          className="text-neutral-600 hover:text-amber-700 transition-colors py-0.5"
                        >
                          Evening Gowns
                        </Link>
                        <Link
                          href="/categories/sarees"
                          onClick={() => setIsCategoryMenuOpen(false)}
                          className="text-neutral-600 hover:text-amber-700 transition-colors py-0.5"
                        >
                          Royal Sarees
                        </Link>
                        <Link
                          href="/categories/dresses"
                          onClick={() => setIsCategoryMenuOpen(false)}
                          className="text-neutral-600 hover:text-amber-700 transition-colors py-0.5 col-span-2"
                        >
                          Designer Dresses
                        </Link>
                      </div>
                    </div>

                    <div className="border-t border-neutral-100 pt-3">
                      {/* Men's Quick Links */}
                      <Link
                        href="/categories/mens-apparel"
                        onClick={() => setIsCategoryMenuOpen(false)}
                        className="text-[11px] font-bold uppercase tracking-wider text-amber-800 hover:text-amber-900 block mb-2"
                      >
                        Men&apos;s Apparel
                      </Link>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <Link
                          href="/categories/mens-suits"
                          onClick={() => setIsCategoryMenuOpen(false)}
                          className="text-neutral-600 hover:text-amber-700 transition-colors py-0.5"
                        >
                          Suits & Blazers
                        </Link>
                        <Link
                          href="/categories/mens-shirts"
                          onClick={() => setIsCategoryMenuOpen(false)}
                          className="text-neutral-600 hover:text-amber-700 transition-colors py-0.5"
                        >
                          Cotton Shirts
                        </Link>
                      </div>
                    </div>

                    {/* All Categories Link */}
                    <div className="border-t border-neutral-100 pt-3">
                      <Link
                        href="/categories"
                        onClick={() => setIsCategoryMenuOpen(false)}
                        className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-neutral-900 hover:text-amber-700 transition-colors"
                      >
                        <span>All Categories</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <Link
              href="/products"
              className="text-xs font-semibold uppercase tracking-widest text-[var(--foreground)] hover:text-amber-700 transition-colors"
            >
              SHOP ALL
            </Link>

            <Link
              href="/products?sort=best_deals"
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

            <Link
              href="/cart"
              aria-label="Shopping Bag"
              className="p-1.5 text-[var(--foreground)] hover:opacity-75 transition-opacity relative flex items-center gap-2 cursor-pointer"
            >
              <ShoppingBag className="w-5 h-5" />
              {isMounted && itemCount > 0 && (
                <span className="bg-[var(--primary)] text-[var(--primary-foreground)] text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center border border-[var(--background)] animate-in zoom-in-50">
                  {itemCount}
                </span>
              )}
            </Link>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu - Clean, Intuitive & Spacious */}
      {isMobileMenuOpen && (
        <div className="lg:hidden bg-[var(--background)] border-b border-[var(--border)] px-6 py-6 space-y-4 animate-in slide-in-from-top-2">
          <Link
            href="/categories/womens-couture"
            onClick={closeMobileMenu}
            className="block text-sm font-semibold uppercase tracking-widest text-[var(--foreground)] hover:text-amber-700 transition-colors"
          >
            Women&apos;s Couture
          </Link>

          <Link
            href="/categories/mens-apparel"
            onClick={closeMobileMenu}
            className="block text-sm font-semibold uppercase tracking-widest text-[var(--foreground)] hover:text-amber-700 transition-colors"
          >
            Men&apos;s Apparel
          </Link>

          <Link
            href="/categories"
            onClick={closeMobileMenu}
            className="block text-sm font-semibold uppercase tracking-widest text-amber-800 hover:text-amber-900 transition-colors"
          >
            All Categories
          </Link>

          <Link
            href="/products"
            onClick={closeMobileMenu}
            className="block text-sm font-semibold uppercase tracking-widest text-[var(--foreground)] hover:text-amber-700 transition-colors"
          >
            Shop All
          </Link>

          <Link
            href="/products?sort=newest"
            onClick={closeMobileMenu}
            className="block text-sm font-semibold uppercase tracking-widest text-[var(--foreground)] hover:text-amber-700 transition-colors"
          >
            New Arrivals
          </Link>

          <Link
            href="/products?sort=best_deals"
            onClick={closeMobileMenu}
            className="block text-sm font-bold uppercase tracking-widest text-rose-600 hover:text-rose-800 transition-colors"
          >
            Sale & Special Deals
          </Link>

          <div className="border-t border-[var(--border)] pt-4 space-y-3">
            {featureConfig.wishlist && (
              <Link
                href="/wishlist"
                onClick={closeMobileMenu}
                className="block text-sm font-semibold uppercase tracking-widest text-[var(--foreground)]"
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
        </div>
      )}
    </header>
  );
}
