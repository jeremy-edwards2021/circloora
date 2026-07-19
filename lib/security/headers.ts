export interface SecurityHeaderOptions {
  connectOrigins?: readonly string[];
  enableHsts?: boolean;
  enableHstsPreload?: boolean;
  isPreview?: boolean;
  isProduction: boolean;
  nonce: string;
  privateRoute?: boolean;
}

function validNonce(nonce: string) {
  if (!/^[A-Za-z0-9+/=_-]{16,128}$/.test(nonce)) {
    throw new Error("CSP nonce must be a nonempty, URL-safe random value.");
  }
  return nonce;
}

function normalizeConnectOrigins(origins: readonly string[]) {
  return [...new Set(origins)].filter((candidate) => {
    try {
      const parsed = new URL(candidate);
      return (
        (parsed.protocol === "https:" || parsed.protocol === "wss:") &&
        parsed.origin === candidate
      );
    } catch {
      return false;
    }
  });
}

export function buildContentSecurityPolicy({
  connectOrigins = [],
  isProduction,
  nonce,
}: Pick<SecurityHeaderOptions, "connectOrigins" | "isProduction" | "nonce">) {
  const safeNonce = validNonce(nonce);
  const connectSource = [
    "'self'",
    ...normalizeConnectOrigins(connectOrigins),
  ].join(" ");
  const scriptSource = isProduction
    ? `'self' 'nonce-${safeNonce}' 'strict-dynamic'`
    : `'self' 'nonce-${safeNonce}' 'strict-dynamic' 'unsafe-eval'`;
  const styleSource = isProduction
    ? `'self' 'nonce-${safeNonce}'`
    : `'self' 'nonce-${safeNonce}' 'unsafe-inline'`;

  const directives = [
    "default-src 'self'",
    "base-uri 'none'",
    "object-src 'none'",
    "frame-ancestors 'none'",
    "form-action 'self'",
    `script-src ${scriptSource}`,
    "script-src-attr 'none'",
    `style-src ${styleSource}`,
    "img-src 'self' data: blob:",
    "font-src 'self'",
    "media-src 'self' blob:",
    "worker-src 'self' blob:",
    "manifest-src 'self'",
    `connect-src ${connectSource}`,
    "frame-src 'none'",
  ];

  if (isProduction) directives.push("upgrade-insecure-requests");
  return directives.join("; ");
}

export function buildSecurityHeaders(options: SecurityHeaderOptions) {
  const headers: Record<string, string> = {
    "Content-Security-Policy": buildContentSecurityPolicy(options),
    "Cross-Origin-Opener-Policy": "same-origin",
    "Cross-Origin-Resource-Policy": "same-origin",
    "Origin-Agent-Cluster": "?1",
    "Permissions-Policy":
      "camera=(self), microphone=(self), geolocation=(), payment=(), usb=(), serial=(), bluetooth=(), hid=(), accelerometer=(), gyroscope=(), magnetometer=(), interest-cohort=()",
    "Referrer-Policy": "no-referrer",
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "X-Permitted-Cross-Domain-Policies": "none",
  };

  if (options.enableHsts && options.isProduction) {
    headers["Strict-Transport-Security"] =
      `max-age=63072000; includeSubDomains${
        options.enableHstsPreload ? "; preload" : ""
      }`;
  }

  if (options.isPreview || options.privateRoute) {
    headers["X-Robots-Tag"] = "noindex, nofollow, noarchive";
  }

  return headers;
}

export function isPrivateAppPath(pathname: string) {
  return [
    "/catalog",
    "/thing/",
    "/missions",
    "/mission/",
    "/plan/",
    "/verify/",
    "/credits",
    "/history",
    "/impact",
    "/profile",
  ].some((prefix) => pathname === prefix || pathname.startsWith(prefix));
}

export function enabledBrowserConnectOrigins(
  environment: Readonly<Record<string, string | undefined>>,
) {
  const candidates: string[] = [];
  if (
    environment.ENABLE_CLOUD === "true" &&
    environment.NEXT_PUBLIC_SUPABASE_URL
  ) {
    try {
      const supabase = new URL(environment.NEXT_PUBLIC_SUPABASE_URL);
      candidates.push(supabase.origin);
      const realtime = new URL(supabase.origin);
      realtime.protocol = "wss:";
      candidates.push(realtime.origin);
    } catch {
      // Invalid optional configuration is ignored here and rejected by the capability adapter.
    }
  }
  return normalizeConnectOrigins(candidates);
}
