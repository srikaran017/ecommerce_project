"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
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
  Sparkles,
  Truck,
} from "lucide-react";
import { storeConfig } from "@/config/store.config";
import { featureConfig } from "@/config/feature.config";
import {
  NavbarConfig,
  getNavbarConfig,
  DEFAULT_NAVBAR_CONFIG,
  NAVBAR_UPDATE_EVENT,
} from "@/config/navbar.config";
import { useCartStore } from "@/stores/cart.store";
import { useWishlistStore } from "@/stores/wishlist.store";
import { useUIStore } from "@/stores/ui.store";
import { useAuthStore } from "@/stores/auth.store";
import { fetchCategoryTree, ApiCategory } from "@/services/catalogApi";

// Curated initial fallback categories matching real database taxonomy
const FALLBACK_CATEGORIES: ApiCategory[] = [
  {
    id: "women-root",
    name: "Women",
    slug: "women",
    isFeatured: true,
    children: [
      { id: "women-dresses", name: "Dresses & Gowns", slug: "women-dresses" },
      { id: "women-ethnic", name: "Ethnic & Festive Couture", slug: "women-ethnic" },
      { id: "women-coords", name: "Co-ords & Statement Tops", slug: "women-coords-tops" },
    ],
  },
  {
    id: "men-root",
    name: "Men",
    slug: "men",
    isFeatured: true,
    children: [
      { id: "men-suits", name: "Suits & Bespoke Blazers", slug: "men-suits-blazers" },
      { id: "men-kurtas", name: "Luxury Silk Kurta Sets", slug: "men-silk-kurta-sets" },
    ],
  },
];

