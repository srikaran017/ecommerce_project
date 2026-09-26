export interface StoreConfig {
  id: string;
  name: string;
  tagline: string;
  description: string;
  logo: {
    dark: string;
    light: string;
    alt: string;
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
}

export const storeConfig: StoreConfig = {
  id: "store_luxe_couture_01",
  name: "MAISON DE ÉLÉGANCE",
  tagline: "Contemporary Haute Couture & Everyday Luxury",
  description: "Curated collection of handcrafted apparel, luxury silhouettes, and premium contemporary fashion for the modern aesthetic.",
  logo: {
    dark: "/images/logo-dark.png",
    light: "/images/logo-light.png",
    alt: "Maison De Élégance Logo"
  },
  favicon: "/favicon.ico",
  contact: {
    email: "concierge@maison-elegance.com",
    phone: "+91 98765 43210",
    whatsapp: "+91 98765 43210",
    supportHours: "Mon - Sat: 10:00 AM - 7:00 PM IST",
    address: {
      street: "45 Fashion Boulevard, Designer District",
      city: "Mumbai",
      state: "Maharashtra",
      postalCode: "400051",
      country: "India"
    }
  },
  social: {
    instagram: "https://instagram.com/maison_elegance",
    facebook: "https://facebook.com/maisonelegance",
    pinterest: "https://pinterest.com/maisonelegance",
    youtube: "https://youtube.com/@maisonelegance"
  },
  currency: {
    code: "INR",
    symbol: "₹",
    format: "{symbol}{amount}"
  },
  seo: {
    defaultTitle: "Maison De Élégance | Luxury Apparel & Designer Fashion",
    titleTemplate: "%s | Maison De Élégance",
    defaultDescription: "Discover luxury dresses, shirts, tailored suits, and ethnic couture. Handcrafted with ultra-premium fabrics.",
    keywords: ["Luxury Clothing", "Designer Fashion", "Haute Couture", "Silk Dresses", "Tailored Apparel"],
    ogImage: "/images/og-banner.jpg"
  },
  tax: {
    includedInPrice: true,
    defaultTaxRatePercentage: 12
  },
  shipping: {
    freeShippingThreshold: 2999,
    flatRate: 150,
    estimatedDeliveryDays: "3 - 5 Business Days"
  }
};
