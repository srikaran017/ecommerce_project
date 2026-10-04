import type { Metadata } from "next";
import { Playfair_Display, Inter, Cinzel, Outfit, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { storeConfig } from "@/config/store.config";
import { ThemeScript } from "@/components/layout/ThemeScript";
import { AnnouncementBar } from "@/components/layout/AnnouncementBar";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { CartDrawer } from "@/components/cart/CartDrawer";
import { SearchModal } from "@/components/layout/SearchModal";
import { AuthInitializer } from "@/components/auth/AuthInitializer";

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const cinzel = Cinzel({
  subsets: ["latin"],
  variable: "--font-cinzel",
  display: "swap",
});

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  display: "swap",
});

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-plus-jakarta",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"),
  title: {
    default: storeConfig.seo.defaultTitle,
    template: storeConfig.seo.titleTemplate,
  },
  description: storeConfig.seo.defaultDescription,
  keywords: storeConfig.seo.keywords,
  openGraph: {
    title: storeConfig.seo.defaultTitle,
    description: storeConfig.seo.defaultDescription,
    images: [{ url: storeConfig.seo.ogImage }],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${playfair.variable} ${inter.variable} ${cinzel.variable} ${outfit.variable} ${plusJakarta.variable} h-full antialiased`}
    >
      <head>
        <ThemeScript />
      </head>
      <body className="min-h-full flex flex-col bg-[var(--background)] text-[var(--foreground)] selection:bg-[var(--primary)] selection:text-[var(--primary-foreground)]">
        <AuthInitializer />
        <AnnouncementBar />
        <Navbar />
        <main className="flex-1">{children}</main>
        <Footer />
        <CartDrawer />
        <SearchModal />
      </body>
    </html>
  );
}