export function Navbar() {
  const { isAuthenticated } = useAuthStore();
  const rawItemCount = useCartStore((state) => state.getItemCount());
  const itemCount = rawItemCount;
  const rawWishlistCount = useWishlistStore((state) => state.wishlistIds.length);
  const wishlistCount = isAuthenticated ? rawWishlistCount : 0;
  const loadWishlistIds = useWishlistStore((state) => state.loadWishlistIds);
  const { isMobileMenuOpen, toggleMobileMenu, closeMobileMenu, toggleSearch } = useUIStore();

  const [isScrolled, setIsScrolled] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  // Dynamic Navigation & Categories State
  const [categories, setCategories] = useState<ApiCategory[]>(FALLBACK_CATEGORIES);
  const [navbarConfig, setNavbarConfig] = useState<NavbarConfig>(DEFAULT_NAVBAR_CONFIG);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [expandedMobileCategories, setExpandedMobileCategories] = useState<Record<string, boolean>>({});
  const closeTimerRef = useRef<NodeJS.Timeout | null>(null);

  // 1. Load Categories dynamically from API with fallback
  const loadCategories = async () => {
    try {
      const tree = await fetchCategoryTree({ tree: true });
      if (tree && Array.isArray(tree) && tree.length > 0) {
        // Only active categories
        const activeTree = tree.filter((c) => c.isActive !== false);
        setCategories(activeTree);
      }
    } catch (err) {
      console.warn("[Navbar] Using cached fallback categories:", err);
    }
  };

  useEffect(() => {
    setIsMounted(true);
    setNavbarConfig(getNavbarConfig());
    loadCategories();

    if (isAuthenticated) {
      loadWishlistIds();
      useCartStore.getState().fetchCart().catch(() => {});
    } else {
      useWishlistStore.setState({ wishlistIds: [] });
      useCartStore.setState({ items: [], apiCart: null, appliedCoupon: null });
      if (typeof window !== "undefined") {
        try {
          localStorage.removeItem("maison_cart_store");
          localStorage.removeItem("guest_cart_token");
        } catch {}
      }
    }

    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);

    // Listen for live admin updates to navbar configuration & categories
    const handleNavbarUpdate = (e: any) => {
      if (e.detail) setNavbarConfig(e.detail);
      else setNavbarConfig(getNavbarConfig());
    };
    const handleCategoryUpdate = () => {
      loadCategories();
    };

    window.addEventListener(NAVBAR_UPDATE_EVENT, handleNavbarUpdate);
    window.addEventListener("category_updated", handleCategoryUpdate);
    window.addEventListener("storage", handleNavbarUpdate);

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener(NAVBAR_UPDATE_EVENT, handleNavbarUpdate);
      window.removeEventListener("category_updated", handleCategoryUpdate);
      window.removeEventListener("storage", handleNavbarUpdate);
    };
  }, [isAuthenticated, loadWishlistIds]);

  // Dropdown hover handlers with safety delay
  const handleDropdownEnter = (menuId: string) => {
    if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    setActiveDropdown(menuId);
  };

  const handleDropdownLeave = () => {
    closeTimerRef.current = setTimeout(() => {
      setActiveDropdown(null);
    }, 160);
  };

  // Toggle mobile accordion node
  const toggleMobileCategory = (catId: string) => {
    setExpandedMobileCategories((prev) => ({
      ...prev,
      [catId]: !prev[catId],
    }));
  };

  // Decide top-level primary categories vs categories dropdown
  const { topLevelCategories, dropdownCategories } = useMemo(() => {
    const activeRoots = categories.filter((c) => c.parentId === null || !c.parentId);

    // If admin specifically marked root categories as isFeatured, prioritize them
    const featured = activeRoots.filter((c) => c.isFeatured);

    if (featured.length > 0) {
      const top = featured.slice(0, navbarConfig.maxTopLevelCategories);
      const remaining = activeRoots.filter((c) => !top.some((t) => t.id === c.id));
      return { topLevelCategories: top, dropdownCategories: remaining };
    }

    // Default: take top N sorted root categories
    const top = activeRoots.slice(0, navbarConfig.maxTopLevelCategories);
    const remaining = activeRoots.slice(navbarConfig.maxTopLevelCategories);
    return { topLevelCategories: top, dropdownCategories: remaining };
  }, [categories, navbarConfig.maxTopLevelCategories]);

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

          {/* Left Navigation Links (Desktop) - 100% Dynamically Governed by Admin Panel */}
          <nav className="hidden lg:flex items-center gap-7">
            {/* 1. Dynamic Primary Top-Level Categories */}
            {topLevelCategories.map((cat) => {
              const hasChildren = Array.isArray(cat.children) && cat.children.length > 0;
              const isMenuOpen = activeDropdown === `cat-${cat.id}`;

              return (
                <div
                  key={cat.id}
                  className="relative"
                  onMouseEnter={() => (hasChildren ? handleDropdownEnter(`cat-${cat.id}`) : undefined)}
                  onMouseLeave={hasChildren ? handleDropdownLeave : undefined}
                >
                  <Link
                    href={`/categories/${cat.slug}`}
                    className={`text-xs font-semibold uppercase tracking-widest transition-colors flex items-center gap-1 py-2 cursor-pointer ${
                      isMenuOpen
                        ? "text-amber-700"
                        : "text-[var(--foreground)] hover:text-amber-700"
                    }`}
                  >
                    <span>{cat.name}</span>
                    {hasChildren && (
                      <ChevronDown
                        className={`w-3.5 h-3.5 transition-transform duration-200 ${
                          isMenuOpen ? "rotate-180 text-amber-700" : ""
                        }`}
                      />
                    )}
                  </Link>

                  {/* Subcategories Dropdown for Category */}
                  {hasChildren && isMenuOpen && (
                    <div className="absolute top-full left-0 w-72 bg-white border border-neutral-200 rounded-2xl shadow-xl p-4 animate-in fade-in slide-in-from-top-2 duration-150 z-50 text-neutral-900">
                      <div className="pb-2.5 mb-2.5 border-b border-neutral-100 flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800">
                          {cat.name} Collection
                        </span>
                        <Link
                          href={`/categories/${cat.slug}`}
                          onClick={() => setActiveDropdown(null)}
                          className="text-[11px] font-semibold text-neutral-500 hover:text-amber-800 flex items-center gap-1 transition-colors"
                        >
                          <span>View All</span>
                          <ArrowRight className="w-3 h-3" />
                        </Link>
                      </div>

                      <div className="space-y-1">
                        {cat.children!.map((subcat) => (
                          <Link
                            key={subcat.id}
                            href={`/categories/${subcat.slug}`}
                            onClick={() => setActiveDropdown(null)}
                            className="block px-2.5 py-1.5 rounded-lg text-xs text-neutral-700 hover:text-amber-800 hover:bg-neutral-50 transition-colors font-medium"
                          >
                            <div className="flex items-center justify-between">
                              <span>{subcat.name}</span>
                              {typeof subcat.productCount === "number" && subcat.productCount > 0 && (
                                <span className="text-[10px] text-neutral-400 font-mono">
                                  {subcat.productCount}
                                </span>
                              )}
                            </div>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            {/* 2. Dynamic "CATEGORIES" Mega Menu Dropdown */}
            {navbarConfig.showCategoriesDropdown && categories.length > 0 && (
              <div
                className="relative"
                onMouseEnter={() => handleDropdownEnter("all-categories")}
                onMouseLeave={handleDropdownLeave}
              >
                <Link
                  href="/categories"
                  className={`text-xs font-semibold uppercase tracking-widest transition-colors flex items-center gap-1 py-2 cursor-pointer ${
                    activeDropdown === "all-categories"
                      ? "text-amber-700"
                      : "text-[var(--foreground)] hover:text-amber-700"
                  }`}
                >
                  <span>CATEGORIES</span>
                  <ChevronDown
                    className={`w-3.5 h-3.5 transition-transform duration-200 ${
                      activeDropdown === "all-categories" ? "rotate-180 text-amber-700" : ""
                    }`}
                  />
                </Link>

                {/* Clean Multi-Column Categories Dropdown */}
                {activeDropdown === "all-categories" && (
                  <div className="absolute top-full left-0 w-[480px] bg-white border border-neutral-200 rounded-2xl shadow-2xl p-5 animate-in fade-in slide-in-from-top-2 duration-150 z-50 text-neutral-900">
                    <div className="grid grid-cols-2 gap-5 max-h-[360px] overflow-y-auto pr-1">
                      {categories.map((rootCat) => (
                        <div key={rootCat.id} className="space-y-2">
                          <Link
                            href={`/categories/${rootCat.slug}`}
                            onClick={() => setActiveDropdown(null)}
                            className="text-xs font-bold uppercase tracking-wider text-amber-900 hover:text-amber-700 block pb-1 border-b border-neutral-100"
                          >
                            {rootCat.name}
                          </Link>

                          {Array.isArray(rootCat.children) && rootCat.children.length > 0 ? (
                            <div className="space-y-1">
                              {rootCat.children.slice(0, 5).map((child) => (
                                <Link
                                  key={child.id}
                                  href={`/categories/${child.slug}`}
                                  onClick={() => setActiveDropdown(null)}
                                  className="text-[11px] text-neutral-600 hover:text-amber-800 transition-colors block py-0.5 truncate"
                                >
                                  {child.name}
                                </Link>
                              ))}
                              {rootCat.children.length > 5 && (
                                <Link
                                  href={`/categories/${rootCat.slug}`}
                                  onClick={() => setActiveDropdown(null)}
                                  className="text-[10px] text-amber-700 font-semibold hover:underline block pt-0.5"
                                >
                                  +{rootCat.children.length - 5} more...
                                </Link>
                              )}
                            </div>
                          ) : (
                            <p className="text-[11px] text-neutral-400 italic">Explore collection</p>
                          )}
                        </div>
                      ))}
                    </div>

                    {/* All Categories Link Footer */}
                    <div className="border-t border-neutral-100 pt-3 mt-4 flex items-center justify-between">
                      <Link
                        href="/categories"
                        onClick={() => setActiveDropdown(null)}
                        className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-neutral-900 hover:text-amber-700 transition-colors"
                      >
                        <span>Explore All Categories</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                      <span className="text-[10px] text-neutral-400 font-mono">
                        {categories.length} departments
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 3. Dynamic "SHOP ALL" Link (Admin Toggleable) */}
            {navbarConfig.showShopAll && (
              <Link
                href="/products"
                className="text-xs font-semibold uppercase tracking-widest text-[var(--foreground)] hover:text-amber-700 transition-colors"
              >
                SHOP ALL
              </Link>
            )}

            {/* 4. Dynamic "SALE" Link (Admin Toggleable & Configurable) */}
            {navbarConfig.showSale && (
              <Link
                href={navbarConfig.saleUrl || "/products?sort=best_deals"}
                className="text-xs font-bold uppercase tracking-widest text-rose-600 hover:text-rose-800 transition-colors flex items-center gap-1"
              >
                <span>{navbarConfig.saleLabel || "SALE"}</span>
              </Link>
            )}
          </nav>

          {/* Center Brand Logo */}
          <div className="flex-1 lg:flex-none text-center">
            <Link href="/" className="inline-flex items-center justify-center gap-2.5 group py-1">
              {storeConfig.logo?.dark ? (
                <img
                  src={storeConfig.logo.dark}
                  alt={storeConfig.logo.alt || storeConfig.name}
                  className="h-16 sm:h-20 md:h-[78px] w-auto max-w-[260px] sm:max-w-[340px] md:max-w-[400px] object-contain transition-transform group-hover:scale-105"
                />
              ) : null}
              {(!storeConfig.logo?.dark || storeConfig.logo?.showTextAlongsideLogo) && (
                <span className="font-heading text-lg sm:text-2xl font-bold tracking-widest text-[var(--foreground)] uppercase">
                  {storeConfig.name}
                </span>
              )}
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

            {/* Desktop View Track Order Button */}
            <Link
              href="/track-order"
              aria-label="Track Order"
              title="Track Order"
              className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold tracking-wider uppercase text-[var(--foreground)] hover:text-amber-800 hover:bg-neutral-100/80 border border-neutral-200/60 shadow-2xs transition-all cursor-pointer"
            >
              <Truck className="w-3.5 h-3.5 text-amber-700" />
              <span className="hidden xl:inline">Track Order</span>
            </Link>

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
                {isMounted && isAuthenticated && wishlistCount > 0 && (
                  <span className="bg-rose-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center border border-[var(--background)] animate-in zoom-in-50 absolute -top-0.5 -right-0.5">
                    {wishlistCount}
                  </span>
                )}
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

      {/* Mobile Drawer Menu - 100% Dynamically Generated with Nested Accordions */}
      {isMobileMenuOpen && (
        <div className="lg:hidden bg-[var(--background)] border-b border-[var(--border)] px-6 py-6 space-y-4 animate-in slide-in-from-top-2 max-h-[80vh] overflow-y-auto">
          {/* Mobile Drawer Brand Header */}
          <div className="flex items-center gap-3 pb-4 border-b border-[var(--border)]">
            {storeConfig.logo?.dark ? (
              <img
                src={storeConfig.logo.dark}
                alt={storeConfig.logo.alt || storeConfig.name}
                className="h-14 sm:h-16 w-auto max-w-[200px] object-contain"
              />
            ) : null}
            <span className="font-heading text-sm font-bold uppercase tracking-wider text-[var(--foreground)]">
              {storeConfig.name}
            </span>
          </div>

          {/* Dynamic Categories in Mobile Drawer */}
          <div className="space-y-2">
            {categories.map((cat) => {
              const hasChildren = Array.isArray(cat.children) && cat.children.length > 0;
              const isExpanded = !!expandedMobileCategories[cat.id];

              return (
                <div key={cat.id} className="border-b border-[var(--border)]/40 pb-2">
                  <div className="flex items-center justify-between">
                    <Link
                      href={`/categories/${cat.slug}`}
                      onClick={closeMobileMenu}
                      className="text-sm font-semibold uppercase tracking-widest text-[var(--foreground)] hover:text-amber-700 transition-colors py-1 flex-1"
                    >
                      {cat.name}
                    </Link>

                    {hasChildren && (
                      <button
                        onClick={() => toggleMobileCategory(cat.id)}
                        className="p-1.5 text-neutral-400 hover:text-[var(--foreground)] transition-colors"
                        aria-label={`Expand ${cat.name} subcategories`}
                      >
                        <ChevronDown
                          className={`w-4 h-4 transition-transform duration-200 ${
                            isExpanded ? "rotate-180 text-amber-700" : ""
                          }`}
                        />
                      </button>
                    )}
                  </div>

                  {/* Accordion Subcategories */}
                  {hasChildren && isExpanded && (
                    <div className="pl-4 pt-1 space-y-1.5 mt-1 border-l-2 border-amber-600/30">
                      {cat.children!.map((subcat) => (
                        <Link
                          key={subcat.id}
                          href={`/categories/${subcat.slug}`}
                          onClick={closeMobileMenu}
                          className="block text-xs text-neutral-600 hover:text-amber-700 py-0.5 transition-colors"
                        >
                          {subcat.name}
                        </Link>
                      ))}
                      <Link
                        href={`/categories/${cat.slug}`}
                        onClick={closeMobileMenu}
                        className="block text-[11px] font-bold text-amber-800 hover:underline pt-1"
                      >
                        View All {cat.name} →
                      </Link>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* All Categories Link */}
          <Link
            href="/categories"
            onClick={closeMobileMenu}
            className="block text-sm font-semibold uppercase tracking-widest text-amber-800 hover:text-amber-900 transition-colors pt-2"
          >
            All Categories Directory
          </Link>

          {/* Shop All Link */}
          {navbarConfig.showShopAll && (
            <Link
              href="/products"
              onClick={closeMobileMenu}
              className="block text-sm font-semibold uppercase tracking-widest text-[var(--foreground)] hover:text-amber-700 transition-colors"
            >
              Shop All
            </Link>
          )}

          <Link
            href="/products?sort=newest"
            onClick={closeMobileMenu}
            className="block text-sm font-semibold uppercase tracking-widest text-[var(--foreground)] hover:text-amber-700 transition-colors"
          >
            New Arrivals
          </Link>

          {/* Sale Link */}
          {navbarConfig.showSale && (
            <Link
              href={navbarConfig.saleUrl || "/products?sort=best_deals"}
              onClick={closeMobileMenu}
              className="block text-sm font-bold uppercase tracking-widest text-rose-600 hover:text-rose-800 transition-colors"
            >
              {navbarConfig.saleLabel || "Sale & Special Deals"}
            </Link>
          )}

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

            <Link
              href="/track-order"
              onClick={closeMobileMenu}
              className="block text-sm font-semibold uppercase tracking-widest text-amber-700 hover:text-amber-800 transition-colors"
            >
              Track Order
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
