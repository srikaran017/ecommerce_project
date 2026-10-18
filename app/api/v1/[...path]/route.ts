import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

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

    // Guard against literal "undefined" or "null" in URL path
    if (
      subPath.includes("/undefined") ||
      subPath.startsWith("undefined") ||
      subPath.endsWith("/undefined") ||
      subPath === "undefined" ||
      subPath.includes("/null") ||
      subPath.startsWith("null") ||
      subPath.endsWith("/null") ||
      subPath === "null"
    ) {
      return NextResponse.json(
        {
          success: false,
          message: `Bad Request: URL path '${subPath}' contains an invalid 'undefined' or 'null' identifier.`,
          error: {
            code: "INVALID_IDENTIFIER",
            field: "id",
            received: subPath,
          },
        },
        { status: 400 }
      );
    }
    
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
    const reqContentType = req.headers.get("content-type") || "";
    const isProductCreateOrUpdate =
      (subPath === "admin/products" ||
        (subPath.startsWith("admin/products/") && !subPath.includes("/images"))) &&
      (req.method === "POST" || req.method === "PUT");

    if (isProductCreateOrUpdate) {
      if (reqContentType.includes("multipart/form-data")) {
        try {
          const formData = await req.formData();
          const files: File[] = [];
          const jsonPayload: Record<string, any> = {};

          formData.forEach((value, key) => {
            if (value instanceof File && (key === "images" || key === "files" || key === "image")) {
              if (value.size > 0) files.push(value);
            } else if (typeof value === "string") {
              if (key === "isActive") {
                jsonPayload.isActive = value === "true" || value === "1";
              } else if (key === "isFeatured") {
                jsonPayload.isFeatured = value === "true" || value === "1";
              } else if (key === "variants") {
                try {
                  jsonPayload.variants = JSON.parse(value);
                } catch {
                  jsonPayload.variants = value;
                }
              } else if (
                key === "regularPrice" ||
                key === "salePrice" ||
                key === "costPrice" ||
                key === "offerPrice" ||
                key === "stockQuantity" ||
                key === "price" ||
                key === "stock" ||
                key === "compareAtPrice"
              ) {
                jsonPayload[key] = Number(value);
              } else if (key === "tags" || key === "images") {
                try {
                  jsonPayload[key] = JSON.parse(value);
                } catch {
                  jsonPayload[key] = value;
                }
              } else {
                jsonPayload[key] = value;
              }
            }
          });

          if (jsonPayload.isActive === undefined) jsonPayload.isActive = true;
          if (jsonPayload.isFeatured === undefined) jsonPayload.isFeatured = false;
          if (!Array.isArray(jsonPayload.variants)) {
            if (typeof jsonPayload.variants === "string") {
              try {
                jsonPayload.variants = JSON.parse(jsonPayload.variants);
              } catch {
                jsonPayload.variants = [];
              }
            } else {
              jsonPayload.variants = [];
            }
          }

          if (Array.isArray(jsonPayload.variants)) {
            jsonPayload.variants = jsonPayload.variants.map((v: any) => {
              if (typeof v === "object" && v !== null) {
                const clean = { ...v };
                if (typeof clean.isActive === "string") clean.isActive = clean.isActive === "true" || clean.isActive === "1";
                if (typeof clean.isFeatured === "string") clean.isFeatured = clean.isFeatured === "true" || clean.isFeatured === "1";
                if (typeof clean.stockQuantity === "string") clean.stockQuantity = Number(clean.stockQuantity);
                if (typeof clean.stock === "string") clean.stock = Number(clean.stock);
                if (typeof clean.regularPrice === "string") clean.regularPrice = Number(clean.regularPrice);
                if (typeof clean.salePrice === "string") clean.salePrice = Number(clean.salePrice);
                if (typeof clean.price === "string") clean.price = Number(clean.price);
                return clean;
              }
              return v;
            });
          }

          if (files.length > 0) {
            // Send clean JSON first to create product with native types
            const createHeaders = new Headers(forwardHeaders);
            createHeaders.set("content-type", "application/json");

            const createRes = await fetch(targetUrl, {
              method: req.method,
              headers: createHeaders,
              body: JSON.stringify(jsonPayload),
              redirect: "manual",
            });

            const createData = await createRes.json().catch(() => null);
            if (!createRes.ok || !createData || !createData.success) {
              return NextResponse.json(
                createData || { success: false, message: "Failed to process product" },
                { status: createRes.status || 400 }
              );
            }

            const createdProductId =
              createData.data?.product?.id ||
              createData.data?.id ||
              createData.product?.id ||
              createData.id;
            if (createdProductId && createdProductId !== "undefined" && createdProductId !== "null") {
              try {
                const imgFormData = new FormData();
                files.forEach((f) => imgFormData.append("images", f));
                const imgHeaders = new Headers();
                if (forwardHeaders.has("authorization")) {
                  imgHeaders.set("authorization", forwardHeaders.get("authorization")!);
                }
                const imgRes = await fetch(`${TARGET_API_URL}/admin/products/${createdProductId}/images`, {
                  method: "POST",
                  headers: imgHeaders,
                  body: imgFormData,
                });
                const imgJson = await imgRes.json().catch(() => null);
                if (imgJson?.data && createData.data) {
                  createData.data.images = imgJson.data;
                }
              } catch (imgErr) {
                console.warn("[Proxy image upload error]:", imgErr);
              }
            }

            return NextResponse.json(createData, { status: createRes.status });
          } else {
            // Forward cleaned JSON with native booleans and arrays
            forwardHeaders.set("content-type", "application/json");
            body = Buffer.from(JSON.stringify(jsonPayload), "utf-8");
          }
        } catch (e) {
          console.warn("[Proxy multipart parsing error]:", e);
        }
      } else if (reqContentType.includes("application/json")) {
        const rawBuf = await req.arrayBuffer();
        try {
          const text = Buffer.from(rawBuf).toString("utf-8");
          const parsed = JSON.parse(text);
          let modified = false;

          // Coerce boolean isActive
          if (typeof parsed.isActive === "string") {
            parsed.isActive = parsed.isActive === "true" || parsed.isActive === "1";
            modified = true;
          }
          // Coerce boolean isFeatured
          if (typeof parsed.isFeatured === "string") {
            parsed.isFeatured = parsed.isFeatured === "true" || parsed.isFeatured === "1";
            modified = true;
          }
          // Coerce variants array
          if (typeof parsed.variants === "string") {
            try {
              parsed.variants = JSON.parse(parsed.variants);
              modified = true;
            } catch {}
          }
          if (Array.isArray(parsed.variants)) {
            parsed.variants = parsed.variants.map((v: any) => {
              if (typeof v === "object" && v !== null) {
                const clean = { ...v };
                if (typeof clean.isActive === "string") {
                  clean.isActive = clean.isActive === "true" || clean.isActive === "1";
                  modified = true;
                }
                if (typeof clean.isFeatured === "string") {
                  clean.isFeatured = clean.isFeatured === "true" || clean.isFeatured === "1";
                  modified = true;
                }
                if (typeof clean.stockQuantity === "string") {
                  clean.stockQuantity = Number(clean.stockQuantity);
                  modified = true;
                }
                if (typeof clean.stock === "string") {
                  clean.stock = Number(clean.stock);
                  modified = true;
                }
                if (typeof clean.regularPrice === "string") {
                  clean.regularPrice = Number(clean.regularPrice);
                  modified = true;
                }
                if (typeof clean.salePrice === "string") {
                  clean.salePrice = Number(clean.salePrice);
                  modified = true;
                }
                if (typeof clean.price === "string") {
                  clean.price = Number(clean.price);
                  modified = true;
                }
                return clean;
              }
              return v;
            });
          }

          // Coerce numeric fields
          if (typeof parsed.regularPrice === "string") {
            parsed.regularPrice = Number(parsed.regularPrice);
            modified = true;
          }
          if (typeof parsed.salePrice === "string") {
            parsed.salePrice = Number(parsed.salePrice);
            modified = true;
          }
          if (typeof parsed.costPrice === "string") {
            parsed.costPrice = Number(parsed.costPrice);
            modified = true;
          }
          if (typeof parsed.offerPrice === "string") {
            parsed.offerPrice = Number(parsed.offerPrice);
            modified = true;
          }
          if (typeof parsed.stockQuantity === "string") {
            parsed.stockQuantity = Number(parsed.stockQuantity);
            modified = true;
          }

          if (typeof parsed.images === "string") {
            try {
              parsed.images = JSON.parse(parsed.images);
              modified = true;
            } catch {}
          }
          if (typeof parsed.tags === "string") {
            try {
              parsed.tags = JSON.parse(parsed.tags);
              modified = true;
            } catch {}
          }

          body = modified ? Buffer.from(JSON.stringify(parsed), "utf-8") : rawBuf;
        } catch {
          body = rawBuf;
        }
      }
    }

    if (!body && req.method !== "GET" && req.method !== "HEAD") {
      body = await req.arrayBuffer();
    }

    const response = await fetch(targetUrl, {
      method: req.method,
      headers: forwardHeaders,
      body,
      redirect: "manual",
      cache: "no-store",
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

    // Enforce no-cache policy on proxy responses so state updates reflect immediately
    responseHeaders.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
    responseHeaders.set("Pragma", "no-cache");
    responseHeaders.set("Expires", "0");

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
