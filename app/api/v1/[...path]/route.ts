import { NextRequest, NextResponse } from "next/server";

const TARGET_API_URL =
  process.env.BACKEND_INTERNAL_URL ||
  "https://dress-ecomm-backend.onrender.com/api/v1";

async function proxyRequest(
  req: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  try {
    const { path } = await context.params;
    const subPath = (path || []).join("/");
    
    // Sanitize query params:
    // 1. Backend Prisma findMany fails with 500 when limit is forwarded as a string on admin routes, wishlist, or customer orders
    // 2. Sanitize sort parameter if invalid or has attached text (e.g. sort=newestis)
    const searchParams = new URLSearchParams(req.nextUrl.searchParams);
    if (
      subPath.startsWith("admin/") ||
      subPath.includes("wishlist") ||
      subPath === "orders" ||
      subPath.startsWith("orders/")
    ) {
      searchParams.delete("limit");
    }
    if (subPath.includes("wishlist")) {
      const sort = searchParams.get("sort");
      if (sort && !["newest", "oldest", "price_asc", "price_desc", "name_asc", "name_desc"].includes(sort)) {
        if (sort.startsWith("newest")) {
          searchParams.set("sort", "newest");
        } else {
          searchParams.delete("sort");
        }
      }
    }
    const cleanSearch = searchParams.toString() ? `?${searchParams.toString()}` : "";
    const targetUrl = `${TARGET_API_URL}/${subPath}${cleanSearch}`;

    // Filter headers to avoid CORS and host issues with backend
    const forwardHeaders = new Headers();
    req.headers.forEach((value, key) => {
      const lowerKey = key.toLowerCase();
      if (
        lowerKey !== "host" &&
        lowerKey !== "origin" &&
        lowerKey !== "referer" &&
        lowerKey !== "connection" &&
        lowerKey !== "content-length"
      ) {
        forwardHeaders.set(key, value);
      }
    });

    // Auto-attach Bearer token if Authorization header is missing (e.g. direct browser navigation)
    let autoRefreshedToken: string | null = null;
    if (!forwardHeaders.has("authorization")) {
      const cookieToken =
        req.cookies.get("auth_access_token")?.value ||
        req.cookies.get("accessToken")?.value ||
        req.cookies.get("token")?.value;
      if (cookieToken) {
        forwardHeaders.set("authorization", `Bearer ${cookieToken}`);
      } else {
        // Fallback: check if refreshToken cookie is present and exchange for access token
        const refreshTokenCookie = req.cookies.get("refreshToken")?.value;
        if (refreshTokenCookie) {
          try {
            const refreshRes = await fetch(`${TARGET_API_URL}/auth/refresh`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                cookie: req.headers.get("cookie") || `refreshToken=${refreshTokenCookie}`,
              },
              body: JSON.stringify({}),
            });
            if (refreshRes.ok) {
              const refreshJson = await refreshRes.json();
              if (refreshJson.success && refreshJson.data?.accessToken) {
                autoRefreshedToken = refreshJson.data.accessToken;
                forwardHeaders.set("authorization", `Bearer ${autoRefreshedToken}`);
              }
            }
          } catch (e) {
            console.warn("[Proxy Refresh Fallback Error]:", e);
          }
        }
      }
    }

    let body: any = null;
    if (req.method !== "GET" && req.method !== "HEAD") {
      body = await req.arrayBuffer();
    }

    const response = await fetch(targetUrl, {
      method: req.method,
      headers: forwardHeaders,
      body,
      redirect: "manual",
    });

    const responseHeaders = new Headers();
    response.headers.forEach((value, key) => {
      const lower = key.toLowerCase();
      if (
        lower !== "content-encoding" &&
        lower !== "content-length" &&
        lower !== "transfer-encoding" &&
        lower !== "set-cookie"
      ) {
        responseHeaders.set(key, value);
      }
    });

    // Forward Set-Cookie headers accurately to preserve HttpOnly refreshToken rotation
    if (typeof (response.headers as any).getSetCookie === "function") {
      const setCookies = (response.headers as any).getSetCookie();
      setCookies.forEach((cookieStr: string) => {
        responseHeaders.append("set-cookie", cookieStr);
      });
    } else {
      const singleCookie = response.headers.get("set-cookie");
      if (singleCookie) {
        responseHeaders.set("set-cookie", singleCookie);
      }
    }

    // If we auto-refreshed access token, set auth_access_token cookie in client response
    if (autoRefreshedToken) {
      responseHeaders.append(
        "set-cookie",
        `auth_access_token=${autoRefreshedToken}; Path=/; Max-Age=604800; SameSite=Lax;`
      );
    }

    const responseData = await response.arrayBuffer();
    let finalBody: any = responseData;

    // Post-process JSON payloads for static delivery charge and cookie synchronization
    const contentType = responseHeaders.get("content-type") || "";
    if (contentType.includes("application/json") && response.ok) {
      try {
        const text = Buffer.from(responseData).toString("utf-8");
        const parsed = JSON.parse(text);

        // 1. If login or refresh, set auth_access_token cookie so browser direct hits work
        if (subPath === "auth/login" || subPath === "auth/register" || subPath === "auth/refresh") {
          const accessToken = parsed.data?.accessToken || parsed.accessToken;
          if (accessToken) {
            responseHeaders.append(
              "set-cookie",
              `auth_access_token=${accessToken}; Path=/; Max-Age=604800; SameSite=Lax;`
            );
          }
        }

        // 2. If checkout/summary, enforce static 150 delivery charge and 0 extra tax for all customers
        if (subPath.includes("checkout/summary") && parsed.data?.pricing) {
          parsed.data.pricing.shippingAmount = 150;
          parsed.data.pricing.taxAmount = 0;
          const sub = Number(parsed.data.pricing.subtotal || 0);
          const disc = Number(parsed.data.pricing.discountAmount || 0);
          const taxable = Math.max(0, sub - disc);
          parsed.data.pricing.totalAmount = Math.round((taxable + 150) * 100) / 100;
          finalBody = Buffer.from(JSON.stringify(parsed), "utf-8");
        }

        // 3. If cart response, ensure static shipping reflects 150 and tax is 0 when items exist
        if ((subPath === "cart" || subPath.startsWith("cart/")) && parsed.data) {
          const hasItems =
            (parsed.data.itemCount && parsed.data.itemCount > 0) ||
            (Array.isArray(parsed.data.items) && parsed.data.items.length > 0);
          if (hasItems) {
            parsed.data.shipping = 150;
            parsed.data.tax = 0;
            finalBody = Buffer.from(JSON.stringify(parsed), "utf-8");
          }
        }
      } catch {}
    } else if (subPath === "auth/logout") {
      responseHeaders.append(
        "set-cookie",
        "auth_access_token=; Path=/; Max-Age=0; SameSite=Lax;"
      );
    }

    return new NextResponse(finalBody, {
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
    });
  } catch (error: any) {
    console.error("[Next.js API Proxy Error]:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to connect to backend service.",
        error: error.message,
      },
      { status: 502 }
    );
  }
}

export const GET = proxyRequest;
export const POST = proxyRequest;
export const PUT = proxyRequest;
export const PATCH = proxyRequest;
export const DELETE = proxyRequest;
export const OPTIONS = proxyRequest;
