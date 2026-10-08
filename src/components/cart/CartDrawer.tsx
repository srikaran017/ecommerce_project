"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCartStore } from "@/stores/cart.store";

/**
 * CartDrawer is retired in favor of the dedicated Full-Page Cart (/cart).
 * Any unexpected trigger of isOpen cleanly redirects to /cart.
 */
export function CartDrawer() {
  const router = useRouter();
  const { isOpen, closeCart } = useCartStore();

  useEffect(() => {
    if (isOpen) {
      closeCart();
      router.push("/cart");
    }
  }, [isOpen, closeCart, router]);

  return null;
}
