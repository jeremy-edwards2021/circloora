import { NextResponse, type NextRequest } from "next/server";

import {
  buildSecurityHeaders,
  enabledBrowserConnectOrigins,
  isPrivateAppPath,
} from "@/lib/security/headers";

const MUTATE_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const nonce = crypto.randomUUID().replaceAll("-", "");
  const isPreview = process.env.VERCEL_ENV === "preview";
  const isProduction = process.env.NODE_ENV === "production" && !isPreview;

  if (MUTATE_METHODS.has(request.method) && pathname.startsWith("/api/")) {
    const origin = request.headers.get("origin");
    const host = request.headers.get("host");
    const expectedOrigin = process.env.NEXT_PUBLIC_APP_URL
      ? new URL(process.env.NEXT_PUBLIC_APP_URL).origin
      : `${request.nextUrl.protocol}//${request.nextUrl.host}`;
    if (origin && origin !== expectedOrigin) {
      return new NextResponse(
        JSON.stringify({ ok: false, error: { code: "origin_rejected" } }),
        { status: 400, headers: { "content-type": "application/json" } },
      );
    }
    if (host && host !== request.nextUrl.host) {
      return new NextResponse(
        JSON.stringify({ ok: false, error: { code: "host_rejected" } }),
        { status: 400, headers: { "content-type": "application/json" } },
      );
    }
  }

  const headers = buildSecurityHeaders({
    connectOrigins: enabledBrowserConnectOrigins(process.env),
    enableHsts: process.env.ENABLE_HSTS === "true",
    enableHstsPreload: process.env.ENABLE_HSTS_PRELOAD === "true",
    isPreview,
    isProduction,
    nonce,
    privateRoute: isPrivateAppPath(pathname),
  });

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set(
    "Content-Security-Policy",
    headers["Content-Security-Policy"]!,
  );

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  for (const [name, value] of Object.entries(headers))
    response.headers.set(name, value);

  if (
    request.nextUrl.pathname.startsWith("/api/") ||
    request.headers.get("sec-fetch-dest") === "document"
  ) {
    response.headers.set("Cache-Control", "no-store");
  }

  return response;
}

export const config = {
  matcher: [
    {
      source: "/((?!_next/static|_next/image|icons/|favicon.svg).*)",
      missing: [
        { type: "header", key: "next-router-prefetch" },
        { type: "header", key: "purpose", value: "prefetch" },
      ],
    },
  ],
};
