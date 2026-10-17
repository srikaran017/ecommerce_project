"use client";

import React, { useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuthStore } from "@/stores/auth.store";
import { useCartStore } from "@/stores/cart.store";
import { useWishlistStore } from "@/stores/wishlist.store";
import { AuthService } from "@/services/auth.service";

function parsePayload(raw: string | null): any {
  if (!raw) return null;
  // Attempt 1: Base64URL / Base64 decode
  try {
    const base64 = raw.replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), "=");
    const binary = atob(padded);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    const jsonStr = new TextDecoder().decode(bytes);
    return JSON.parse(jsonStr);
  } catch {}

  // Attempt 2: URL decoded JSON string
  try {
    return JSON.parse(decodeURIComponent(raw));
  } catch {}

  // Attempt 3: Direct JSON string
  try {
    return JSON.parse(raw);
  } catch {}

  return null;
}

function AuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTarget = searchParams.get("redirect") || "/";
  const { setUser } = useAuthStore();

  useEffect(() => {
    let timeoutId: NodeJS.Timeout | null = null;

    const processAuth = (): boolean => {
      try {
        // Helper to read cookie value
        const getCookie = (name: string) => {
          const match = document.cookie.match(new RegExp("(^|; )" + name + "=([^;]+)"));
          return match ? match[2] : null;
        };

        // Priority 1: Direct URL search parameter (?session=...)
        const urlSession = searchParams.get("session") || searchParams.get("payload");
        const rawPayload = urlSession || getCookie("oauth_user_payload");

        if (rawPayload) {
          const parsed = parsePayload(rawPayload);

          if (parsed && parsed.user && parsed.user.email) {
            // 1. Set JWT access token for AuthService
            if (parsed.token) {
              AuthService.setAccessToken(parsed.token);
            }

            // 2. Set user session in Zustand persisted auth store
            setUser(parsed.user);

            // 3. Seamlessly merge anonymous guest cart with customer account
            useCartStore.getState().mergeGuestCartOnLogin().catch(() => {});

            // 4. Immediately trigger customer wishlist loading
            useWishlistStore.getState().loadWishlistIds().catch(() => {});

            // 5. Delete the temporary handshake cookie
            try {
              document.cookie = "oauth_user_payload=; path=/; max-age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT";
            } catch {}

            // 6. Navigate to original intended destination
            router.replace(redirectTarget);
            return true;
          }
        }

        return false;
      } catch (err) {
        console.error("[OAuth Session Handshake Error]:", err);
        return false;
      }
    };

    // Immediate attempt
    const success = processAuth();
    if (success) return;

    // Retry once after 250ms in case cookies or router state need an async frame
    timeoutId = setTimeout(() => {
      const retrySuccess = processAuth();
      if (!retrySuccess) {
        router.replace("/login?error=session_sync_failed");
      }
    }, 250);

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [router, searchParams, redirectTarget, setUser]);

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
