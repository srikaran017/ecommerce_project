/**
 * =========================================================================
 * STORE WHITE-LABEL CONFIGURATION (SINGLE SOURCE OF TRUTH)
 * =========================================================================
 * To customize this application for any client:
 * 1. Change `storeConfig.name` below to update the shop name everywhere.
 * 2. Put the client's logo in `public/images/logo.jpg` and update `storeConfig.logo`.
 * 3. Update contact information, address, and social links.
 *
 * This SINGLE FILE dynamically powers:
 * - Header / Navbar (brand logo image, alt text, and shop name)
 * - Mobile navigation drawer
 * - Footer (brand logo, shop description, copyright, and social links)
 * - Admin Panel (sidebar brand header and order CSV exports)
 * - Login, Signup, and Password Reset screens
 * - Checkout screen & Razorpay modal merchant name
 * - Order confirmation emails & Order Tracking Modal (Tax invoices)
 * - Dynamic SEO meta tags, OpenGraph previews, and browser tab titles
 * =========================================================================
 */

export interface StoreConfig {
  id: string;
  name: string;
  tagline: string;
  description: string;
  logo: {
    dark: string;
    light: string;
    alt: string;
    showTextAlongsideLogo?: boolean; // Set to true to show text beside logo image; false shows logo cleanly
  };
  favicon: string;
  contact: {
    email: string;
    phone: string;
    whatsapp: string;
    supportHours: string;
    address: {
      street: string;
      city: string;
      state: string;
      postalCode: string;
      country: string;
    };
  };
  social: {
    instagram?: string;
    facebook?: string;
    twitter?: string;
    pinterest?: string;
    youtube?: string;
  };
  currency: {
    code: string;
    symbol: string;
    format: string; // e.g. "{symbol}{amount}"
  };
  seo: {
    defaultTitle: string;
    titleTemplate: string;
    defaultDescription: string;
    keywords: string[];
    ogImage: string;
  };
  tax: {
    includedInPrice: boolean;
    defaultTaxRatePercentage: number;
  };
  shipping: {
    freeShippingThreshold: number;
    flatRate: number;
    estimatedDeliveryDays: string;
  };
  payment: {
    upiId: string;
    payeeName: string;
    codMaxLimit: number;
    instructions: string;
  };
}

export const storeConfig: StoreConfig = {
  id: "store_saayal_stories_01",
  name: "SAAYAL STORIES",
  tagline: "Contemporary Haute Couture, Festive Silks & Curated Stories",
  description: "Curated collection of handcrafted apparel, luxury silhouettes, and festive ethnic couture by Saayal Stories.",
  logo: {
    dark: "/images/logo.png",
    light: "/images/logo-light.png",
    alt: "Saayal Stories Logo",
    showTextAlongsideLogo: false, // The logo image features elegant cursive script; set true if you want name text alongside
  },
  favicon: "/favicon.ico",
  contact: {
    email: "subashini.official@gmail.com",
    phone: "+91 91597 89485",
    whatsapp: "+91 91597 89485",
    supportHours: "Mon - Sat: 10:00 AM - 7:00 PM IST",
    address: {
      street: "Mugappair",
      city: "Chennai",
      state: "TamilNadu",
      postalCode: "600101",
      country: "India"
    }
  },
  social: {
    instagram: "https://www.instagram.com/saayal_stories",
    facebook: "https://facebook.com/saayal_stories",
    pinterest: "https://pinterest.com/saayal_stories",
    youtube: "https://youtube.com/@subashini0702"
  },
  currency: {
    code: "INR",
    symbol: "₹",
    format: "{symbol}{amount}"
  },
  seo: {
    defaultTitle: "Saayal Stories | Luxury Apparel & Designer Fashion",
    titleTemplate: "%s | Saayal Stories",
    defaultDescription: "Discover luxury dresses, handcrafted silks, festive sarees, and bespoke couture at Saayal Stories.",
    keywords: ["Saayal Stories", "Luxury Clothing", "Designer Fashion", "Haute Couture", "Silk Dresses", "Festive Ensembles"],
    ogImage: "/images/logo.png"
  },
  tax: {
    includedInPrice: true,
    defaultTaxRatePercentage: 0
  },
  shipping: {
    // freeShippingThreshold: 4999, // Complimentary delivery for orders >= ₹2,999
    freeShippingThreshold: Infinity, // Flat delivery fee applies to all customers
    flatRate: 150,
    estimatedDeliveryDays: "3 - 5 Business Days"
  },
  payment: {
    upiId: "subashini9333-3@okhdfcbank", // Client's single authoritative UPI ID
    payeeName: "SAAYAL STORIES",
    codMaxLimit: 10000, // COD Limit
    instructions: "Scan the QR code or tap 'Pay via UPI App', then enter your 12-digit UPI Reference / UTR Number below to confirm.",
  }
};

/**
 * Single authoritative variable for the client's store UPI ID.
 * Changing `storeConfig.payment.upiId` above automatically updates this across all pages and services.
 */
export const STORE_UPI_ID = storeConfig.payment.upiId;
