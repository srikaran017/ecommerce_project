"use client";

import React from "react";
import Link from "next/link";
import { Phone, Mail, MapPin, MessageSquare, Globe, Share2 } from "lucide-react";
import { storeConfig } from "@/config/store.config";
import { featureConfig } from "@/config/feature.config";
import { Button } from "@/components/ui/Button";

// Clean inline SVGs for social brands
function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </svg>
  );
}

function FacebookIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
    </svg>
  );
}

function TwitterIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z" />
    </svg>
  );
}

export function Footer() {
  return (
    <footer className="bg-[var(--primary)] text-[var(--primary-foreground)] border-t border-[var(--border)] pt-16 pb-12 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
          
          {/* Column 1: Brand Atelier */}
          <div className="space-y-4">
            <h3 className="font-heading text-xl font-bold tracking-widest uppercase">
              {storeConfig.name}
            </h3>
            <p className="text-xs leading-relaxed opacity-80 max-w-sm">
              {storeConfig.description}
            </p>
            <div className="flex items-center gap-4 pt-2">
              {storeConfig.social.instagram && (
                <a
                  href={storeConfig.social.instagram}
                  target="_blank"
                  rel="noreferrer"
                  className="hover:opacity-70 transition-opacity"
                  aria-label="Instagram"
                >
                  <InstagramIcon className="w-5 h-5 text-current" />
                </a>
              )}
              {storeConfig.social.facebook && (
                <a
                  href={storeConfig.social.facebook}
                  target="_blank"
                  rel="noreferrer"
                  className="hover:opacity-70 transition-opacity"
                  aria-label="Facebook"
                >
                  <FacebookIcon className="w-5 h-5 text-current" />
                </a>
              )}
              {storeConfig.social.twitter && (
                <a
                  href={storeConfig.social.twitter}
                  target="_blank"
                  rel="noreferrer"
                  className="hover:opacity-70 transition-opacity"
                  aria-label="Twitter"
                >
                  <TwitterIcon className="w-5 h-5 text-current" />
                </a>
              )}
            </div>
          </div>

          {/* Column 2: Client Collections */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-widest">COLLECTIONS</h4>
            <ul className="space-y-2.5 text-xs opacity-80">
              <li>
                <Link href="/products?category=womens-couture" className="hover:underline">
                  Women's Evening & Couture
                </Link>
              </li>
              <li>
                <Link href="/products?category=mens-apparel" className="hover:underline">
                  Men's Bespoke & Linen
                </Link>
              </li>
              <li>
                <Link href="/products?category=luxury-accessories" className="hover:underline">
                  Silk Scarves & Shawls
                </Link>
              </li>
              <li>
                <Link href="/products?sort=newest" className="hover:underline">
                  New Season Arrivals
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Customer Concierge */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-widest">CONCIERGE</h4>
            <ul className="space-y-2.5 text-xs opacity-80">
              <li className="flex items-center gap-2">
                <Mail className="w-4 h-4" />
                <span>{storeConfig.contact.email}</span>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="w-4 h-4" />
                <span>{storeConfig.contact.phone}</span>
              </li>
              <li className="flex items-start gap-2">
                <MapPin className="w-4 h-4 mt-0.5" />
                <span>
                  {storeConfig.contact.address.street}, {storeConfig.contact.address.city}
                </span>
              </li>
              {featureConfig.whatsapp && (
                <li className="pt-1">
                  <a
                    href={`https://wa.me/${storeConfig.contact.whatsapp.replace(/[^0-9]/g, "")}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 text-green-400 font-semibold hover:underline"
                  >
                    <MessageSquare className="w-4 h-4" />
                    <span>WhatsApp Concierge</span>
                  </a>
                </li>
              )}
            </ul>
          </div>

          {/* Column 4: Newsletter (Controlled by Feature Flag) */}
          {featureConfig.newsletter && (
            <div className="space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-widest">PRIVATE INVITATION</h4>
              <p className="text-xs opacity-80 leading-relaxed">
                Subscribe to receive private collection previews, seasonal trunk shows, and editorial lookbooks.
              </p>
              <form onSubmit={(e) => e.preventDefault()} className="space-y-2">
                <input
                  type="email"
                  placeholder="Enter your email address"
                  className="w-full px-3 py-2 text-xs bg-white/10 text-white border border-white/20 rounded-[var(--radius)] focus:outline-none focus:border-white placeholder:text-white/60"
                />
                <Button variant="accent" size="sm" className="w-full">
                  JOIN ATELIER
                </Button>
              </form>
            </div>
          )}

        </div>

        {/* Bottom copyright line */}
        <div className="border-t border-white/10 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] opacity-70">
          <p>© {new Date().getFullYear()} {storeConfig.name}. All Rights Reserved.</p>
          <div className="flex items-center gap-6">
            <Link href="/privacy" className="hover:underline">Privacy Policy</Link>
            <Link href="/terms" className="hover:underline">Terms of Service</Link>
            <Link href="/shipping" className="hover:underline">Shipping & Returns</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
