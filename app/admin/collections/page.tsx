"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Sparkles, Plus, Edit, Trash2, ExternalLink, Image as ImageIcon } from "lucide-react";
import { FALLBACK_COLLECTIONS } from "@/data/products.data";

export default function AdminCollectionsPage() {
  const [collections, setCollections] = useState(FALLBACK_COLLECTIONS);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [image, setImage] = useState("");

  const handleCreateCollection = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const newCol = {
      id: `col_${Date.now()}`,
      name: name.trim(),
      slug: name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
      description,
      image: image || "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=1200",
      itemCount: "0 Silhouettes",
    };

    setCollections([...collections, newCol]);
    setName("");
    setDescription("");
    setImage("");
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-16">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight flex items-center gap-3">
            <Sparkles className="w-6 h-6 text-amber-400" />
            <span>Curated Collections & Lookbooks</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Group garments into seasonal capsule edits, trunk shows, and editorial campaigns.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs uppercase tracking-wider rounded-md transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>New Collection</span>
        </button>
      </div>

      {/* Collections Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {collections.map((col) => (
          <div
            key={col.id}
            className="bg-slate-950 border border-slate-800 rounded-lg overflow-hidden flex flex-col justify-between shadow-lg"
          >
            <div className="relative h-48 bg-slate-900 overflow-hidden">
              <img src={col.image} alt={col.name} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />
              <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-widest text-amber-400">
                  {col.itemCount}
                </span>
                <span className="font-mono text-[10px] text-slate-400">Handle: /{col.slug}</span>
              </div>
            </div>

            <div className="p-5 space-y-2 flex-1 flex flex-col justify-between">
              <div>
                <h3 className="font-bold text-base text-white uppercase">{col.name}</h3>
                <p className="text-xs text-slate-400 leading-relaxed line-clamp-2">{col.description}</p>
              </div>

              <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
                <Link
                  href={`/collections`}
                  target="_blank"
                  className="text-xs text-amber-400 hover:underline flex items-center gap-1 font-semibold uppercase"
                >
                  <span>View in Storefront</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </Link>

                <div className="flex items-center gap-2">
                  <button className="p-1.5 hover:bg-slate-800 rounded text-slate-400 hover:text-white transition-colors">
                    <Edit className="w-4 h-4" />
                  </button>
                  <button className="p-1.5 hover:bg-slate-800 rounded text-slate-400 hover:text-red-400 transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Create Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-slate-950 border border-slate-800 p-6 sm:p-8 rounded-lg max-w-md w-full space-y-4">
            <h3 className="text-base font-bold uppercase tracking-wider text-white border-b border-slate-800 pb-3">
              Create Curated Collection
            </h3>

            <form onSubmit={handleCreateCollection} className="space-y-4 text-xs">
              <div>
                <label className="font-bold uppercase text-slate-300 block mb-1">Collection Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Autumn Silk Capsule"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 text-white border border-slate-700 rounded-md focus:border-amber-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="font-bold uppercase text-slate-300 block mb-1">Cover Image URL</label>
                <input
                  type="url"
                  placeholder="https://images.unsplash.com/..."
                  value={image}
                  onChange={(e) => setImage(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 text-white border border-slate-700 rounded-md focus:border-amber-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="font-bold uppercase text-slate-300 block mb-1">Editorial Description</label>
                <textarea
                  rows={3}
                  placeholder="Describe the aesthetic and style..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 text-white border border-slate-700 rounded-md focus:border-amber-400 focus:outline-none"
                />
              </div>

              <div className="pt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded cursor-pointer"
                >
                  Save Collection
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
