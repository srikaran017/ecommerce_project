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

  // Address Form State matching specification
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
    <div className="min-h-screen bg-[#fafafa] py-10 sm:py-14">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        
        {/* Toast */}
        {toastMessage && (
          <div className="fixed top-20 right-4 sm:right-8 z-50 max-w-md bg-neutral-900 text-white px-5 py-3.5 rounded-2xl shadow-xl flex items-center justify-between gap-3 animate-fade-in">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <p className="text-xs font-medium">{toastMessage}</p>
            </div>
            <button onClick={() => setToastMessage(null)} className="text-neutral-400 hover:text-white p-1">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Breadcrumb Navigation */}
        <nav className="flex items-center gap-1.5 text-xs text-neutral-500 font-medium">
          <Link href="/" className="hover:text-neutral-900 transition-colors">
            Home
          </Link>
          <span>/</span>
          <Link href="/account" className="hover:text-neutral-900 transition-colors">
            Account Center
          </Link>
          <span>/</span>
          <span className="text-neutral-900 font-semibold">Addresses</span>
        </nav>

        {/* Header & Back Link */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-2">
            <Link
              href="/account"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#2b97ba] hover:underline"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Account Center</span>
            </Link>
            <h1 className="text-2xl sm:text-3xl font-bold text-neutral-900 tracking-tight font-sans">
              Delivery Addresses
            </h1>
            <p className="text-xs text-neutral-500">
              Add and edit addresses, set your default address for checkout.
            </p>
          </div>

          <button
            onClick={openAddModal}
            className="px-5 py-2.5 bg-neutral-900 hover:bg-[#2b97ba] text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow-sm flex items-center gap-2 self-start sm:self-auto cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Address</span>
          </button>
        </div>

        {/* Addresses Grid */}
        {isLoading ? (
          <div className="py-16 text-center space-y-2">
            <div className="w-6 h-6 border-2 border-neutral-300 border-t-[#2b97ba] rounded-full animate-spin mx-auto" />
            <p className="text-xs text-neutral-400">Loading saved addresses...</p>
          </div>
        ) : addresses.length === 0 ? (
          <div className="py-16 text-center space-y-3 bg-white rounded-2xl border border-neutral-200/80 p-8">
            <div className="w-14 h-14 rounded-full bg-[#eef8fb] text-[#2b97ba] flex items-center justify-center mx-auto">
              <MapPin className="w-7 h-7" />
            </div>
            <h3 className="text-base font-bold text-neutral-900">No Saved Addresses</h3>
            <p className="text-xs text-neutral-500 max-w-sm mx-auto">
              Save your home, apartment, or office address to expedite order fulfillment and checkout.
            </p>
            <button
              onClick={openAddModal}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-neutral-900 text-white text-xs font-bold uppercase tracking-wider rounded-xl hover:bg-[#2b97ba] cursor-pointer mt-2"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add First Address</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {addresses.map((addr) => (
              <div
                key={addr.id}
                className={`p-6 rounded-2xl border bg-white shadow-xs transition-all flex flex-col justify-between gap-5 ${
                  addr.isDefault
                    ? "border-[#2b97ba] ring-1 ring-[#2b97ba]/30"
                    : "border-neutral-200/80 hover:border-neutral-300"
                }`}
              >
                <div className="space-y-3">
                  {/* Top classification tag & Default badge */}
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-neutral-100 text-neutral-700 flex items-center gap-1">
                      {addr.tag === "Home" ? (
                        <Home className="w-3 h-3" />
                      ) : addr.tag === "Work" ? (
                        <Briefcase className="w-3 h-3" />
                      ) : (
                        <MapPin className="w-3 h-3" />
                      )}
                      {addr.tag || "Address"}
                    </span>

                    {addr.isDefault && (
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-[#eef8fb] text-[#2b97ba] border border-[#2b97ba]/30 flex items-center gap-1">
                        <Check className="w-3 h-3" />
                        Default Address
                      </span>
                    )}
                  </div>

                  {/* Address Details */}
                  <div className="text-xs space-y-1.5 text-neutral-600">
                    <p className="font-bold text-neutral-900 text-sm">
                      {addr.firstName} {addr.lastName}
                    </p>
                    {addr.company && (
                      <p className="text-neutral-500 font-medium flex items-center gap-1">
                        <Building className="w-3 h-3 text-neutral-400" />
                        {addr.company}
                      </p>
                    )}
                    <p>{addr.address1 || addr.addressLine1 || addr.street}</p>
                    {(addr.address2 || addr.addressLine2 || addr.apartment) && (
                      <p className="text-neutral-500">{addr.address2 || addr.addressLine2 || addr.apartment}</p>
                    )}
                    <p>
                      {addr.city}, {addr.state} - <span className="font-mono font-bold text-neutral-800">{addr.postalCode}</span>
                    </p>
                    <p>{addr.country}</p>
                    {(addr.phoneNumber || addr.phone) && (
                      <p className="pt-1 text-neutral-500 font-mono flex items-center gap-1.5">
                        <Phone className="w-3 h-3 text-neutral-400" />
                        <span>{addr.phoneNumber || addr.phone}</span>
                      </p>
                    )}
                  </div>
                </div>

                {/* Card Actions */}
                <div className="pt-3 border-t border-neutral-100 flex items-center justify-between gap-3">
                  {!addr.isDefault ? (
                    <button
                      onClick={() => handleSetDefault(addr.id)}
                      className="text-xs font-bold text-neutral-700 hover:text-[#2b97ba] uppercase tracking-wider transition-colors cursor-pointer"
                    >
                      Set as Default
                    </button>
                  ) : (
                    <span className="text-xs font-semibold text-[#2b97ba] flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Default Checkout Address
                    </span>
                  )}

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEditModal(addr)}
                      className="p-1.5 text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 rounded-lg transition-colors cursor-pointer"
                      title="Edit Address"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(addr.id)}
                      className="p-1.5 text-neutral-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                      title="Delete Address"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Add / Edit Address Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-950/60 backdrop-blur-xs animate-fade-in">
            <div
              className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-neutral-200 p-6 sm:p-7 space-y-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-neutral-100 pb-4">
                <h3 className="font-heading text-lg font-bold uppercase tracking-tight text-neutral-900">
                  {editingAddress ? "Edit Address" : "Add New Address"}
                </h3>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-1.5 text-neutral-400 hover:text-neutral-700 rounded-full"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSave} className="space-y-4">
                {/* First Name & Last Name (Required) */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-neutral-700 block">
                      First Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.firstName}
                      onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-neutral-200 focus:outline-none focus:ring-1 focus:ring-[#2b97ba]"
                      placeholder="John"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-neutral-700 block">
                      Last Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.lastName}
                      onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-neutral-200 focus:outline-none focus:ring-1 focus:ring-[#2b97ba]"
                      placeholder="Doe"
                    />
                  </div>
                </div>

                {/* Company (Optional) */}
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-neutral-700 block">
                    Company <span className="text-neutral-400 font-normal">(Optional)</span>
                  </label>
                  <input
                    type="text"
                    value={formData.company}
                    onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-neutral-200 focus:outline-none focus:ring-1 focus:ring-[#2b97ba]"
                    placeholder="e.g. Acme Corp"
                  />
                </div>

                {/* Address Line 1 (Required) */}
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-neutral-700 block">
                    Address Line 1 <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.addressLine1}
                    onChange={(e) => setFormData({ ...formData, addressLine1: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-neutral-200 focus:outline-none focus:ring-1 focus:ring-[#2b97ba]"
                    placeholder="Street address, P.O. Box, company name"
                  />
                </div>

                {/* Address Line 2 (Optional) */}
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-neutral-700 block">
                    Address Line 2 <span className="text-neutral-400 font-normal">(Optional)</span>
                  </label>
                  <input
                    type="text"
                    value={formData.addressLine2}
                    onChange={(e) => setFormData({ ...formData, addressLine2: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-neutral-200 focus:outline-none focus:ring-1 focus:ring-[#2b97ba]"
                    placeholder="Apartment, suite, unit, building, floor, etc."
                  />
                </div>

                {/* City & State (Required) */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-neutral-700 block">
                      City <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-neutral-200 focus:outline-none focus:ring-1 focus:ring-[#2b97ba]"
                      placeholder="Mumbai"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-neutral-700 block">
                      State / Province <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.state}
                      onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-neutral-200 focus:outline-none focus:ring-1 focus:ring-[#2b97ba]"
                      placeholder="Maharashtra"
                    />
                  </div>
                </div>

                {/* Pincode / Postal Code & Country (Required) */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-neutral-700 block">
                      Pincode / Postal Code <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.postalCode}
                      onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-neutral-200 focus:outline-none focus:ring-1 focus:ring-[#2b97ba] font-mono"
                      placeholder="400050"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-neutral-700 block">
                      Country <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.country}
                      onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-neutral-200 focus:outline-none focus:ring-1 focus:ring-[#2b97ba]"
                      placeholder="India"
                    />
                  </div>
                </div>

                {/* Phone Number (Optional) */}
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-neutral-700 block">
                    Phone Number <span className="text-neutral-400 font-normal">(Optional)</span>
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-neutral-200 focus:outline-none focus:ring-1 focus:ring-[#2b97ba] font-mono"
                    placeholder="+91 98765 00002"
                  />
                </div>

                {/* Classification Tag */}
                <div className="space-y-1 pt-1">
                  <label className="text-[11px] font-semibold text-neutral-700 block">
                    Address Label
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {(["Home", "Work", "Other"] as const).map((tag) => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => setFormData({ ...formData, tag })}
                        className={`py-1.5 text-xs font-bold rounded-xl border transition-all ${
                          formData.tag === tag
                            ? "bg-neutral-900 text-white border-neutral-900"
                            : "bg-white text-neutral-600 border-neutral-200 hover:bg-neutral-50"
                        }`}
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Default checkbox */}
                <label className="flex items-center gap-2.5 pt-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isDefault}
                    onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
                    className="rounded text-[#2b97ba] focus:ring-[#2b97ba] w-4 h-4"
                  />
                  <span className="text-xs text-neutral-700 font-medium">
                    Set as default address
                  </span>
                </label>

                {/* Submit action */}
                <div className="pt-4 flex items-center justify-end gap-2 border-t border-neutral-100">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 text-xs font-bold uppercase text-neutral-600 hover:text-neutral-900 rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2 bg-neutral-900 hover:bg-[#2b97ba] text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow-sm"
                  >
                    {editingAddress ? "Update Address" : "Save Address"}
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
