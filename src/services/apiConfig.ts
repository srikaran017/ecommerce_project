/**
 * API Base URL Resolver
 * Resolves the backend URL safely across SSR (server) and Browser (client) contexts.
 */

export function getApiBaseUrl(): string {
  const envUrl = process.env.NEXT_PUBLIC_API_URL;

  // 1. Server-side execution (Next.js SSR / Server Components / static generation)
  // Must use an absolute URL
  if (typeof window === "undefined") {
    return envUrl && envUrl.startsWith("http")
      ? envUrl
      : "https://dress-ecomm-backend.onrender.com/api/v1";
  }

  // 2. Client-side execution in Browser
  if (envUrl && envUrl.startsWith("/")) {
    return envUrl;
  }

  const isLocalhost =
    typeof window !== "undefined" &&
    (window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1");

  // When deployed to production (e.g. Vercel) and targeting the Render backend:
  // Render's CORS policy blocks non-localhost origins unless explicitly added.
  // Using the Next.js same-origin proxy (/api/v1) seamlessly bypasses CORS in the browser.
  if (
    !isLocalhost &&
    (!envUrl || envUrl.includes("dress-ecomm-backend.onrender.com"))
  ) {
    return "/api/v1";
  }

  return envUrl || "https://dress-ecomm-backend.onrender.com/api/v1";
}
