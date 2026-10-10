export interface ThemeConfig {
  id: string;
  name: string;
  primaryColor: string;
  primaryForeground: string;
  secondaryColor: string;
  secondaryForeground: string;
  accentColor: string;
  accentForeground: string;
  backgroundColor: string;
  foregroundColor: string;
  mutedColor: string;
  mutedForeground: string;
  borderColor: string;
  buttonColor: string;
  buttonTextColor: string;
  headingFont: string;
  bodyFont: string;
  borderRadius: string; // e.g. "0px", "0.25rem", "0.5rem"
}

export const PRESET_THEMES: Record<string, ThemeConfig> = {
  "luxury-fashion": {
    id: "luxury-fashion",
    name: "Luxury Fashion",
    primaryColor: "#1a1a1a",
    primaryForeground: "#ffffff",
    secondaryColor: "#9b804e", // Subtle gold
    secondaryForeground: "#ffffff",
    accentColor: "#d4af37", // Rich Metallic Gold
    accentForeground: "#000000",
    backgroundColor: "#faf9f6", // Off-white alabaster
    foregroundColor: "#121212",
    mutedColor: "#f0eeea",
    mutedForeground: "#737373",
    borderColor: "#e5e2dc",
    buttonColor: "#1a1a1a",
    buttonTextColor: "#ffffff",
    headingFont: "'Playfair Display', Georgia, serif",
    bodyFont: "'Inter', sans-serif",
    borderRadius: "0px", // Crisp editorial edges
  },
  "minimal-boutique": {
    id: "minimal-boutique",
    name: "Minimal Boutique",
    primaryColor: "#262626",
    primaryForeground: "#ffffff",
    secondaryColor: "#e5e5e5",
    secondaryForeground: "#171717",
    accentColor: "#a3a3a3",
    accentForeground: "#ffffff",
    backgroundColor: "#ffffff",
    foregroundColor: "#171717",
    mutedColor: "#f5f5f5",
    mutedForeground: "#737373",
    borderColor: "#e5e5e5",
    buttonColor: "#171717",
    buttonTextColor: "#ffffff",
    headingFont: "'Plus Jakarta Sans', sans-serif",
    bodyFont: "'Inter', sans-serif",
    borderRadius: "0.25rem",
  },
  "modern-streetwear": {
    id: "modern-streetwear",
    name: "Modern Streetwear",
    primaryColor: "#0f172a",
    primaryForeground: "#f8fafc",
    secondaryColor: "#2563eb", // Vibrant Electric Blue
    secondaryForeground: "#ffffff",
    accentColor: "#f97316", // Neon Coral Orange
    accentForeground: "#ffffff",
    backgroundColor: "#090d16", // Dark Slate
    foregroundColor: "#f8fafc",
    mutedColor: "#1e293b",
    mutedForeground: "#94a3b8",
    borderColor: "#334155",
    buttonColor: "#2563eb",
    buttonTextColor: "#ffffff",
    headingFont: "'Outfit', sans-serif",
    bodyFont: "'Inter', sans-serif",
    borderRadius: "0.5rem",
  },
  "elegant-ethnic": {
    id: "elegant-ethnic",
    name: "Elegant Ethnic",
    primaryColor: "#581c87", // Deep Royal Purple
    primaryForeground: "#ffffff",
    secondaryColor: "#9a3412", // Terracotta Rust
    secondaryForeground: "#ffffff",
    accentColor: "#d97706", // Amber Gold
    accentForeground: "#ffffff",
    backgroundColor: "#fdfbf7", // Warm Parchment
    foregroundColor: "#2e1065",
    mutedColor: "#f3e8ff",
    mutedForeground: "#6b21a8",
    borderColor: "#e9d5ff",
    buttonColor: "#581c87",
    buttonTextColor: "#ffffff",
    headingFont: "'Cinzel', serif",
    bodyFont: "'Inter', sans-serif",
    borderRadius: "0.25rem",
  },
  "premium-black-gold": {
    id: "premium-black-gold",
    name: "Premium Black & Gold",
    primaryColor: "#000000",
    primaryForeground: "#f59e0b",
    secondaryColor: "#1c1917",
    secondaryForeground: "#fbbf24",
    accentColor: "#f59e0b", // Gold
    accentForeground: "#000000",
    backgroundColor: "#0c0a09",
    foregroundColor: "#f5f5f4",
    mutedColor: "#1c1917",
    mutedForeground: "#a8a29e",
    borderColor: "#292524",
    buttonColor: "#f59e0b",
    buttonTextColor: "#000000",
    headingFont: "'Cinzel Decorative', 'Cinzel', serif",
    bodyFont: "'Inter', sans-serif",
    borderRadius: "0px",
  },
  "soft-pastel": {
    id: "soft-pastel",
    name: "Soft Pastel",
    primaryColor: "#701a75",
    primaryForeground: "#ffffff",
    secondaryColor: "#fbcfe8", // Rose Pastel
    secondaryForeground: "#831843",
    accentColor: "#cbd5e1",
    accentForeground: "#0f172a",
    backgroundColor: "#fff5f7",
    foregroundColor: "#4c0519",
    mutedColor: "#ffe4e6",
    mutedForeground: "#9f1239",
    borderColor: "#fecdd3",
    buttonColor: "#be185d",
    buttonTextColor: "#ffffff",
    headingFont: "'Playfair Display', serif",
    bodyFont: "'Inter', sans-serif",
    borderRadius: "0.75rem",
  },
  "clean-white": {
    id: "clean-white",
    name: "Clean White",
    primaryColor: "#000000",
    primaryForeground: "#ffffff",
    secondaryColor: "#f4f4f5",
    secondaryForeground: "#18181b",
    accentColor: "#18181b",
    accentForeground: "#ffffff",
    backgroundColor: "#ffffff",
    foregroundColor: "#09090b",
    mutedColor: "#f4f4f5",
    mutedForeground: "#71717a",
    borderColor: "#e4e4e7",
    buttonColor: "#000000",
    buttonTextColor: "#ffffff",
    headingFont: "'Inter', sans-serif",
    bodyFont: "'Inter', sans-serif",
    borderRadius: "0.375rem",
  },
  "contemporary-fashion": {
    id: "contemporary-fashion",
    name: "Contemporary Fashion",
    primaryColor: "#111827",
    primaryForeground: "#ffffff",
    secondaryColor: "#059669", // Emerald Accent
    secondaryForeground: "#ffffff",
    accentColor: "#10b981",
    accentForeground: "#ffffff",
    backgroundColor: "#f9fafb",
    foregroundColor: "#111827",
    mutedColor: "#f3f4f6",
    mutedForeground: "#6b7280",
    borderColor: "#e5e7eb",
    buttonColor: "#111827",
    buttonTextColor: "#ffffff",
    headingFont: "'Plus Jakarta Sans', sans-serif",
    bodyFont: "'Inter', sans-serif",
    borderRadius: "0.25rem",
  },
  "monochrome-minimal": {
    id: "monochrome-minimal",
    name: "Monochrome Minimal",
    primaryColor: "#0f172a",
    primaryForeground: "#ffffff",
    secondaryColor: "#64748b",
    secondaryForeground: "#ffffff",
    accentColor: "#475569",
    accentForeground: "#ffffff",
    backgroundColor: "#ffffff",
    foregroundColor: "#09090b",
    mutedColor: "#f1f5f9",
    mutedForeground: "#64748b",
    borderColor: "#e2e8f0",
    buttonColor: "#0f172a",
    buttonTextColor: "#ffffff",
    headingFont: "'Inter', sans-serif",
    bodyFont: "'Inter', sans-serif",
    borderRadius: "0.25rem",
  },
  "royal-festive": {
    id: "royal-festive",
    name: "Royal Festive",
    primaryColor: "#7f1d1d",
    primaryForeground: "#ffffff",
    secondaryColor: "#b45309",
    secondaryForeground: "#ffffff",
    accentColor: "#fbbf24",
    accentForeground: "#7f1d1d",
    backgroundColor: "#fffbeb",
    foregroundColor: "#450a0a",
    mutedColor: "#fef3c7",
    mutedForeground: "#92400e",
    borderColor: "#fde68a",
    buttonColor: "#7f1d1d",
    buttonTextColor: "#ffffff",
    headingFont: "'Playfair Display', Georgia, serif",
    bodyFont: "'Inter', sans-serif",
    borderRadius: "0.125rem",
  },
};

// Default active theme selection
export const themeConfig: ThemeConfig = PRESET_THEMES["luxury-fashion"];

export function generateCssVariables(theme: ThemeConfig = themeConfig): string {
  return `
    :root {
      --primary: ${theme.primaryColor};
      --primary-foreground: ${theme.primaryForeground};
      --secondary: ${theme.secondaryColor};
      --secondary-foreground: ${theme.secondaryForeground};
      --accent: ${theme.accentColor};
      --accent-foreground: ${theme.accentForeground};
      --background: ${theme.backgroundColor};
      --foreground: ${theme.foregroundColor};
      --muted: ${theme.mutedColor};
      --muted-foreground: ${theme.mutedForeground};
      --border: ${theme.borderColor};
      --button-bg: ${theme.buttonColor};
      --button-text: ${theme.buttonTextColor};
      --font-heading: ${theme.headingFont};
      --font-body: ${theme.bodyFont};
      --radius: ${theme.borderRadius};
    }
  `.replace(/\s+/g, ' ');
}
