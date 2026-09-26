import React from "react";
import { homepageConfig } from "@/config/homepage.config";
import { Sparkles, ShieldCheck, Feather } from "lucide-react";

export function BrandStory() {
  if (!homepageConfig.brandStory) return null;

  const { brandStoryContent } = homepageConfig;

  const icons = [Sparkles, ShieldCheck, Feather];

  return (
    <section id="brand-story" className="py-24 bg-[var(--background)] border-b border-[var(--border)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          
          {/* Left Column: Image Mosaic */}
          <div className="relative">
            <div className="aspect-[4/5] rounded-[var(--radius)] overflow-hidden bg-[var(--muted)] border border-[var(--border)] shadow-xl">
              <img
                src={brandStoryContent.image}
                alt="Atelier Craftsmanship"
                className="w-full h-full object-cover object-center"
              />
            </div>
            <div className="absolute -bottom-8 -right-8 w-48 h-48 bg-[var(--primary)] text-[var(--primary-foreground)] p-6 rounded-[var(--radius)] hidden sm:flex flex-col justify-center border border-[var(--border)] shadow-2xl">
              <span className="font-heading text-3xl font-bold">100%</span>
              <span className="text-[10px] font-semibold uppercase tracking-widest opacity-80 mt-1">
                Hand-Finished Artisan Couture
              </span>
            </div>
          </div>

          {/* Right Column: Editorial Copy & Highlights */}
          <div className="space-y-8">
            <div className="space-y-3">
              <span className="text-[11px] font-bold uppercase tracking-[0.25em] text-[var(--secondary)]">
                {brandStoryContent.subtitle}
              </span>
              <h2 className="font-heading text-3xl sm:text-5xl font-bold uppercase tracking-tight text-[var(--foreground)] leading-[1.15]">
                {brandStoryContent.title}
              </h2>
            </div>

            <p className="text-sm sm:text-base leading-relaxed text-[var(--muted-foreground)]">
              {brandStoryContent.description}
            </p>

            <div className="grid grid-cols-1 gap-6 pt-4 border-t border-[var(--border)]">
              {brandStoryContent.highlights.map((item, idx) => {
                const IconComponent = icons[idx % icons.length];
                return (
                  <div key={item.label} className="flex items-start gap-4">
                    <div className="p-2.5 rounded-[var(--radius)] bg-[var(--muted)] text-[var(--primary)] flex-shrink-0">
                      <IconComponent className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--foreground)]">
                        {item.label}
                      </h4>
                      <p className="text-xs text-[var(--muted-foreground)] mt-1 leading-normal">
                        {item.detail}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
