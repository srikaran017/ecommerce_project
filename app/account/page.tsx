import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { featureConfig } from "@/config/feature.config";
import { storeConfig } from "@/config/store.config";
import { User, MapPin, Package, Heart, LogOut, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/Button";

export const metadata = {
  title: "Client Portal & Orders | Maison De Élégance",
};

export default function AccountPage() {
  if (!featureConfig.customerAccounts) {
    notFound();
  }

  const sampleUser = {
    name: "Aarav Sharma",
    email: "customer@example.com",
    phone: "+91 98765 00002",
    tier: "Atelier VIP Member",
  };

  const sampleOrders = [
    { id: "ORD-98231", items: "Mulberry Silk Draped Evening Gown (M)", total: "₹18,999", status: "Confirmed", date: "Today" },
    { id: "ORD-97450", items: "Structured Belgian Linen Shirt (L)", total: "₹4,999", status: "Delivered", date: "Jan 12, 2026" },
  ];

  return (
    <div className="py-12 bg-[var(--background)] min-h-screen">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--border)] pb-6">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-[0.25em] text-[var(--secondary)]">
              CLIENT PORTAL
            </span>
            <h1 className="font-heading text-3xl font-bold uppercase tracking-tight text-[var(--foreground)] mt-1">
              Welcome, {sampleUser.name}
            </h1>
            <p className="text-xs text-[var(--muted-foreground)] mt-0.5">
              {sampleUser.email} • {sampleUser.tier}
            </p>
          </div>

          <Button variant="outline" size="sm" leftIcon={<LogOut className="w-3.5 h-3.5" />}>
            SIGN OUT
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
          
          {/* Saved Delivery Addresses (5 cols) */}
          <div className="md:col-span-5 bg-[var(--muted)] p-6 rounded-[var(--radius)] border border-[var(--border)] space-y-4">
            <div className="flex items-center gap-2 text-[var(--foreground)] border-b border-[var(--border)] pb-3">
              <MapPin className="w-4 h-4" />
              <h3 className="text-xs font-bold uppercase tracking-wider">
                Default Delivery Address
              </h3>
            </div>

            <div className="text-xs space-y-1 text-[var(--muted-foreground)]">
              <p className="font-bold text-[var(--foreground)]">{sampleUser.name}</p>
              <p>102, Skyline Residency, Bandra West</p>
              <p>Mumbai, Maharashtra - 400050</p>
              <p>India</p>
              <p className="pt-1">Phone: {sampleUser.phone}</p>
            </div>

            <Button variant="outline" size="sm" className="w-full mt-2">
              MANAGE ADDRESSES
            </Button>
          </div>

          {/* Past Order History (7 cols) */}
          <div className="md:col-span-7 bg-[var(--background)] p-6 rounded-[var(--radius)] border border-[var(--border)] space-y-4">
            <div className="flex items-center gap-2 text-[var(--foreground)] border-b border-[var(--border)] pb-3">
              <Package className="w-4 h-4" />
              <h3 className="text-xs font-bold uppercase tracking-wider">
                Order History & Invoices
              </h3>
            </div>

            <div className="space-y-3">
              {sampleOrders.map((ord) => (
                <div
                  key={ord.id}
                  className="p-4 rounded-[var(--radius)] border border-[var(--border)] bg-[var(--muted)] flex items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-xs text-[var(--foreground)]">
                        #{ord.id}
                      </span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[var(--primary)] text-[var(--primary-foreground)]">
                        {ord.status}
                      </span>
                    </div>
                    <p className="text-xs text-[var(--muted-foreground)]">{ord.items}</p>
                    <p className="text-[11px] text-[var(--muted-foreground)]">{ord.date}</p>
                  </div>

                  <div className="text-right space-y-2">
                    <span className="text-xs font-bold text-[var(--foreground)] block">
                      {ord.total}
                    </span>
                    <Link
                      href={`/order-success/${ord.id}`}
                      className="inline-flex items-center gap-1 text-[11px] font-bold uppercase text-[var(--secondary)] hover:underline"
                    >
                      <span>Track</span>
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
