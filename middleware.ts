import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import {
  buildContentSecurityPolicy,
  isPrivateAppPath,
  enabledBrowserConnectOrigins,
} from "@/lib/security/headers";

const MUTATE_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

export function middleware(request: NextRequest): NextResponse {
  const { pathname } = request.nextUrl;
  const nonce = generateNonce();
  const isProduction = process.env.NODE_ENV === "production";

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

  const connectOrigins = enabledBrowserConnectOrigins(process.env);
  const csp = buildContentSecurityPolicy({
    connectOrigins,
    isProduction,
    nonce,
  });

  const response = NextResponse.next();

  response.headers.set("Content-Security-Policy", csp);
  response.headers.set(
    "Strict-Transport-Security",
    "max-age=63072000; includeSubDomains",
  );
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set(
    "Referrer-Policy",
    "no-referrer",
  );
  response.headers.set(
    "Permissions-Policy",
    "camera=(self), microphone=(self), geolocation=(), payment=(), usb=(), serial=(), bluetooth=(), hid=(), accelerometer=(), gyroscope=(), magnetometer=(), interest-cohort=()",
  );
  response.headers.set("Cross-Origin-Opener-Policy", "same-origin");
  response.headers.set("Cross-Origin-Resource-Policy", "same-origin");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Permitted-Cross-Domain-Policies", "none");

  if (isProduction || isPrivateAppPath(pathname)) {
    response.headers.set("X-Robots-Tag", "noindex, nofollow, noarchive");
  }

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  return response;
}

function generateNonce(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes)
    .map((b) => b.toString(36).padStart(2, "0"))
    .join("");
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|manifest.json|sw.js|icons/).*)",
  ],
};
