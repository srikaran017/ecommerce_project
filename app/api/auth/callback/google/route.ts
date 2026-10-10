import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  const storedState = req.cookies.get("oauth_state")?.value;
  const redirectTarget = req.cookies.get("oauth_redirect")?.value || "/";

  const host = req.headers.get("x-forwarded-host") || req.headers.get("host") || "localhost:3000";
  const protocol = req.headers.get("x-forwarded-proto") || (host.startsWith("localhost") ? "http" : "https");
  const callbackUrl = `${protocol}://${host}/api/auth/callback/google`;
  const loginUrl = new URL("/login", req.url);
  if (redirectTarget) {
    loginUrl.searchParams.set("redirect", redirectTarget);
  }

  // Handle user cancellation on Google's consent screen
  if (error) {
    loginUrl.searchParams.set("error", error === "access_denied" ? "google_cancelled" : "google_oauth_failed");
    const res = NextResponse.redirect(loginUrl);
    res.cookies.delete("oauth_state");
    res.cookies.delete("oauth_redirect");
    return res;
  }

  // Validate CSRF state parameter
  if (!state || !storedState || state !== storedState) {
    loginUrl.searchParams.set("error", "invalid_oauth_state");
    const res = NextResponse.redirect(loginUrl);
    res.cookies.delete("oauth_state");
    res.cookies.delete("oauth_redirect");
    return res;
  }

  if (!code) {
    loginUrl.searchParams.set("error", "missing_oauth_code");
    return NextResponse.redirect(loginUrl);
  }

  const clientId = process.env.GOOGLE_CLIENT_ID || process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (!clientId || !clientSecret || clientId === "YOUR_GOOGLE_CLIENT_ID") {
    loginUrl.searchParams.set("error", "google_oauth_unconfigured");
    return NextResponse.redirect(loginUrl);
  }

  try {
    // 1. Exchange authorization code for tokens with Google
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: callbackUrl,
        grant_type: "authorization_code",
      }),
    });

    const tokenData = await tokenResponse.json();

    if (!tokenResponse.ok || !tokenData.access_token) {
      console.error("[Google OAuth Token Error]:", tokenData);
      loginUrl.searchParams.set("error", "google_token_exchange_failed");
      return NextResponse.redirect(loginUrl);
    }

    // 2. Fetch authenticated user profile from Google UserInfo endpoint
    const userInfoResponse = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
      },
    });

    const profile = await userInfoResponse.json();

    if (!userInfoResponse.ok || !profile.email) {
      console.error("[Google OAuth UserInfo Error]:", profile);
      loginUrl.searchParams.set("error", "google_profile_fetch_failed");
      return NextResponse.redirect(loginUrl);
    }

    // 3. Synchronize customer with backend server database to create real account & JWT
    const TARGET_API_URL =
      process.env.BACKEND_INTERNAL_URL ||
      process.env.NEXT_PUBLIC_API_URL ||
      "https://dress-ecomm-backend.onrender.com/api/v1";

    const secretSalt = process.env.AUTH_SECRET || "ecomm_google_auth_salt_9988";
    const googleUserPassword = `GAuth_${crypto
      .createHash("sha256")
      .update(`${profile.sub}_${profile.email}_${secretSalt}`)
      .digest("hex")
      .slice(0, 16)}!Aa1`;

    let backendToken: string | null = null;
    let backendUser: any = null;

    try {
      // Step A: Attempt backend login
      const loginRes = await fetch(`${TARGET_API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: profile.email.toLowerCase().trim(),
          password: googleUserPassword,
        }),
      });

      const loginData = await loginRes.json().catch(() => ({}));

      if (loginRes.ok && loginData.success && loginData.data?.accessToken) {
        backendToken = loginData.data.accessToken;
        backendUser = loginData.data.user;
      } else {
        // Step B: Attempt backend registration
        const registerRes = await fetch(`${TARGET_API_URL}/auth/register`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: profile.name || profile.email.split("@")[0],
            email: profile.email.toLowerCase().trim(),
            password: googleUserPassword,
            role: "CUSTOMER",
          }),
        });

        const regData = await registerRes.json().catch(() => ({}));

        if (registerRes.ok && regData.success) {
          // Auto-login to obtain authoritative backend JWT
          const autoLoginRes = await fetch(`${TARGET_API_URL}/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              email: profile.email.toLowerCase().trim(),
              password: googleUserPassword,
            }),
          });
          const autoData = await autoLoginRes.json().catch(() => ({}));
          if (autoLoginRes.ok && autoData.data?.accessToken) {
            backendToken = autoData.data.accessToken;
            backendUser = autoData.data.user;
          } else {
            backendUser = regData.data?.user;
          }
        }
      }
    } catch (backendErr) {
      console.warn("[Backend Google User Sync Exception]:", backendErr);
    }

    // 4. Create customer session (strictly "CUSTOMER" role - zero admin elevation)
    const userSession = {
      id: backendUser?.id || (profile.sub ? `usr_google_${profile.sub}` : `usr_${Date.now()}`),
      name: backendUser?.name || profile.name || profile.email.split("@")[0],
      email: (backendUser?.email || profile.email).toLowerCase().trim(),
      avatarUrl: profile.picture || undefined,
      role: "CUSTOMER" as const,
      createdAt: backendUser?.createdAt || new Date().toISOString(),
    };

    const sessionToken =
      backendToken ||
      tokenData.id_token ||
      `google_session_${Date.now()}_${Buffer.from(profile.email).toString("base64")}`;

    // 5. Redirect to client-side callback page to sync Zustand store & localStorage
    const successUrl = new URL("/auth/callback", req.url);
    successUrl.searchParams.set("redirect", redirectTarget);

    const response = NextResponse.redirect(successUrl);

    // Set temporary session payload in secure cookie for client handshake
    const isProd = process.env.NODE_ENV === "production";
    response.cookies.set("oauth_user_payload", JSON.stringify({ user: userSession, token: sessionToken }), {
      httpOnly: false, // Accessible by client bridge page
      secure: isProd,
      sameSite: "lax",
      path: "/",
      maxAge: 60, // 1 minute temporary handshake window
    });

    // Clean up temporary OAuth cookies
    response.cookies.delete("oauth_state");
    response.cookies.delete("oauth_redirect");

    return response;
  } catch (err: any) {
    console.error("[Google OAuth Processing Exception]:", err);
    loginUrl.searchParams.set("error", "oauth_internal_error");
    return NextResponse.redirect(loginUrl);
  }
}
