import { describe, expect, it } from "vitest";
import { refactorRequestSchema, refactorResultSchema } from "./refactor";

describe("refactor validation", () => {
  it("accepts valid refactor input", () => {
    const result = refactorRequestSchema.safeParse({
      resumeText: "Ali\nSkills\nReact",
      jobDescription: "Need React and TypeScript",
      requiredSkills: ["React"],
    });

    expect(result.success).toBe(true);
  });

  it("rejects empty refactor input", () => {
    const result = refactorRequestSchema.safeParse({
      resumeText: "",
      jobDescription: "",
      requiredSkills: [],
    });

    expect(result.success).toBe(false);
  });

  it("accepts structured refactor results", () => {
    const result = refactorResultSchema.safeParse({
      refactoredResumeText: "Draft",
      updatedSkills: ["React"],
      improvedBullets: [{ before: "Worked on app", after: "Improved app UI." }],
      atsNotes: ["Add phone"],
      improvementExplanation: ["Strengthened vague bullets."],
    });

    expect(result.success).toBe(true);
  });
});
