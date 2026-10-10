import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const clientId = process.env.GOOGLE_CLIENT_ID || process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
  const redirectTarget = req.nextUrl.searchParams.get("redirect") || "/";

  // Check if Google Client ID is configured
  if (!clientId || clientId === "YOUR_GOOGLE_CLIENT_ID") {
    const errorUrl = new URL("/login", req.url);
    errorUrl.searchParams.set("error", "google_oauth_unconfigured");
    if (redirectTarget) {
      errorUrl.searchParams.set("redirect", redirectTarget);
    }
    return NextResponse.redirect(errorUrl);
  }

  // Determine base URL for callback
  const host = req.headers.get("x-forwarded-host") || req.headers.get("host") || "localhost:3000";
  const protocol = req.headers.get("x-forwarded-proto") || (host.startsWith("localhost") ? "http" : "https");
  const callbackUrl = `${protocol}://${host}/api/auth/callback/google`;

  // Cryptographically random state parameter for CSRF defense
  const state = crypto.randomUUID();

  // Construct official Google OAuth 2.0 authorization URL
  const googleAuthUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  googleAuthUrl.searchParams.set("client_id", clientId);
  googleAuthUrl.searchParams.set("redirect_uri", callbackUrl);
  googleAuthUrl.searchParams.set("response_type", "code");
  googleAuthUrl.searchParams.set("scope", "openid email profile");
  googleAuthUrl.searchParams.set("state", state);
  googleAuthUrl.searchParams.set("prompt", "select_account");

  const response = NextResponse.redirect(googleAuthUrl);

  // Set secure CSRF state and redirect target in cookies (10 minutes TTL)
  const isProd = process.env.NODE_ENV === "production";
  response.cookies.set("oauth_state", state, {
    httpOnly: true,
    secure: isProd,
    sameSite: "lax",
    path: "/",
    maxAge: 600,
  });

  response.cookies.set("oauth_redirect", redirectTarget, {
    httpOnly: true,
    secure: isProd,
    sameSite: "lax",
    path: "/",
    maxAge: 600,
  });

  return response;
}
