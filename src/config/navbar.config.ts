/**
 * Navbar Configuration & Admin State Management
 * Allows admins to dynamically control what links and categories appear in the storefront navigation bar.
 */

export interface NavbarConfig {
  showCategoriesDropdown: boolean;
  showShopAll: boolean;
  showSale: boolean;
  saleLabel: string;
  saleUrl: string;
  maxTopLevelCategories: number;
}

export const DEFAULT_NAVBAR_CONFIG: NavbarConfig = {
  showCategoriesDropdown: true,
  showShopAll: true,
  showSale: true,
  saleLabel: "SALE",
  saleUrl: "/products?sort=best_deals",
  maxTopLevelCategories: 4,
};

const STORAGE_KEY = "store_navbar_config";
export const NAVBAR_UPDATE_EVENT = "store_navbar_updated";

/**
 * Retrieves the current navbar configuration.
 */
export function getNavbarConfig(): NavbarConfig {
  if (typeof window === "undefined") {
    return DEFAULT_NAVBAR_CONFIG;
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_NAVBAR_CONFIG;
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULT_NAVBAR_CONFIG,
      ...parsed,
    };
  } catch {
    return DEFAULT_NAVBAR_CONFIG;
  }
}

/**
 * Saves updated navbar configuration and notifies listening components.
 */
export function saveNavbarConfig(updates: Partial<NavbarConfig>): NavbarConfig {
  const current = getNavbarConfig();
  const merged: NavbarConfig = {
    ...current,
    ...updates,
  };

  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
      window.dispatchEvent(new CustomEvent(NAVBAR_UPDATE_EVENT, { detail: merged }));
    } catch (e) {
      console.warn("Failed to persist navbar config to localStorage", e);
    }
  }

  return merged;
}
