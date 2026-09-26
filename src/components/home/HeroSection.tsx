import React from "react";
import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import { homepageConfig } from "@/config/homepage.config";
import { storeConfig } from "@/config/store.config";

export function HeroSection() {
  if (!homepageConfig.hero) return null;

  return (
    <section className="px-4 sm:px-6 lg:px-8 pt-4 pb-12">
      <div className="relative min-h-[70vh] sm:min-h-[75vh] flex items-center justify-center overflow-hidden rounded-3xl bg-neutral-900 text-white shadow-xl">
        
        {/* Background Image */}
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.unsplash.com/photo-1610030469983-98e550d6193c?q=80&w=2000&auto=format&fit=crop"
            alt="Hero Fashion Banner"
            className="w-full h-full object-cover object-center opacity-60 scale-105 transition-transform duration-1000"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/20" />
        </div>

        {/* Hero Content Box */}
        <div className="relative z-10 max-w-3xl mx-auto px-6 py-16 text-center space-y-5">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.25em] bg-white/20 backdrop-blur-md text-amber-300 rounded-full border border-amber-300/30">
            <Sparkles className="w-3.5 h-3.5" />
            <span>FESTIVE COUTURE '26</span>
          </div>

          <h1 className="font-heading text-3xl sm:text-5xl md:text-6xl font-bold tracking-tight uppercase leading-tight text-white">
            Handcrafted Luxury Silks & Festive Ensembles
          </h1>

          <p className="text-xs sm:text-sm text-neutral-200 max-w-xl mx-auto font-normal leading-relaxed">
            Discover pure Banarasi weaves, grand bridal lehengas, and artisanal Anarkali sets crafted for every royal celebration.
          </p>

          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/products"
              className="w-full sm:w-auto px-8 py-3.5 bg-amber-400 hover:bg-amber-300 text-neutral-950 font-bold text-xs uppercase tracking-widest rounded-2xl transition-all shadow-lg flex items-center justify-center gap-2"
            >
              <span>Explore Collection</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <Link
              href="/collections"
              className="w-full sm:w-auto px-8 py-3.5 bg-white/15 hover:bg-white/25 text-white font-bold text-xs uppercase tracking-widest rounded-2xl backdrop-blur-md border border-white/30 transition-all flex items-center justify-center"
            >
              <span>Shop By Occasion</span>
            </Link>
          </div>
        </div>

      </div>
    </section>
  );
}
