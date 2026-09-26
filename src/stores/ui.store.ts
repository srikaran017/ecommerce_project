import { create } from "zustand";
import { themeConfig, ThemeConfig, PRESET_THEMES } from "@/config/theme.config";

interface UIState {
  isMobileMenuOpen: boolean;
  isSearchOpen: boolean;
  activeTheme: ThemeConfig;
  quickViewProductId: string | null;

  toggleMobileMenu: () => void;
  closeMobileMenu: () => void;
  toggleSearch: () => void;
  closeSearch: () => void;
  setQuickViewProductId: (id: string | null) => void;
  setTheme: (themeId: string) => void;
}

export const useUIStore = create<UIState>((set) => ({
  isMobileMenuOpen: false,
  isSearchOpen: false,
  activeTheme: themeConfig,
  quickViewProductId: null,

  toggleMobileMenu: () =>
    set((state) => ({ isMobileMenuOpen: !state.isMobileMenuOpen })),
  closeMobileMenu: () => set({ isMobileMenuOpen: false }),

  toggleSearch: () => set((state) => ({ isSearchOpen: !state.isSearchOpen })),
  closeSearch: () => set({ isSearchOpen: false }),

  setQuickViewProductId: (id) => set({ quickViewProductId: id }),

  setTheme: (themeId) => {
    const selected = PRESET_THEMES[themeId] || themeConfig;
    set({ activeTheme: selected });

    // Dynamically update DOM CSS custom properties
    if (typeof document !== "undefined") {
      const root = document.documentElement;
      root.style.setProperty("--primary", selected.primaryColor);
      root.style.setProperty("--primary-foreground", selected.primaryForeground);
      root.style.setProperty("--secondary", selected.secondaryColor);
      root.style.setProperty("--secondary-foreground", selected.secondaryForeground);
      root.style.setProperty("--accent", selected.accentColor);
      root.style.setProperty("--accent-foreground", selected.accentForeground);
      root.style.setProperty("--background", selected.backgroundColor);
      root.style.setProperty("--foreground", selected.foregroundColor);
      root.style.setProperty("--muted", selected.mutedColor);
      root.style.setProperty("--muted-foreground", selected.mutedForeground);
      root.style.setProperty("--border", selected.borderColor);
      root.style.setProperty("--button-bg", selected.buttonColor);
      root.style.setProperty("--button-text", selected.buttonTextColor);
      root.style.setProperty("--font-heading", selected.headingFont);
      root.style.setProperty("--font-body", selected.bodyFont);
      root.style.setProperty("--radius", selected.borderRadius);
    }
  },
}));
