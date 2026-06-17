import { describe, expect, it } from "vitest";
import { bulletGenerationRequestSchema } from "./maker";

describe("maker validation", () => {
  it("accepts valid bullet generation input", () => {
    expect(
      bulletGenerationRequestSchema.safeParse({
        name: "ResumeOwl",
        notes: "built preview",
        techStack: ["Next.js"],
        count: 3,
        sectionType: "project",
      }).success,
    ).toBe(true);
  });

  it("rejects unsupported bullet count", () => {
    expect(
      bulletGenerationRequestSchema.safeParse({
        name: "ResumeOwl",
        notes: "built preview",
        techStack: [],
        count: 7,
        sectionType: "project",
      }).success,
    ).toBe(false);
  });
});
