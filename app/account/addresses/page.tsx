"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/auth.store";
import { CustomerService, CustomerAddress } from "@/services/customer.service";
import {
  ArrowLeft,
  MapPin,
  Plus,
  Home,
  Briefcase,
  Check,
  Edit3,
  Trash2,
  X,
  CheckCircle2,
  Phone,
  Building,
} from "lucide-react";

export default function AddressesPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();

  const [addresses, setAddresses] = useState<CustomerAddress[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<CustomerAddress | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Address Form State
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    addressLine1: "",
    addressLine2: "",
    company: "",
    country: "India",
    state: "",
    city: "",
    postalCode: "",
    phone: "",
    tag: "Home" as "Home" | "Work" | "Other",
    isDefault: false,
  });

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login?redirect=/account/addresses");
      return;
    }

    async function loadAddresses() {
      setIsLoading(true);
      try {
        const list = await CustomerService.getAddresses();
        setAddresses(list);
      } finally {
        setIsLoading(false);
      }
    }
    loadAddresses();
  }, [isAuthenticated, router]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 4000);
  };

  const openAddModal = () => {
    setEditingAddress(null);
    setFormData({
      firstName: "",
      lastName: "",
      addressLine1: "",
      addressLine2: "",
      company: "",
      country: "India",
      state: "",
      city: "",
      postalCode: "",
      phone: "",
      tag: "Home",
      isDefault: addresses.length === 0,
    });
    setIsModalOpen(true);
  };

  const openEditModal = (addr: CustomerAddress) => {
    setEditingAddress(addr);
    setFormData({
      firstName: addr.firstName,
      lastName: addr.lastName,
      addressLine1: addr.address1 || addr.addressLine1 || addr.street || "",
      addressLine2: addr.address2 || addr.addressLine2 || addr.apartment || "",
      company: addr.company || "",
      country: addr.country,
      state: addr.state,
      city: addr.city,
      postalCode: addr.postalCode,
      phone: addr.phoneNumber || addr.phone || "",
      tag: addr.tag || "Home",
      isDefault: addr.isDefault,
    });
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !formData.firstName.trim() ||
      !formData.lastName.trim() ||
      !formData.addressLine1.trim() ||
      !formData.city.trim() ||
      !formData.state.trim() ||
      !formData.postalCode.trim()
    ) {
      showToast("Please fill in all required address fields.");
      return;
    }

    try {
      const res = await CustomerService.saveAddress({
        id: editingAddress ? editingAddress.id : undefined,
        firstName: formData.firstName,
        lastName: formData.lastName,
        company: formData.company,
        address1: formData.addressLine1,
        address2: formData.addressLine2,
        city: formData.city,
        state: formData.state,
        postalCode: formData.postalCode,
        country: formData.country,
        phoneNumber: formData.phone,
        isDefault: formData.isDefault,
      });
      if (res.success) {
        setAddresses(res.data);
        setIsModalOpen(false);
        showToast(res.message);
      } else {
        showToast(res.message || "Failed to save delivery address.");
      }
    } catch {
      showToast("Failed to save delivery address.");
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this address?")) {
      const res = await CustomerService.deleteAddress(id);
      if (res.success) {
        setAddresses(res.data);
        showToast(res.message);
      }
    }
  };

  const handleSetDefault = async (id: string) => {
    const res = await CustomerService.setDefaultAddress(id);
    if (res.success) {
      setAddresses(res.data);
      showToast(res.message);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--background)] py-8 sm:py-12">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        
        {/* Toast */}
        {toastMessage && (
          <div className="fixed top-20 right-4 sm:right-8 z-50 max-w-md bg-neutral-900 text-white px-4 py-3 rounded-xl shadow-lg flex items-center justify-between gap-3 animate-fade-in border border-neutral-700">
            <div className="flex items-center gap-2 text-xs">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <p className="font-medium">{toastMessage}</p>
            </div>
            <button onClick={() => setToastMessage(null)} className="text-neutral-400 hover:text-white p-1">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Breadcrumb Navigation */}
        <nav className="flex items-center gap-2 text-xs text-neutral-500 font-medium">
          <Link href="/" className="hover:text-neutral-900 transition-colors">
            Home
          </Link>
          <span className="text-neutral-300">/</span>
          <Link href="/account" className="hover:text-neutral-900 transition-colors">
            Account
          </Link>
          <span className="text-neutral-300">/</span>
          <span className="text-neutral-900 font-semibold">Addresses</span>
        </nav>

        {/* Header & Back Link */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-200/80 pb-5">
          <div className="space-y-2">
            <Link
              href="/account"
              className="inline-flex items-center gap-1.5 text-xs font-medium text-neutral-600 hover:text-neutral-900 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to account</span>
            </Link>

            <div>
              <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-neutral-900">
                Addresses
              </h1>
              <p className="text-xs sm:text-sm text-neutral-500 mt-1">
                Manage your saved delivery destinations and billing addresses.
              </p>
            </div>
          </div>

          <button
            onClick={openAddModal}
            className="px-4 py-2 bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-medium rounded-lg transition-colors shadow-xs flex items-center gap-2 self-start sm:self-auto cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add address</span>
          </button>
        </div>

        {/* Addresses Grid */}
        {isLoading ? (
          <div className="py-20 text-center bg-white border border-neutral-200/90 rounded-xl space-y-3">
            <div className="w-7 h-7 border-2 border-neutral-300 border-t-neutral-900 rounded-full animate-spin mx-auto" />
            <p className="text-xs text-neutral-400">Loading saved addresses...</p>
          </div>
        ) : addresses.length === 0 ? (
          <div className="py-16 text-center space-y-4 bg-white rounded-xl border border-neutral-200/90 p-6 sm:p-8 shadow-xs">
            <div className="w-12 h-12 rounded-full bg-neutral-100 text-neutral-500 flex items-center justify-center mx-auto">
              <MapPin className="w-6 h-6 stroke-[1.5]" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-semibold text-neutral-900">
                No saved addresses
              </h3>
              <p className="text-xs text-neutral-500 max-w-sm mx-auto">
                Add your residential or office address to speed up checkout.
              </p>
            </div>
            <button
              onClick={openAddModal}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-neutral-900 text-white text-xs font-medium rounded-lg hover:bg-neutral-800 cursor-pointer shadow-xs transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add an address</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {addresses.map((addr) => (
              <div
                key={addr.id}
                className={`p-5 sm:p-6 rounded-xl border bg-white shadow-xs transition-all flex flex-col justify-between gap-4 ${
                  addr.isDefault
                    ? "border-neutral-900 ring-1 ring-neutral-900"
                    : "border-neutral-200/90 hover:border-neutral-300"
                }`}
              >
                <div className="space-y-3">
                  {/* Top classification tag & Default badge */}
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium px-2 py-0.5 rounded bg-neutral-100 text-neutral-700 flex items-center gap-1">
                      {addr.tag === "Home" ? (
                        <Home className="w-3 h-3 text-neutral-500" />
                      ) : addr.tag === "Work" ? (
                        <Briefcase className="w-3 h-3 text-neutral-500" />
                      ) : (
                        <MapPin className="w-3 h-3 text-neutral-500" />
                      )}
                      <span>{addr.tag || "Address"}</span>
                    </span>

                    {addr.isDefault && (
                      <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-800 border border-neutral-300 flex items-center gap-1">
                        <Check className="w-3 h-3 text-emerald-600" />
                        <span>Default address</span>
                      </span>
                    )}
                  </div>

                  {/* Address Details */}
                  <div className="text-xs sm:text-sm space-y-1 text-neutral-600">
                    <p className="font-semibold text-neutral-900 text-sm">
                      {addr.firstName} {addr.lastName}
                    </p>
                    {addr.company && (
                      <p className="text-neutral-500 flex items-center gap-1">
                        <Building className="w-3 h-3 text-neutral-400" />
                        {addr.company}
                      </p>
                    )}
                    <p>{addr.address1 || addr.addressLine1 || addr.street}</p>
                    {(addr.address2 || addr.addressLine2 || addr.apartment) && (
                      <p className="text-neutral-500">{addr.address2 || addr.addressLine2 || addr.apartment}</p>
                    )}
                    <p>
                      {addr.city}, {addr.state} {addr.postalCode}
                    </p>
                    <p>{addr.country}</p>
                    {(addr.phoneNumber || addr.phone) && (
                      <p className="pt-1 text-neutral-600 font-mono text-xs flex items-center gap-1.5">
                        <Phone className="w-3 h-3 text-neutral-400" />
                        <span>{addr.phoneNumber || addr.phone}</span>
                      </p>
                    )}
                  </div>
                </div>

                {/* Card Actions */}
                <div className="pt-3 border-t border-neutral-100 flex items-center justify-between gap-3 text-xs">
                  {!addr.isDefault ? (
                    <button
                      onClick={() => handleSetDefault(addr.id)}
                      className="text-xs font-medium text-neutral-700 hover:text-neutral-950 underline transition-colors cursor-pointer"
                    >
                      Set as default
                    </button>
                  ) : (
                    <span className="text-xs text-neutral-500">
                      Primary checkout address
                    </span>
                  )}

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEditModal(addr)}
                      className="px-2.5 py-1 text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 rounded text-xs font-medium transition-colors cursor-pointer"
                    >
                      Edit
                    </button>
                    <span className="text-neutral-300">|</span>
                    <button
                      onClick={() => handleDelete(addr.id)}
                      className="px-2.5 py-1 text-red-600 hover:text-red-700 hover:bg-red-50 rounded text-xs font-medium transition-colors cursor-pointer"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Add / Edit Address Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fade-in">
            <div
              className="bg-white rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-xl border border-neutral-200 p-5 sm:p-6 space-y-5"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
                <h3 className="text-base font-semibold text-neutral-900">
                  {editingAddress ? "Edit address" : "Add a new address"}
                </h3>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-1 text-neutral-400 hover:text-neutral-700 rounded-full"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSave} className="space-y-4">
                {/* First Name & Last Name */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-neutral-700 block">
                      First name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.firstName}
                      onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                      className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-neutral-300 focus:outline-none focus:ring-1 focus:ring-neutral-900 focus:border-neutral-900 bg-white"
                      placeholder="John"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-neutral-700 block">
                      Last name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.lastName}
                      onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                      className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-neutral-300 focus:outline-none focus:ring-1 focus:ring-neutral-900 focus:border-neutral-900 bg-white"
                      placeholder="Doe"
                    />
                  </div>
                </div>

                {/* Company (Optional) */}
                <div className="space-y-1">
                  <label className="text-xs font-medium text-neutral-700 block">
                    Company <span className="text-neutral-400 font-normal">(optional)</span>
                  </label>
                  <input
                    type="text"
                    value={formData.company}
                    onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                    className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-neutral-300 focus:outline-none focus:ring-1 focus:ring-neutral-900 focus:border-neutral-900 bg-white"
                    placeholder="e.g. Acme Corp"
                  />
                </div>

                {/* Address Line 1 */}
                <div className="space-y-1">
                  <label className="text-xs font-medium text-neutral-700 block">
                    Address <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.addressLine1}
                    onChange={(e) => setFormData({ ...formData, addressLine1: e.target.value })}
                    className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-neutral-300 focus:outline-none focus:ring-1 focus:ring-neutral-900 focus:border-neutral-900 bg-white"
                    placeholder="Street address, P.O. Box"
                  />
                </div>

                {/* Address Line 2 */}
                <div className="space-y-1">
                  <label className="text-xs font-medium text-neutral-700 block">
                    Apartment, suite, etc. <span className="text-neutral-400 font-normal">(optional)</span>
                  </label>
                  <input
                    type="text"
                    value={formData.addressLine2}
                    onChange={(e) => setFormData({ ...formData, addressLine2: e.target.value })}
                    className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-neutral-300 focus:outline-none focus:ring-1 focus:ring-neutral-900 focus:border-neutral-900 bg-white"
                    placeholder="Apartment, unit, building, floor"
                  />
                </div>

                {/* City & State */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-neutral-700 block">
                      City <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-neutral-300 focus:outline-none focus:ring-1 focus:ring-neutral-900 focus:border-neutral-900 bg-white"
                      placeholder="Mumbai"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-neutral-700 block">
                      State <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.state}
                      onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                      className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-neutral-300 focus:outline-none focus:ring-1 focus:ring-neutral-900 focus:border-neutral-900 bg-white"
                      placeholder="Maharashtra"
                    />
                  </div>
                </div>

                {/* Postal Code & Country */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-neutral-700 block">
                      PIN code <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.postalCode}
                      onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                      className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-neutral-300 focus:outline-none focus:ring-1 focus:ring-neutral-900 focus:border-neutral-900 font-mono bg-white"
                      placeholder="400050"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-neutral-700 block">
                      Country <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.country}
                      onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                      className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-neutral-300 focus:outline-none focus:ring-1 focus:ring-neutral-900 focus:border-neutral-900 bg-white"
                      placeholder="India"
                    />
                  </div>
                </div>

                {/* Phone Number */}
                <div className="space-y-1">
                  <label className="text-xs font-medium text-neutral-700 block">
                    Phone <span className="text-neutral-400 font-normal">(optional)</span>
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-neutral-300 focus:outline-none focus:ring-1 focus:ring-neutral-900 focus:border-neutral-900 font-mono bg-white"
                    placeholder="+91 98765 00002"
                  />
                </div>

                {/* Classification Tag */}
                <div className="space-y-1.5 pt-1">
                  <label className="text-xs font-medium text-neutral-700 block">
                    Address label
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {(["Home", "Work", "Other"] as const).map((tag) => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => setFormData({ ...formData, tag })}
                        className={`py-1.5 text-xs font-medium rounded-lg border transition-all cursor-pointer ${
                          formData.tag === tag
                            ? "bg-neutral-900 text-white border-neutral-900 shadow-2xs"
                            : "bg-white text-neutral-700 border-neutral-300 hover:bg-neutral-50"
                        }`}
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Default checkbox */}
                <label className="flex items-center gap-2 pt-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isDefault}
                    onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
                    className="rounded text-neutral-900 focus:ring-neutral-900 w-4 h-4 cursor-pointer"
                  />
                  <span className="text-xs text-neutral-700">
                    Set as default address
                  </span>
                </label>

                {/* Submit action */}
                <div className="pt-3 flex items-center justify-end gap-2 border-t border-neutral-100">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-3 py-2 text-xs font-medium text-neutral-600 hover:text-neutral-900 rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-medium rounded-lg transition-colors shadow-xs cursor-pointer"
                  >
                    {editingAddress ? "Update address" : "Save address"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
