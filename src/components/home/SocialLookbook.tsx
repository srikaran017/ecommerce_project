import React from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { storeConfig } from "@/config/store.config";

export function SocialLookbook() {
  const posts = [
    {
      id: "post_1",
      image: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?q=80&w=800&auto=format&fit=crop",
      author: "@aaradhyadesigns",
      caption: "Draped in heritage Banarasi raw silk for festive dusk.",
      tag: "Banarasi Raw Silk Saree",
      link: "/products/handcrafted-banarasi-raw-silk-saree",
    },
    {
      id: "post_2",
      image: "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?q=80&w=800&auto=format&fit=crop",
      author: "@ritikacouture",
      caption: "Bridal velvet moments in royal crimson.",
      tag: "Velvet Bridal Lehenga",
      link: "/products/hand-embroidered-velvet-bridal-lehenga",
    },
    {
      id: "post_3",
      image: "https://images.unsplash.com/photo-1566174053879-31528523f8ae?q=80&w=800&auto=format&fit=crop",
      author: "@tara_sundaram",
      caption: "Pure Chanderi Anarkali flowing seamlessly under the chandeliers.",
      tag: "Chanderi Anarkali Suit",
      link: "/products/pure-chanderi-silk-anarkali-suit",
    },
    {
      id: "post_4",
      image: "https://images.unsplash.com/photo-1595777457583-95e059d581b8?q=80&w=800&auto=format&fit=crop",
      author: "@meera.stylist",
      caption: "Pure mulberry silk asymmetrical evening drape.",
      tag: "Mulberry Silk Gown",
      link: "/products/mulberry-silk-draped-evening-gown",
    },
  ];

  return (
    <section className="py-20 bg-[var(--background)] border-t border-[var(--border)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-12">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-[0.3em] text-[var(--secondary)] block mb-1">
              COMMUNITY LOOKBOOK
            </span>
            <h2 className="font-heading text-3xl sm:text-4xl font-bold uppercase tracking-tight text-[var(--foreground)]">
              STYLED BY YOU #{storeConfig.name.split(" ")[0].toUpperCase()}
            </h2>
          </div>
          <a
            href={storeConfig.social.instagram || "https://instagram.com"}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-bold uppercase tracking-wider text-[var(--secondary)] hover:underline flex items-center gap-1.5"
          >
            <span>Follow on Instagram</span>
            <ArrowUpRight className="w-4 h-4" />
          </a>
        </div>

        {/* Gallery */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {posts.map((post) => (
            <Link
              key={post.id}
              href={post.link}
              className="group relative aspect-[3/4] rounded-[var(--radius)] overflow-hidden bg-[var(--muted)] border border-[var(--border)] block shadow-sm hover:shadow-lg"
            >
              <img
                src={post.image}
                alt={post.caption}
                className="w-full h-full object-cover object-top transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4 text-white">
                <span className="text-[10px] font-mono text-amber-300">{post.author}</span>
                <p className="text-xs text-white font-semibold line-clamp-2 mt-0.5">{post.caption}</p>
                <div className="pt-2 text-[10px] font-bold uppercase tracking-wider text-white/90 flex items-center gap-1">
                  <span>Shop Silhouette</span>
                  <ArrowUpRight className="w-3 h-3" />
                </div>
              </div>
            </Link>
          ))}
        </div>

      </div>
    </section>
  );
}
