"use client";

import { useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function CheckoutSuccessHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderNumber = searchParams.get("orderNumber");

  useEffect(() => {
    if (orderNumber) {
      router.replace(`/orders/${orderNumber}/confirmation`);
    } else {
      router.replace("/orders");
    }
  }, [orderNumber, router]);

  return (
    <div className="py-24 text-center min-h-[50vh] flex flex-col items-center justify-center space-y-4">
      <div className="w-8 h-8 rounded-full border-2 border-neutral-300 border-t-neutral-900 animate-spin" />
      <p className="text-xs uppercase tracking-wider text-[var(--muted-foreground)]">
        Redirecting to Order Confirmation...
      </p>
    </div>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="py-24 text-center min-h-[50vh] flex flex-col items-center justify-center space-y-4">
          <div className="w-8 h-8 rounded-full border-2 border-neutral-300 border-t-neutral-900 animate-spin" />
          <p className="text-xs uppercase tracking-wider text-[var(--muted-foreground)]">
            Loading...
          </p>
        </div>
      }
    >
      <CheckoutSuccessHandler />
    </Suspense>
  );
}
