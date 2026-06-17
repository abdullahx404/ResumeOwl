import { describe, expect, it } from "vitest";
import { refactorResumeLocally } from "./local";

const request = {
  resumeText: `
Ali Raza
ali@example.com | +92 300 1234567 | github.com/ali

Skills
React, TypeScript

Projects
- Worked on dashboard screens.
- Built React components for reports.
`,
  jobDescription: "Need React, TypeScript, SQL, AWS, and testing experience.",
  requiredSkills: ["React", "SQL", "AWS"],
};

describe("refactorResumeLocally", () => {
  it("uses only skills supported by the resume", () => {
    const result = refactorResumeLocally(request);

    expect(result.updatedSkills).toEqual(expect.arrayContaining(["react", "typescript"]));
    expect(result.updatedSkills).not.toContain("aws");
    expect(result.updatedSkills).not.toContain("sql");
  });

  it("strengthens existing bullets without inventing metrics", () => {
    const result = refactorResumeLocally(request);

    expect(result.improvedBullets[0].before).toContain("Worked on");
    expect(result.improvedBullets[0].after).toContain("Contributed to");
    expect(result.improvedBullets[0].after).not.toContain("%");
  });

  it("creates a preview resume draft", () => {
    const result = refactorResumeLocally(request);

    expect(result.previewResume?.personal.fullName).toBe("Ali Raza");
    expect(result.previewResume?.projects[0].bullets.length).toBeGreaterThan(0);
  });
});
