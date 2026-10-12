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
    
    // Sanitize query params: backend Prisma findMany fails with 500 when limit is forwarded as a string on admin routes
    const searchParams = new URLSearchParams(req.nextUrl.searchParams);
    if (subPath.startsWith("admin/")) {
      searchParams.delete("limit");
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

    const responseData = await response.arrayBuffer();

    return new NextResponse(responseData, {
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
