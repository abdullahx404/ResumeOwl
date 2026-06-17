import { describe, expect, it } from "vitest";
import nextConfig from "./next.config.mjs";
import { securityHeaders } from "./security-headers.mjs";

describe("security headers", () => {
  it("sets baseline hardening headers", () => {
    expect(securityHeaders).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ key: "Content-Security-Policy" }),
        { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        { key: "X-Content-Type-Options", value: "nosniff" },
        { key: "X-Frame-Options", value: "DENY" },
      ]),
    );
  });

  it("applies headers to all routes", async () => {
    const headers = await nextConfig.headers();

    expect(headers).toEqual([
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ]);
  });
});
