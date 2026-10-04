"use client";

import { useEffect } from "react";
import { useAuthStore } from "@/stores/auth.store";

/**
 * Initializes and synchronizes authentication session on client mount.
 * Verifies active token against GET /auth/me and keeps store synchronized.
 */
export function AuthInitializer() {
  const checkSession = useAuthStore((state) => state.checkSession);

  useEffect(() => {
    // Check session on initial application load
    checkSession();

    // Optionally re-check on tab visibility changes
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        checkSession();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [checkSession]);

  return null;
}
