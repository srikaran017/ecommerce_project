export interface HomepageConfig {
  hero: boolean;
  categories: boolean;
  featuredProducts: boolean;
  newArrivals: boolean;
  bestSellers: boolean;
  promotionalBanner: boolean;
  brandStory: boolean;
  testimonials: boolean;
  instagramSection: boolean;
  newsletter: boolean;
  heroContent: {
    badge: string;
    heading: string;
    subheading: string;
    primaryCtaText: string;
    primaryCtaLink: string;
    secondaryCtaText: string;
    secondaryCtaLink: string;
    backgroundImage: string;
  };
  promoBannerContent: {
    heading: string;
    subheading: string;
    ctaText: string;
    ctaLink: string;
    backgroundImage: string;
  };
  brandStoryContent: {
    title: string;
    subtitle: string;
    description: string;
    image: string;
    highlights: Array<{ label: string; detail: string }>;
  };
}

export const homepageConfig: HomepageConfig = {
  hero: true,
  categories: true,
  featuredProducts: true,
  newArrivals: true,
  bestSellers: true,
  promotionalBanner: true,
  brandStory: true,
  testimonials: true,
  instagramSection: true,
  newsletter: true,

  heroContent: {
    badge: "AUTUMN / WINTER '26 COLLECTION",
    heading: "Elegance Redefined In Modern Silk & Linen",
    subheading: "Hand-tailored couture created with sustainable artisan fabrics. Discover timeless silhouettes for the minimalist wardrobe.",
    primaryCtaText: "EXPLORE COLLECTION",
    primaryCtaLink: "/products",
    secondaryCtaText: "OUR HERITAGE",
    secondaryCtaLink: "/#brand-story",
    backgroundImage: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=2000&auto=format&fit=crop",
  },

  promoBannerContent: {
    heading: "PRIVATE FASHION PREVIEW",
    subheading: "Enjoy complimentary express worldwide delivery & personal tailoring on orders over ₹5,000.",
    ctaText: "SHOP NEW ARRIVALS",
    ctaLink: "/products?sort=newest",
    backgroundImage: "https://images.unsplash.com/photo-1445205170230-053b83016050?q=80&w=2000&auto=format&fit=crop",
  },

  brandStoryContent: {
    title: "CRAFTED WITH INTENTION",
    subtitle: "A modern atelier rooted in heritage craftsmanship.",
    description: "Every Maison garment is crafted from ethically sourced pure organic cotton, mulberry silk, and handloom linen. We fuse old-world tailoring techniques with modern minimalist cuts to create garments designed to endure for generations.",
    image: "https://images.unsplash.com/photo-1537832816519-689ad163238b?q=80&w=1200&auto=format&fit=crop",
    highlights: [
      { label: "100% Organic", detail: "Pure natural fibers sourced directly from sustainable looms." },
      { label: "Artisanal Tailoring", detail: "Hand-finished seams and precision fits for maximum comfort." },
      { label: "Zero Waste", detail: "Sustainable production cycle minimizing eco-footprint." },
    ],
  },
};
