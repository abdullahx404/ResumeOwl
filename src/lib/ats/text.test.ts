import { describe, expect, it } from "vitest";
import { extractKeywords, hasTerm, normalizeText, tokenize } from "./text";

describe("ATS text helpers", () => {
  it("normalizes text without executing or preserving script markup", () => {
    const normalized = normalizeText("<script>alert('xss')</script> React.js");

    expect(normalized).toContain("script");
    expect(normalized).not.toContain("<script>");
  });

  it("tokenizes meaningful terms", () => {
    expect(tokenize("We need React, TypeScript, and SQL experience.")).toEqual(
      expect.arrayContaining(["react", "typescript", "sql"]),
    );
  });

  it("extracts deterministic keywords from job text", () => {
    const keywords = extractKeywords(
      "React React TypeScript SQL APIs. Build React dashboards with SQL reporting.",
      10,
    );

    expect(keywords[0]).toBe("react");
    expect(keywords).toContain("typescript");
    expect(keywords).toContain("api");
  });

  it("matches normalized terms", () => {
    expect(hasTerm("Built dashboards with Next.js", "next.js")).toBe(true);
  });
});
