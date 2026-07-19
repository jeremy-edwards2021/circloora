import { describe, expect, it } from "vitest";

import {
  buildContentSecurityPolicy,
  buildSecurityHeaders,
  enabledBrowserConnectOrigins,
  isPrivateAppPath,
} from "@/lib/security/headers";

const nonce = "0123456789abcdef0123456789abcdef";

describe("security header foundation", () => {
  it("builds a strict nonce production CSP without unsafe directives", () => {
    const policy = buildContentSecurityPolicy({
      connectOrigins: ["https://example.supabase.co", "*", "https:"],
      isProduction: true,
      nonce,
    });
    expect(policy).toContain(
      `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'`,
    );
    expect(policy).toContain(`style-src 'self' 'nonce-${nonce}'`);
    expect(policy).toContain("connect-src 'self' https://example.supabase.co");
    expect(policy).toContain("upgrade-insecure-requests");
    expect(policy).not.toContain("'unsafe-inline'");
    expect(policy).not.toContain("'unsafe-eval'");
    expect(policy).not.toContain("connect-src 'self' *");
  });

  it("applies the locked browser hardening headers and preview noindex", () => {
    const headers = buildSecurityHeaders({
      isPreview: true,
      isProduction: false,
      nonce,
    });
    expect(headers["X-Content-Type-Options"]).toBe("nosniff");
    expect(headers["Referrer-Policy"]).toBe("no-referrer");
    expect(headers["X-Frame-Options"]).toBe("DENY");
    expect(headers["Cross-Origin-Opener-Policy"]).toBe("same-origin");
    expect(headers["X-Robots-Tag"]).toBe("noindex, nofollow, noarchive");
    expect(headers["Strict-Transport-Security"]).toBeUndefined();
  });

  it("enables HSTS only with an explicit production gate", () => {
    expect(
      buildSecurityHeaders({
        enableHsts: true,
        enableHstsPreload: true,
        isProduction: true,
        nonce,
      })["Strict-Transport-Security"],
    ).toBe("max-age=63072000; includeSubDomains; preload");
    expect(
      buildSecurityHeaders({ enableHsts: true, isProduction: false, nonce })[
        "Strict-Transport-Security"
      ],
    ).toBeUndefined();
  });

  it("keeps exact cloud origins feature gated and private product routes noindexable", () => {
    expect(
      enabledBrowserConnectOrigins({
        ENABLE_CLOUD: "false",
        NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
      }),
    ).toEqual([]);
    expect(
      enabledBrowserConnectOrigins({
        ENABLE_CLOUD: "true",
        NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
      }),
    ).toEqual(["https://example.supabase.co", "wss://example.supabase.co"]);
    expect(isPrivateAppPath("/thing/example-id")).toBe(true);
    expect(isPrivateAppPath("/")).toBe(false);
  });
});
