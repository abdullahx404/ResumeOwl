import { describe, expect, it } from "vitest";
import { formatAcademicScore, sanitizeAcademicScoreInput } from "./academic-score";

describe("academic score formatting", () => {
  it("formats values at or below 10 as CGPA", () => {
    expect(formatAcademicScore("3.53")).toBe("CGPA 3.53");
    expect(formatAcademicScore("10.00")).toBe("CGPA 10.00");
  });

  it("formats values above 10 as percentage", () => {
    expect(formatAcademicScore("85")).toBe("85%");
    expect(formatAcademicScore("92.5%")).toBe("92.5%");
  });

  it("accepts only numeric values with up to two decimals and optional percent", () => {
    expect(sanitizeAcademicScoreInput("3.535")).toBe("");
    expect(sanitizeAcademicScoreInput("3.53")).toBe("3.53");
    expect(sanitizeAcademicScoreInput("88%")).toBe("88%");
  });
});
