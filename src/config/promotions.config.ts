export interface PromotionCampaign {
  id: string;
  title: string;
  subtitle: string;
  badge: string;
  discountPercentage: number;
  couponCode: string;
  startDate: string; // ISO date string
  endDate: string; // ISO date string
  backgroundImage: string;
  ctaText: string;
  ctaLink: string;
  isActive: boolean;
  targetCategorySlugs?: string[];
  termsAndConditions?: string;
}

export const ACTIVE_CAMPAIGN: PromotionCampaign = {
  id: "camp_festive_2026",
  title: "THE GRAND FESTIVE COUTURE SALE",
  subtitle: "Enjoy flat 20% savings on handloomed Banarasi silks, bridal lehengas, and artisanal kurtis.",
  badge: "LIMITED TIME FESTIVE EDIT",
  discountPercentage: 20,
  couponCode: "FESTIVE20",
  // Target 3 days from now for live countdown demonstration
  startDate: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
  endDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000 + 14 * 60 * 60 * 1000 + 32 * 60 * 1000).toISOString(),
  backgroundImage: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?q=80&w=2000&auto=format&fit=crop",
  ctaText: "SHOP THE FESTIVE SALE",
  ctaLink: "/products?sort=discount",
  isActive: true,
  termsAndConditions: "Applicable on orders above ₹4,999. Use code FESTIVE20 at checkout.",
};
