"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Sparkles, Tag, ArrowRight, Clock, Copy, Check } from "lucide-react";
import { ACTIVE_CAMPAIGN } from "@/config/promotions.config";

export function CountdownTimer() {
  const [timeLeft, setTimeLeft] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
    isExpired: boolean;
  }>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    isExpired: false,
  });

  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const target = new Date(ACTIVE_CAMPAIGN.endDate).getTime();

    const calculate = () => {
      const now = new Date().getTime();
      const diff = target - now;

      if (diff <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0, isExpired: true });
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeLeft({ days, hours, minutes, seconds, isExpired: false });
    };

    calculate();
    const interval = setInterval(calculate, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(ACTIVE_CAMPAIGN.couponCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!ACTIVE_CAMPAIGN.isActive || timeLeft.isExpired) {
    return null;
  }

  const formatDigit = (num: number) => String(num).padStart(2, "0");

  return (
    <section className="py-12 bg-gradient-to-r from-[#2c0e1e] via-[#1a0812] to-[#2c0e1e] text-white relative overflow-hidden border-y border-amber-500/20">
      
      {/* Background Decorative Motif */}
      <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#d4af37_1px,transparent_1px)] [background-size:16px_16px]" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-8 text-center lg:text-left">
          
          {/* Left Text Block */}
          <div className="space-y-2 max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-400/30 text-amber-300 text-[10px] font-bold uppercase tracking-widest">
              <Sparkles className="w-3.5 h-3.5" />
              <span>{ACTIVE_CAMPAIGN.badge}</span>
            </div>

            <h2 className="font-heading text-2xl sm:text-4xl font-bold uppercase tracking-tight text-amber-100">
              {ACTIVE_CAMPAIGN.title}
            </h2>

            <p className="text-xs sm:text-sm text-amber-200/80 leading-relaxed">
              {ACTIVE_CAMPAIGN.subtitle}
            </p>
          </div>

          {/* Center: Live Countdown Clock */}
          <div className="flex flex-col items-center gap-3">
            <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-amber-400/90 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              <span>SALE CONCLUDES IN</span>
            </span>

            <div className="flex items-center gap-2 sm:gap-3 font-mono text-center">
              {/* Days */}
              <div className="bg-black/60 border border-amber-500/30 rounded-lg p-2 sm:p-3 min-w-[60px] sm:min-w-[70px]">
                <span className="text-xl sm:text-3xl font-bold text-amber-300 block">
                  {formatDigit(timeLeft.days)}
                </span>
                <span className="text-[9px] uppercase tracking-wider text-amber-200/60 block mt-0.5">
                  Days
                </span>
              </div>

              <span className="text-xl font-bold text-amber-500">:</span>

              {/* Hours */}
              <div className="bg-black/60 border border-amber-500/30 rounded-lg p-2 sm:p-3 min-w-[60px] sm:min-w-[70px]">
                <span className="text-xl sm:text-3xl font-bold text-amber-300 block">
                  {formatDigit(timeLeft.hours)}
                </span>
                <span className="text-[9px] uppercase tracking-wider text-amber-200/60 block mt-0.5">
                  Hours
                </span>
              </div>

              <span className="text-xl font-bold text-amber-500">:</span>

              {/* Minutes */}
              <div className="bg-black/60 border border-amber-500/30 rounded-lg p-2 sm:p-3 min-w-[60px] sm:min-w-[70px]">
                <span className="text-xl sm:text-3xl font-bold text-amber-300 block">
                  {formatDigit(timeLeft.minutes)}
                </span>
                <span className="text-[9px] uppercase tracking-wider text-amber-200/60 block mt-0.5">
                  Mins
                </span>
              </div>

              <span className="text-xl font-bold text-amber-500">:</span>

              {/* Seconds */}
              <div className="bg-black/60 border border-amber-500/30 rounded-lg p-2 sm:p-3 min-w-[60px] sm:min-w-[70px]">
                <span className="text-xl sm:text-3xl font-bold text-amber-400 block animate-pulse">
                  {formatDigit(timeLeft.seconds)}
                </span>
                <span className="text-[9px] uppercase tracking-wider text-amber-200/60 block mt-0.5">
                  Secs
                </span>
              </div>
            </div>
          </div>

          {/* Right Action: Coupon Code & Shop Button */}
          <div className="flex flex-col items-center sm:items-end gap-3">
            <button
              onClick={handleCopyCode}
              className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500/10 hover:bg-amber-500/20 border border-dashed border-amber-400/50 rounded-lg text-amber-300 text-xs font-mono font-bold tracking-wider cursor-pointer transition-colors"
            >
              <Tag className="w-3.5 h-3.5 text-amber-400" />
              <span>CODE: {ACTIVE_CAMPAIGN.couponCode}</span>
              {copied ? (
                <span className="text-[10px] text-emerald-400 font-sans flex items-center gap-1 font-bold">
                  <Check className="w-3 h-3" /> COPIED
                </span>
              ) : (
                <Copy className="w-3.5 h-3.5 text-amber-400/70 ml-1" />
              )}
            </button>

            <Link
              href={ACTIVE_CAMPAIGN.ctaLink}
              className="inline-flex items-center gap-2 px-6 py-3 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs uppercase tracking-widest rounded transition-all shadow-md hover:shadow-amber-400/20"
            >
              <span>{ACTIVE_CAMPAIGN.ctaText}</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

        </div>
      </div>
    </section>
  );
}
