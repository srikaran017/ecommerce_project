"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  FolderTree,
  Plus,
  Edit,
  Trash2,
  CheckCircle2,
  XCircle,
  Image as ImageIcon,
  ArrowUpDown,
  ExternalLink,
  Layers,
  Sparkles,
} from "lucide-react";
import { INITIAL_CATEGORIES, CategoryConfig, SubcategoryConfig } from "@/config/category.config";

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<CategoryConfig[]>(INITIAL_CATEGORIES);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isSubModalOpen, setIsSubModalOpen] = useState(false);
  const [selectedCatId, setSelectedCatId] = useState<string | null>(null);

  // New Category Form State
  const [catName, setCatName] = useState("");
  const [catTagline, setCatTagline] = useState("");
  const [catDescription, setCatDescription] = useState("");
  const [catImage, setCatImage] = useState("");

  // New Subcategory Form State
  const [subName, setSubName] = useState("");

  const handleCreateCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!catName.trim()) return;

    const newCat: CategoryConfig = {
      id: `cat_${Date.now()}`,
      name: catName.trim(),
      slug: catName.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
      tagline: catTagline.trim() || "Atelier Fashion",
      description: catDescription.trim(),
      image: catImage.trim() || "https://images.unsplash.com/photo-1610030469983-98e550d6193c?q=80&w=800",
      isFeatured: true,
      displayOrder: categories.length + 1,
      isActive: true,
      subcategories: [],
    };

    setCategories([...categories, newCat]);
    setCatName("");
    setCatTagline("");
    setCatDescription("");
    setCatImage("");
    setIsCategoryModalOpen(false);
  };

  const handleCreateSubcategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subName.trim() || !selectedCatId) return;

    const newSub: SubcategoryConfig = {
      id: `sub_${Date.now()}`,
      name: subName.trim(),
      slug: subName.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
      itemCount: "0 Designs",
    };

    setCategories((prev) =>
      prev.map((cat) => {
        if (cat.id === selectedCatId) {
          return {
            ...cat,
            subcategories: [...cat.subcategories, newSub],
          };
        }
        return cat;
      })
    );

    setSubName("");
    setIsSubModalOpen(false);
  };

  const toggleCategoryStatus = (id: string) => {
    setCategories((prev) =>
      prev.map((c) => (c.id === id ? { ...c, isActive: !c.isActive } : c))
    );
  };

  const handleDeleteCategory = (id: string) => {
    setCategories((prev) => prev.filter((c) => c.id !== id));
  };

  const handleDeleteSubcategory = (catId: string, subId: string) => {
    setCategories((prev) =>
      prev.map((cat) => {
        if (cat.id === catId) {
          return {
            ...cat,
            subcategories: cat.subcategories.filter((s) => s.id !== subId),
          };
        }
        return cat;
      })
    );
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-16">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight flex items-center gap-3">
            <FolderTree className="w-6 h-6 text-amber-400" />
            <span>Category & Subcategory Hierarchy</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Build and reorder custom fashion categories, subcategories, and visual mega-menu navigation.
          </p>
        </div>

        <button
          onClick={() => setIsCategoryModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs uppercase tracking-wider rounded-md transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add Custom Category</span>
        </button>
      </div>

      {/* Categories Cards List */}
      <div className="space-y-6">
        {categories.map((cat, idx) => (
          <div
            key={cat.id}
            className="bg-slate-950 border border-slate-800 rounded-lg overflow-hidden shadow-lg"
          >
            {/* Category Main Bar */}
            <div className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/50 border-b border-slate-800">
              <div className="flex items-center gap-4">
                <img
                  src={cat.image}
                  alt={cat.name}
                  className="w-14 h-14 rounded-full object-cover border border-slate-700 bg-slate-800 flex-shrink-0"
                />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-base text-white uppercase">{cat.name}</span>
                    <span className="text-[10px] font-mono text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                      /{cat.slug}
                    </span>
                    <button
                      onClick={() => toggleCategoryStatus(cat.id)}
                      className={`px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer ${
                        cat.isActive
                          ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                          : "bg-red-500/20 text-red-300 border border-red-500/30"
                      }`}
                    >
                      {cat.isActive ? "ACTIVE" : "HIDDEN"}
                    </button>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">{cat.tagline || cat.description}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setSelectedCatId(cat.id);
                    setIsSubModalOpen(true);
                  }}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold uppercase rounded flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Subcategory</span>
                </button>

                <Link
                  href={`/products?category=${cat.slug}`}
                  target="_blank"
                  className="p-2 hover:bg-slate-800 rounded text-slate-400 hover:text-white transition-colors"
                  title="View Category Page"
                >
                  <ExternalLink className="w-4 h-4" />
                </Link>

                <button
                  onClick={() => handleDeleteCategory(cat.id)}
                  className="p-2 hover:bg-slate-800 rounded text-slate-400 hover:text-red-400 transition-colors cursor-pointer"
                  title="Delete Category"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Subcategories Pills Grid */}
            <div className="p-5 bg-slate-950">
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 block mb-3">
                SUBCATEGORIES ({cat.subcategories.length})
              </span>

              {cat.subcategories.length === 0 ? (
                <p className="text-xs text-slate-600 italic">No subcategories yet. Click "Add Subcategory" to create one.</p>
              ) : (
                <div className="flex flex-wrap gap-2.5">
                  {cat.subcategories.map((sub) => (
                    <div
                      key={sub.id}
                      className="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-md text-xs"
                    >
                      <span className="font-semibold text-white uppercase">{sub.name}</span>
                      {sub.itemCount && (
                        <span className="text-[10px] font-mono text-slate-400">{sub.itemCount}</span>
                      )}
                      <button
                        onClick={() => handleDeleteSubcategory(cat.id, sub.id)}
                        className="text-slate-500 hover:text-red-400 ml-1 cursor-pointer"
                        title="Remove Subcategory"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Modal: Create Category */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="bg-slate-950 border border-slate-800 p-6 sm:p-8 rounded-lg max-w-md w-full space-y-4">
            <h3 className="text-base font-bold uppercase tracking-wider text-white border-b border-slate-800 pb-3">
              Create New Fashion Category
            </h3>

            <form onSubmit={handleCreateCategory} className="space-y-4 text-xs">
              <div>
                <label className="font-bold uppercase text-slate-300 block mb-1">Category Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Co-ord Sets or Bridal Lehengas"
                  value={catName}
                  onChange={(e) => setCatName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 text-white border border-slate-700 rounded-md focus:border-amber-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="font-bold uppercase text-slate-300 block mb-1">Tagline</label>
                <input
                  type="text"
                  placeholder="e.g. Flattering Contemporary Silhouettes"
                  value={catTagline}
                  onChange={(e) => setCatTagline(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 text-white border border-slate-700 rounded-md focus:border-amber-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="font-bold uppercase text-slate-300 block mb-1">Cover Image URL</label>
                <input
                  type="url"
                  placeholder="https://images.unsplash.com/..."
                  value={catImage}
                  onChange={(e) => setCatImage(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 text-white border border-slate-700 rounded-md focus:border-amber-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="font-bold uppercase text-slate-300 block mb-1">Description</label>
                <textarea
                  rows={3}
                  placeholder="Short description for category header..."
                  value={catDescription}
                  onChange={(e) => setCatDescription(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 text-white border border-slate-700 rounded-md focus:border-amber-400 focus:outline-none"
                />
              </div>

              <div className="pt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsCategoryModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded cursor-pointer"
                >
                  Save Category
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Create Subcategory */}
      {isSubModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="bg-slate-950 border border-slate-800 p-6 sm:p-8 rounded-lg max-w-sm w-full space-y-4">
            <h3 className="text-base font-bold uppercase tracking-wider text-white border-b border-slate-800 pb-3">
              Add Subcategory
            </h3>

            <form onSubmit={handleCreateSubcategory} className="space-y-4 text-xs">
              <div>
                <label className="font-bold uppercase text-slate-300 block mb-1">Subcategory Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Organza Silks, Shararas"
                  value={subName}
                  onChange={(e) => setSubName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 text-white border border-slate-700 rounded-md focus:border-amber-400 focus:outline-none"
                />
              </div>

              <div className="pt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsSubModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded cursor-pointer"
                >
                  Add Subcategory
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
