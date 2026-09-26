import React from "react";
import { HeroSection } from "@/components/home/HeroSection";
import { FeaturedCategories } from "@/components/home/FeaturedCategories";
import { FeaturedProducts } from "@/components/home/FeaturedProducts";
import { PromoBanner } from "@/components/home/PromoBanner";
import { ShopByOccasion } from "@/components/home/ShopByOccasion";
import { SocialLookbook } from "@/components/home/SocialLookbook";
import { BrandStory } from "@/components/home/BrandStory";

export default function HomePage() {
  return (
    <div className="flex flex-col w-full">
      {/* 1. Large Hero Banner */}
      <HeroSection />

      {/* 2. Shop By Category (Dynamic) */}
      <FeaturedCategories />

      {/* 3. New Arrivals */}
      <FeaturedProducts
        title="NEW ARRIVALS"
        subtitle="EXPLORE THE LATEST STYLES"
        type="newArrivals"
        viewAllLink="/products?sort=newest"
      />

      {/* 4. Best Sellers */}
      <FeaturedProducts
        title="BEST SELLERS"
        subtitle="OUR MOST LOVED STYLES"
        type="bestSellers"
        viewAllLink="/products?sort=best-selling"
      />

      {/* 5. Promotional Offer / Festive Banner */}
      <PromoBanner />

      {/* 6. Trending Now */}
      <FeaturedProducts
        title="TRENDING NOW"
        subtitle="CURATED SEASONAL ICONS"
        type="featured"
        viewAllLink="/products"
      />

      {/* 7. Shop By Occasion */}
      <ShopByOccasion />

      {/* 8. Community Instagram Lookbook */}
      <SocialLookbook />

      {/* 9. Brand Heritage Story */}
      <BrandStory />
    </div>
  );
}
