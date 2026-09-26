import React from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { homepageConfig } from "@/config/homepage.config";
import { Button } from "@/components/ui/Button";

export function PromoBanner() {
  if (!homepageConfig.promotionalBanner) return null;

  const { promoBannerContent } = homepageConfig;

  return (
    <section className="relative py-28 overflow-hidden bg-[var(--primary)] text-[var(--primary-foreground)]">
      {/* Background Graphic with Vignette */}
      <div className="absolute inset-0 z-0">
        <img
          src={promoBannerContent.backgroundImage}
          alt="Promotional Fashion Feature"
          className="w-full h-full object-cover object-center opacity-30"
        />
        <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-6 text-center space-y-6">
        <span className="text-[11px] font-bold uppercase tracking-[0.3em] text-[var(--accent)]">
          EXCLUSIVE OFFER
        </span>

        <h2 className="font-heading text-3xl sm:text-5xl font-bold uppercase tracking-tight text-white">
          {promoBannerContent.heading}
        </h2>

        <p className="text-sm sm:text-base opacity-90 max-w-xl mx-auto leading-relaxed text-white/90">
          {promoBannerContent.subheading}
        </p>

        <div className="pt-4">
          <Link href={promoBannerContent.ctaLink}>
            <Button
              variant="accent"
              size="lg"
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              {promoBannerContent.ctaText}
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
