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
    const search = req.nextUrl.search;
    const targetUrl = `${TARGET_API_URL}/${subPath}${search}`;

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

    // Provide whitelisted origin so backend never rejects with CORS error
    forwardHeaders.set("origin", "http://localhost:3000");

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
        lower !== "transfer-encoding"
      ) {
        responseHeaders.set(key, value);
      }
    });

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
