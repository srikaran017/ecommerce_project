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
  // If explicitly configured with a relative path (e.g. /api/v1), use it
  if (envUrl && envUrl.startsWith("/")) {
    return envUrl;
  }

  // In browser, ALWAYS use the Next.js same-origin proxy (/api/v1).
  // This completely eliminates browser CORS preflight failures and ensures
  // authenticated requests pass smoothly server-to-server.
  return "/api/v1";
}
