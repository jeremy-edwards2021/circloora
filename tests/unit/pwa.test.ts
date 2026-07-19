import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

import manifest from "@/app/manifest";

describe("PWA foundation", () => {
  it("publishes an installable standalone manifest with regular and maskable icons", () => {
    const value = manifest();
    expect(value.start_url).toBe("/");
    expect(value.scope).toBe("/");
    expect(value.display).toBe("standalone");
    expect(value.icons).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ sizes: "192x192", purpose: "any" }),
        expect.objectContaining({ sizes: "512x512", purpose: "maskable" }),
      ]),
    );
  });

  it("keeps the service-worker cache limited to a static offline shell", () => {
    const source = readFileSync(resolve(process.cwd(), "public/sw.js"), "utf8");
    expect(source).toContain('const OFFLINE_URL = "/offline"');
    expect(source).toContain('url.pathname.startsWith("/api/")');
    expect(source).not.toMatch(
      /(?:evidence|lens|investigation|catalog).*cache\.put/i,
    );
    expect(source).not.toContain("localStorage");
    expect(source).not.toContain("indexedDB");
  });
});
