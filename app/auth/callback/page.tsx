"use client";

import React, { useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuthStore } from "@/stores/auth.store";
import { useCartStore } from "@/stores/cart.store";
import { AuthService } from "@/services/auth.service";

function AuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTarget = searchParams.get("redirect") || "/";
  const { setUser } = useAuthStore();

  useEffect(() => {
    try {
      // Helper to read cookie value
      const getCookie = (name: string) => {
        const match = document.cookie.match(new RegExp("(^| )" + name + "=([^;]+)"));
        return match ? decodeURIComponent(match[2]) : null;
      };

      const rawPayload = getCookie("oauth_user_payload");

      if (rawPayload) {
        const { user, token } = JSON.parse(rawPayload);

        if (user && user.email) {
          // 1. Set JWT access token for AuthService
          AuthService.setAccessToken(token);

          // 2. Set user session in Zustand persisted auth store
          setUser(user);

          // 3. Seamlessly merge anonymous guest cart with customer account
          useCartStore.getState().mergeGuestCartOnLogin().catch(() => {});

          // 4. Delete the temporary handshake cookie
          document.cookie = "oauth_user_payload=; path=/; max-age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT";

          // 5. Navigate to original intended destination
          router.replace(redirectTarget);
          return;
        }
      }

      // If no valid payload, redirect to login
      router.replace("/login?error=session_sync_failed");
    } catch (err) {
      console.error("[OAuth Session Handshake Error]:", err);
      router.replace("/login?error=session_sync_failed");
    }
  }, [router, redirectTarget, setUser]);

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center space-y-4 px-4">
      <div className="w-10 h-10 border-2 border-neutral-300 border-t-neutral-900 rounded-full animate-spin" />
      <div className="text-center space-y-1">
        <h2 className="text-sm font-bold uppercase tracking-wider text-neutral-900">
          Authenticating with Google
        </h2>
        <p className="text-xs text-neutral-500">
          Synchronizing your secure session and customer bag...
        </p>
      </div>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[70vh] flex items-center justify-center text-xs text-neutral-400">
          Loading authentication...
        </div>
      }
    >
      <AuthCallbackContent />
    </Suspense>
  );
}
