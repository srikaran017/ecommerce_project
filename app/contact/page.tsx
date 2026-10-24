"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Mail,
  Phone,
  MapPin,
  MessageSquare,
  Clock,
  Sparkles,
  Send,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  ChevronRight,
  ShieldCheck,
} from "lucide-react";
import { storeConfig } from "@/config/store.config";
import { featureConfig } from "@/config/feature.config";
import { ContactService, ContactInquiryPayload } from "@/services/contact.service";
import { Button } from "@/components/ui/Button";

const SUBJECT_SUGGESTIONS = [
  "Bespoke Sizing & Customization",
  "Bridal & Festive Trousseau",
  "Order Status & Delivery Tracking",
  "Private Atelier Consultation",
  "Returns, Alterations & Exchange",
  "Wholesale & Corporate Inquiries",
];

export default function ContactPage() {
  const [form, setForm] = useState<ContactInquiryPayload>({
    name: "",
    email: "",
    phone: "",
    subject: "",
    message: "",
  });

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [submittedInquiry, setSubmittedInquiry] = useState<{
    id: string;
    name: string;
    subject: string;
    createdAt: string;
  } | null>(null);
  const [generalError, setGeneralError] = useState("");

  const validate = () => {
    const errs: Record<string, string> = {};

    if (!form.name.trim() || form.name.trim().length < 2) {
      errs.name = "Name must be at least 2 characters.";
    } else if (form.name.length > 100) {
      errs.name = "Name cannot exceed 100 characters.";
    }

    if (!form.email.trim()) {
      errs.email = "Email address is required.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      errs.email = "Please enter a valid email address.";
    }

    if (form.phone && form.phone.trim().length > 25) {
      errs.phone = "Phone number cannot exceed 25 characters.";
    }

    if (!form.subject.trim() || form.subject.trim().length < 3) {
      errs.subject = "Subject must be at least 3 characters.";
    } else if (form.subject.length > 200) {
      errs.subject = "Subject cannot exceed 200 characters.";
    }

    if (!form.message.trim() || form.message.trim().length < 10) {
      errs.message = "Message must be at least 10 characters long.";
    } else if (form.message.length > 3000) {
      errs.message = "Message cannot exceed 3000 characters.";
    }

    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGeneralError("");

    if (!validate()) return;

    setIsSubmitting(true);
    try {
      const res = await ContactService.submitInquiry(form);
      if (res.success && res.data?.inquiry) {
        setIsSuccess(true);
        setSubmittedInquiry(res.data.inquiry);
        setForm({
          name: "",
          email: "",
          phone: "",
          subject: "",
          message: "",
        });
      } else {
        setGeneralError(
          res.message || "Failed to submit inquiry. Please review your details and try again."
        );
      }
    } catch (err: any) {
      setGeneralError(err.message || "An unexpected error occurred. Please try again later.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="py-10 bg-[var(--background)] min-h-screen text-[var(--foreground)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Breadcrumb Hierarchy */}
        <nav className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-widest text-neutral-500 mb-8">
          <Link href="/" className="hover:text-neutral-900 transition-colors">
            Home
          </Link>
          <ChevronRight className="w-3 h-3 text-neutral-400" />
          <span className="text-neutral-900 font-bold">Contact Concierge</span>
        </nav>

        {/* Editorial Pastel Header */}
        <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-[#faf5ef] via-[#f7ece2] to-[#fdede0] border border-[#ead9c9] p-8 sm:p-12 mb-12 shadow-sm">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -top-24 -right-24 w-88 h-88 rounded-full bg-amber-200/35 blur-3xl"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -bottom-24 -left-24 w-80 h-80 rounded-full bg-rose-200/30 blur-3xl"
          />

          <div className="relative z-10 max-w-2xl space-y-3.5">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-[0.25em] bg-white/90 text-amber-900 border border-amber-200/80 shadow-2xs backdrop-blur-sm">
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              <span>PRIVATE CLIENT SERVICES</span>
            </div>

            <h1 className="font-heading text-3xl sm:text-5xl font-bold uppercase tracking-tight text-neutral-900">
              Contact Concierge Desk
            </h1>

            <p className="text-xs sm:text-sm text-neutral-600 leading-relaxed max-w-xl">
              Whether you require bespoke sizing, bridal trousseau consultations, or assistance with your recent order, our atelier advisors are dedicated to your service.
            </p>
          </div>
        </div>

        {/* Two-Column Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

          {/* Left Column: Direct Concierge Touchpoints (5 cols) */}
          <div className="lg:col-span-5 space-y-5">

            {/* Quick Contact Card */}
            <div className="bg-white rounded-3xl border border-neutral-200/80 p-6 sm:p-8 space-y-6 shadow-xs">
              <h2 className="font-heading text-base font-bold uppercase tracking-wider text-neutral-900 border-b border-neutral-100 pb-4">
                Atelier Directory
              </h2>

              <div className="space-y-5 text-xs">
                {/* Email */}
                <div className="flex items-start gap-3.5">
                  <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-900 border border-amber-200/60 flex items-center justify-center flex-shrink-0 shadow-2xs">
                    <Mail className="w-4 h-4 text-amber-700" />
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block">
                      Concierge Email
                    </span>
                    <a
                      href={`mailto:${storeConfig.contact.email}`}
                      className="font-medium text-neutral-900 hover:text-amber-700 transition-colors"
                    >
                      {storeConfig.contact.email}
                    </a>
                    <p className="text-[11px] text-neutral-500">
                      Average response time: within 2 to 4 business hours.
                    </p>
                  </div>
                </div>

                {/* Phone */}
                <div className="flex items-start gap-3.5">
                  <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-900 border border-amber-200/60 flex items-center justify-center flex-shrink-0 shadow-2xs">
                    <Phone className="w-4 h-4 text-amber-700" />
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block">
                      Client Services Hotline
                    </span>
                    <a
                      href={`tel:${storeConfig.contact.phone.replace(/[^0-9+]/g, "")}`}
                      className="font-medium text-neutral-900 hover:text-amber-700 transition-colors"
                    >
                      {storeConfig.contact.phone}
                    </a>
                    <p className="text-[11px] text-neutral-500">
                      Monday to Saturday, 10:00 AM – 7:00 PM IST.
                    </p>
                  </div>
                </div>

                {/* WhatsApp */}
                {featureConfig.whatsapp && (
                  <div className="flex items-start gap-3.5">
                    <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-900 border border-emerald-200/60 flex items-center justify-center flex-shrink-0 shadow-2xs">
                      <MessageSquare className="w-4 h-4 text-emerald-600" />
                    </div>
                    <div className="space-y-0.5">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block">
                        Instant WhatsApp Chat
                      </span>
                      <a
                        href={`https://wa.me/${storeConfig.contact.whatsapp.replace(/[^0-9]/g, "")}`}
                        target="_blank"
                        rel="noreferrer"
                        className="font-medium text-emerald-700 hover:text-emerald-800 transition-colors inline-flex items-center gap-1 font-semibold"
                      >
                        <span>Start WhatsApp Chat</span>
                        <ChevronRight className="w-3 h-3" />
                      </a>
                      <p className="text-[11px] text-neutral-500">
                        Direct messaging with our personal styling team.
                      </p>
                    </div>
                  </div>
                )}

                {/* Showroom Address */}
                <div className="flex items-start gap-3.5">
                  <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-900 border border-amber-200/60 flex items-center justify-center flex-shrink-0 shadow-2xs">
                    <MapPin className="w-4 h-4 text-amber-700" />
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block">
                      Flagship Boutique & Atelier
                    </span>
                    <p className="font-medium text-neutral-900">
                      {storeConfig.contact.address.street}
                    </p>
                    <p className="text-[11px] text-neutral-500">
                      {storeConfig.contact.address.city}, {storeConfig.contact.address.state} - {storeConfig.contact.address.postalCode}, {storeConfig.contact.address.country}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Atelier Assurance Box */}
            <div className="bg-gradient-to-br from-[#faf5ef] to-white rounded-3xl border border-[#ead9c9] p-6 space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-900">
                <ShieldCheck className="w-4 h-4 text-amber-700" />
                <span>Our Bespoke Guarantee</span>
              </div>
              <p className="text-xs text-neutral-600 leading-relaxed">
                Every inquiry submitted to our concierge is reviewed by a specialized sartorial advisor. For urgent requests regarding ongoing orders, please reference your order number in the message.
              </p>
            </div>

          </div>

          {/* Right Column: Contact Inquiry Form (7 cols) */}
          <div className="lg:col-span-7">
            <div className="bg-white rounded-3xl border border-neutral-200/80 p-6 sm:p-10 shadow-xs space-y-6">

              <div>
                <h2 className="font-heading text-lg font-bold uppercase tracking-wide text-neutral-900">
                  Send a Private Inquiry
                </h2>
                <p className="text-xs text-neutral-500 mt-1">
                  Fill in your details below and our team will get back to you promptly.
                </p>
              </div>

              {/* Success Notification Banner */}
              {isSuccess && submittedInquiry && (
                <div className="p-5 bg-emerald-50 border border-emerald-200 rounded-2xl space-y-3 animate-in fade-in">
                  <div className="flex items-center gap-2 text-emerald-950 font-bold text-xs uppercase tracking-wider">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                    <span>Inquiry Successfully Dispatched</span>
                  </div>
                  <p className="text-xs text-emerald-900 leading-relaxed">
                    Thank you, <strong>{submittedInquiry.name}</strong>. Your inquiry regarding "<strong>{submittedInquiry.subject}</strong>" has been recorded under reference code <code className="bg-emerald-100/80 px-1.5 py-0.5 rounded text-[11px] font-mono text-emerald-950">{submittedInquiry.id.slice(0, 8)}</code>.
                  </p>
                  <p className="text-[11px] text-emerald-800">
                    A confirmation has been sent to your email. Our team will contact you shortly.
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-emerald-300 text-emerald-950 font-semibold text-xs"
                    onClick={() => {
                      setIsSuccess(false);
                      setSubmittedInquiry(null);
                    }}
                  >
                    Send another message
                  </Button>
                </div>
              )}

              {/* General Error Alert */}
              {generalError && (
                <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium rounded-2xl flex items-center gap-2.5 animate-in fade-in">
                  <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                  <span>{generalError}</span>
                </div>
              )}

              {/* Inquiry Form */}
              <form onSubmit={handleSubmit} className="space-y-5 text-xs">

                {/* Name & Email Row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="font-bold text-neutral-800 uppercase tracking-wider block text-[11px]">
                      Full Name <span className="text-rose-600">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Reshi"
                      value={form.name}
                      onChange={(e) => {
                        setForm({ ...form, name: e.target.value });
                        if (fieldErrors.name) setFieldErrors({ ...fieldErrors, name: "" });
                      }}
                      className={`w-full px-4 py-3 bg-neutral-50/70 border rounded-2xl text-neutral-900 text-xs font-medium focus:bg-white focus:outline-none transition-colors ${fieldErrors.name
                          ? "border-rose-500 focus:border-rose-600"
                          : "border-neutral-200 focus:border-neutral-900"
                        }`}
                    />
                    {fieldErrors.name && (
                      <p className="text-[11px] text-rose-600 font-medium pl-1">{fieldErrors.name}</p>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-bold text-neutral-800 uppercase tracking-wider block text-[11px]">
                      Email Address <span className="text-rose-600">*</span>
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="name@example.com"
                      value={form.email}
                      onChange={(e) => {
                        setForm({ ...form, email: e.target.value });
                        if (fieldErrors.email) setFieldErrors({ ...fieldErrors, email: "" });
                      }}
                      className={`w-full px-4 py-3 bg-neutral-50/70 border rounded-2xl text-neutral-900 text-xs font-medium focus:bg-white focus:outline-none transition-colors ${fieldErrors.email
                          ? "border-rose-500 focus:border-rose-600"
                          : "border-neutral-200 focus:border-neutral-900"
                        }`}
                    />
                    {fieldErrors.email && (
                      <p className="text-[11px] text-rose-600 font-medium pl-1">{fieldErrors.email}</p>
                    )}
                  </div>
                </div>

                {/* Phone & Subject Row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="font-bold text-neutral-800 uppercase tracking-wider block text-[11px]">
                      Phone Number <span className="text-neutral-400 font-normal">(Optional)</span>
                    </label>
                    <input
                      type="tel"
                      placeholder="+91 98765 43210"
                      value={form.phone || ""}
                      onChange={(e) => {
                        setForm({ ...form, phone: e.target.value });
                        if (fieldErrors.phone) setFieldErrors({ ...fieldErrors, phone: "" });
                      }}
                      className="w-full px-4 py-3 bg-neutral-50/70 border border-neutral-200 rounded-2xl text-neutral-900 text-xs font-medium focus:bg-white focus:border-neutral-900 focus:outline-none transition-colors"
                    />
                    {fieldErrors.phone && (
                      <p className="text-[11px] text-rose-600 font-medium pl-1">{fieldErrors.phone}</p>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-bold text-neutral-800 uppercase tracking-wider block text-[11px]">
                      Subject <span className="text-rose-600">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Inquiry regarding custom sizing"
                      value={form.subject}
                      onChange={(e) => {
                        setForm({ ...form, subject: e.target.value });
                        if (fieldErrors.subject) setFieldErrors({ ...fieldErrors, subject: "" });
                      }}
                      className={`w-full px-4 py-3 bg-neutral-50/70 border rounded-2xl text-neutral-900 text-xs font-medium focus:bg-white focus:outline-none transition-colors ${fieldErrors.subject
                          ? "border-rose-500 focus:border-rose-600"
                          : "border-neutral-200 focus:border-neutral-900"
                        }`}
                    />
                    {fieldErrors.subject && (
                      <p className="text-[11px] text-rose-600 font-medium pl-1">{fieldErrors.subject}</p>
                    )}
                  </div>
                </div>

                {/* Quick Subject Suggestion Pills */}
                <div className="space-y-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block">
                    Quick Suggestions
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {SUBJECT_SUGGESTIONS.map((sug) => (
                      <button
                        key={sug}
                        type="button"
                        onClick={() => {
                          setForm({ ...form, subject: sug });
                          if (fieldErrors.subject) setFieldErrors({ ...fieldErrors, subject: "" });
                        }}
                        className={`text-[11px] px-2.5 py-1 rounded-full border transition-colors cursor-pointer ${form.subject === sug
                            ? "bg-neutral-900 text-white border-neutral-900 font-semibold"
                            : "bg-neutral-50 text-neutral-600 border-neutral-200 hover:bg-neutral-100"
                          }`}
                      >
                        {sug}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Message */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="font-bold text-neutral-800 uppercase tracking-wider block text-[11px]">
                      Your Message <span className="text-rose-600">*</span>
                    </label>
                    <span className="text-[10px] text-neutral-400">
                      {form.message.length} / 3000 chars
                    </span>
                  </div>
                  <textarea
                    rows={5}
                    required
                    minLength={10}
                    maxLength={3000}
                    placeholder="Please describe your bespoke requirements, product question, or order details (minimum 10 characters)..."
                    value={form.message}
                    onChange={(e) => {
                      setForm({ ...form, message: e.target.value });
                      if (fieldErrors.message) setFieldErrors({ ...fieldErrors, message: "" });
                    }}
                    className={`w-full p-4 bg-neutral-50/70 border rounded-2xl text-neutral-900 text-xs font-medium focus:bg-white focus:outline-none transition-colors leading-relaxed ${fieldErrors.message
                        ? "border-rose-500 focus:border-rose-600"
                        : "border-neutral-200 focus:border-neutral-900"
                      }`}
                  />
                  {fieldErrors.message && (
                    <p className="text-[11px] text-rose-600 font-medium pl-1">{fieldErrors.message}</p>
                  )}
                </div>

                <div className="pt-2">
                  <Button
                    type="submit"
                    variant="primary"
                    size="md"
                    isLoading={isSubmitting}
                    className="w-full sm:w-auto px-8 py-3.5 text-xs font-bold uppercase tracking-wider shadow-xs"
                    rightIcon={<Send className="w-4 h-4" />}
                  >
                    {isSubmitting ? "Dispatching Inquiry..." : "Submit Message to Concierge"}
                  </Button>
                </div>
              </form>

            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
