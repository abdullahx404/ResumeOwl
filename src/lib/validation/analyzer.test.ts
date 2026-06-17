import { describe, expect, it } from "vitest";
import {
  aiAnalyzerFeedbackSchema,
  analyzerRequestSchema,
} from "./analyzer";

describe("analyzer validation", () => {
  it("accepts valid analyzer input", () => {
    const result = analyzerRequestSchema.safeParse({
      resumeText: "Skills\nReact",
      jobDescription: "Need React",
      requiredSkills: ["React"],
    });

    expect(result.success).toBe(true);
  });

  it("rejects empty analyzer input", () => {
    const result = analyzerRequestSchema.safeParse({
      resumeText: "",
      jobDescription: "",
      requiredSkills: [],
    });

    expect(result.success).toBe(false);
  });

  it("accepts structured AI feedback", () => {
    const result = aiAnalyzerFeedbackSchema.safeParse({
      recruiterFeedback: "Strong foundation, but tailor the bullets.",
      suggestedImprovements: ["Add truthful project impact."],
      rewrittenWeakBullets: [
        {
          before: "Worked on app.",
          after: "Built React app screens from provided requirements.",
          rationale: "Starts with action and clarifies the work.",
        },
      ],
      beforeAfterSummary: "More specific and ATS-readable.",
      cautionNotes: ["Verify impact before adding numbers."],
    });

    expect(result.success).toBe(true);
  });
});
