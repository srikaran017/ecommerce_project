"use client";

import React, { useState, useEffect } from "react";
import { CustomerService, CustomerAddress } from "@/services/customer.service";
import {
  MapPin,
  Plus,
  Home,
  Briefcase,
  MoreHorizontal,
  Check,
  Edit3,
  Trash2,
  X,
  CheckCircle2,
  Phone,
  Sparkles,
} from "lucide-react";

interface AddressesTabProps {
  onShowToast: (msg: string) => void;
}

export function AddressesTab({ onShowToast }: AddressesTabProps) {
  const [addresses, setAddresses] = useState<CustomerAddress[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<CustomerAddress | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    street: "",
    apartment: "",
    city: "",
    state: "",
    postalCode: "",
    country: "India",
    phone: "",
    tag: "Home" as "Home" | "Work" | "Other",
    isDefault: false,
  });

  useEffect(() => {
    async function load() {
      setIsLoading(true);
      try {
        const list = await CustomerService.getAddresses();
        setAddresses(list);
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, []);

  const openAddModal = () => {
    setEditingAddress(null);
    setFormData({
      firstName: "",
      lastName: "",
      street: "",
      apartment: "",
      city: "",
      state: "",
      postalCode: "",
      country: "India",
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
      street: addr.street || addr.addressLine1 || "",
      apartment: addr.apartment || addr.addressLine2 || "",
      city: addr.city,
      state: addr.state,
      postalCode: addr.postalCode,
      country: addr.country,
      phone: addr.phone || "",
      tag: (addr.tag as "Home" | "Work" | "Other") || "Home",
      isDefault: addr.isDefault,
    });
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.street || !formData.city || !formData.postalCode) {
      onShowToast("Please fill in the required street, city, and postal code fields.");
      return;
    }

    try {
      const payload: Partial<CustomerAddress> = {
        id: editingAddress ? editingAddress.id : undefined,
        firstName: formData.firstName,
        lastName: formData.lastName,
        address1: formData.street,
        address2: formData.apartment,
        city: formData.city,
        state: formData.state,
        postalCode: formData.postalCode,
        country: formData.country,
        phoneNumber: formData.phone,
        tag: formData.tag,
        isDefault: formData.isDefault,
      };
      const res = await CustomerService.saveAddress(payload);
      if (res.success) {
        setAddresses(res.data);
        setIsModalOpen(false);
        onShowToast(res.message);
      } else {
        onShowToast(res.message || "Failed to save address.");
      }
    } catch {
      onShowToast("Failed to save address.");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to remove this delivery address?")) return;

    // Optimistic UI Update (0ms delay)
    const previous = [...addresses];
    const target = previous.find((a) => a.id === id);
    let optimistic = previous.filter((a) => a.id !== id);
    // Invariant 4: If deleted was default, promote newest remaining
    if (target?.isDefault && optimistic.length > 0) {
      optimistic[0] = { ...optimistic[0], isDefault: true };
    }
    setAddresses(optimistic);

    try {
      const res = await CustomerService.deleteAddress(id);
      if (res.success) {
        setAddresses(res.data);
        onShowToast(res.message);
      } else {
        setAddresses(previous);
        onShowToast(res.message || "Failed to remove address");
      }
    } catch {
      setAddresses(previous);
      onShowToast("Failed to remove address");
    }
  };

  const handleSetDefault = async (id: string) => {
    // Optimistic UI Update (0ms delay)
    const previous = [...addresses];
    const optimistic = previous
      .map((a) => ({
        ...a,
        isDefault: a.id === id,
      }))
      .sort((a, b) => (b.isDefault ? 1 : 0) - (a.isDefault ? 1 : 0));
    setAddresses(optimistic);

    try {
      const res = await CustomerService.setDefaultAddress(id);
      if (res.success) {
        setAddresses(res.data);
        onShowToast(res.message);
      } else {
        setAddresses(previous);
        onShowToast(res.message || "Failed to update default address");
      }
    } catch {
      setAddresses(previous);
      onShowToast("Failed to update default address");
    }
  };

  return (
    <div className="bg-white rounded-xl border border-neutral-200/90 p-5 sm:p-6 shadow-xs space-y-6 animate-fade-in">
      {/* Header */}
      <div className="border-b border-neutral-100 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold text-neutral-900 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-neutral-500" />
            <span>Delivery addresses</span>
          </h2>
          <p className="text-xs text-neutral-500 mt-0.5">
            Manage your saved delivery destinations and billing addresses.
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="px-4 py-2 bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-medium rounded-lg transition-colors shadow-xs flex items-center gap-2 self-start sm:self-auto cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add address</span>
        </button>
      </div>

      {/* Address Cards Grid */}
      {isLoading ? (
        <div className="py-16 text-center space-y-2">
          <div className="w-6 h-6 border-2 border-neutral-300 border-t-neutral-900 rounded-full animate-spin mx-auto" />
          <p className="text-xs text-neutral-400">Loading addresses...</p>
        </div>
      ) : addresses.length === 0 ? (
        <div className="py-12 text-center space-y-3 bg-neutral-50/60 rounded-xl border border-neutral-200">
          <div className="w-12 h-12 rounded-full bg-neutral-100 text-neutral-500 flex items-center justify-center mx-auto">
            <MapPin className="w-6 h-6 stroke-[1.5]" />
          </div>
          <p className="text-sm font-semibold text-neutral-800">
            No saved addresses
          </p>
          <p className="text-xs text-neutral-500 max-w-sm mx-auto">
            Add your residential or office address to speed up checkout.
          </p>
          <button
            onClick={openAddModal}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-neutral-900 text-white text-xs font-medium rounded-lg hover:bg-neutral-800 cursor-pointer shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add address</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {addresses.map((addr) => (
            <div
              key={addr.id}
              className={`p-5 rounded-xl border transition-all relative flex flex-col justify-between gap-4 ${
                addr.isDefault
                  ? "border-neutral-900 ring-1 ring-neutral-900 bg-white shadow-xs"
                  : "border-neutral-200/90 bg-white hover:border-neutral-300 shadow-xs"
              }`}
            >
              <div className="space-y-3">
                {/* Badges */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
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
                </div>

                {/* Details */}
                <div className="text-xs sm:text-sm space-y-1 text-neutral-600">
                  <p className="font-semibold text-neutral-900 text-sm">
                    {addr.firstName} {addr.lastName}
                  </p>
                  <p>{addr.street || addr.addressLine1}</p>
                  {(addr.apartment || addr.addressLine2) && (
                    <p className="text-neutral-500">{addr.apartment || addr.addressLine2}</p>
                  )}
                  <p>
                    {addr.city}, {addr.state} {addr.postalCode}
                  </p>
                  <p>{addr.country}</p>
                  {addr.phone && (
                    <p className="pt-1 text-neutral-600 font-mono text-xs flex items-center gap-1.5">
                      <Phone className="w-3 h-3 text-neutral-400" />
                      <span>{addr.phone}</span>
                    </p>
                  )}
                </div>
              </div>

              {/* Action buttons */}
              <div className="pt-3 border-t border-neutral-100 flex items-center justify-between gap-2 text-xs">
                {!addr.isDefault ? (
                  <button
                    onClick={() => handleSetDefault(addr.id)}
                    className="text-xs font-medium text-neutral-700 hover:text-neutral-950 underline transition-colors cursor-pointer"
                  >
                    Set as default
                  </button>
                ) : (
                  <span className="text-xs text-neutral-500">
                    Default checkout address
                  </span>
                )}

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => openEditModal(addr)}
                    className="p-1.5 text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 rounded-lg transition-colors"
                    title="Edit Address"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(addr.id)}
                    className="p-1.5 text-neutral-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                    title="Delete Address"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-950/70 backdrop-blur-sm animate-fade-in">
          <div
            className="bg-white rounded-3xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-neutral-100 p-6 sm:p-7 space-y-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-neutral-100 pb-4">
              <h3 className="font-heading text-lg font-bold uppercase tracking-tight text-neutral-900">
                {editingAddress ? "Edit Delivery Address" : "Add New Delivery Address"}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-neutral-400 hover:text-neutral-700 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              {/* Names */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-neutral-700">
                    First Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    className="w-full px-3 py-2.5 text-xs rounded-xl border border-neutral-200 focus:outline-none focus:ring-1 focus:ring-amber-500"
                    placeholder="e.g. Eleanor"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-neutral-700">
                    Last Name
                  </label>
                  <input
                    type="text"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    className="w-full px-3 py-2.5 text-xs rounded-xl border border-neutral-200 focus:outline-none focus:ring-1 focus:ring-amber-500"
                    placeholder="e.g. Vance"
                  />
                </div>
              </div>

              {/* Phone */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold uppercase tracking-wider text-neutral-700">
                  Recipient Contact Phone *
                </label>
                <input
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-3 py-2.5 text-xs rounded-xl border border-neutral-200 focus:outline-none focus:ring-1 focus:ring-amber-500 font-mono"
                  placeholder="+91 98765 00002"
                />
              </div>

              {/* Street Address */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold uppercase tracking-wider text-neutral-700">
                  Street Address & Building Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.street}
                  onChange={(e) => setFormData({ ...formData, street: e.target.value })}
                  className="w-full px-3 py-2.5 text-xs rounded-xl border border-neutral-200 focus:outline-none focus:ring-1 focus:ring-amber-500"
                  placeholder="e.g. 102, Skyline Residency, Linking Road"
                />
              </div>

              {/* Apartment */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold uppercase tracking-wider text-neutral-700">
                  Apartment, Suite, Landmark (Optional)
                </label>
                <input
                  type="text"
                  value={formData.apartment}
                  onChange={(e) => setFormData({ ...formData, apartment: e.target.value })}
                  className="w-full px-3 py-2.5 text-xs rounded-xl border border-neutral-200 focus:outline-none focus:ring-1 focus:ring-amber-500"
                  placeholder="e.g. 4th Floor, Near Olive Bistro"
                />
              </div>

              {/* City & State */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-neutral-700">
                    City *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="w-full px-3 py-2.5 text-xs rounded-xl border border-neutral-200 focus:outline-none focus:ring-1 focus:ring-amber-500"
                    placeholder="Mumbai"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-neutral-700">
                    State / Region *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    className="w-full px-3 py-2.5 text-xs rounded-xl border border-neutral-200 focus:outline-none focus:ring-1 focus:ring-amber-500"
                    placeholder="Maharashtra"
                  />
                </div>
              </div>

              {/* PIN Code & Country */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-neutral-700">
                    PIN / Postal Code *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.postalCode}
                    onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                    className="w-full px-3 py-2.5 text-xs rounded-xl border border-neutral-200 focus:outline-none focus:ring-1 focus:ring-amber-500 font-mono"
                    placeholder="400050"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-neutral-700">
                    Country
                  </label>
                  <input
                    type="text"
                    disabled
                    value={formData.country}
                    className="w-full px-3 py-2.5 text-xs rounded-xl border border-neutral-200 bg-neutral-100 text-neutral-500 font-medium"
                  />
                </div>
              </div>

              {/* Tag selector */}
              <div className="space-y-1 pt-1">
                <label className="text-[11px] font-bold uppercase tracking-wider text-neutral-700">
                  Address Classification
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(["Home", "Work", "Other"] as const).map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => setFormData({ ...formData, tag })}
                      className={`py-2 text-xs font-bold rounded-xl border transition-all ${
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
                  disabled={addresses.length === 0 || (addresses.length === 1 && !!editingAddress)}
                  onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
                  className="rounded text-amber-600 focus:ring-amber-500 w-4 h-4 disabled:opacity-50"
                />
                <span className="text-xs text-neutral-700 font-medium">
                  Set as default delivery address for rapid checkout
                  {(addresses.length === 0 || (addresses.length === 1 && !!editingAddress)) && (
                    <span className="ml-1 text-neutral-400 font-normal">(Primary address is automatically default)</span>
                  )}
                </span>
              </label>

              {/* Submit button */}
              <div className="pt-4 flex items-center justify-end gap-2 border-t border-neutral-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 text-xs font-bold uppercase text-neutral-600 hover:text-neutral-900 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-neutral-900 hover:bg-amber-600 text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow-md"
                >
                  {editingAddress ? "Update Address" : "Save Address"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
