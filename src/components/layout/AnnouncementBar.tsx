import React from "react";
import { storeConfig } from "@/config/store.config";

export function AnnouncementBar() {
  return (
    <div className="bg-[var(--primary)] text-[var(--primary-foreground)] text-[11px] font-medium tracking-widest uppercase py-2 px-4 text-center border-b border-[var(--border)] opacity-95">
      <span>
        EXPRESS COURIER DELIVERY • FLAT {storeConfig.currency.symbol}{storeConfig.shipping.flatRate} ON ALL ORDERS ACROSS INDIA
      </span>
    </div>
  );
}
