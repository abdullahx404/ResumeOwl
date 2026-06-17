import { describe, expect, it } from "vitest";
import { analyzeResumeLocally } from "./analyzer";

const resumeText = `
Ali Raza
ali@example.com | +92 300 1234567 | github.com/ali

Education
BS Software Engineering

Skills
React, TypeScript, SQL, Node.js

Projects
- Built React dashboard with TypeScript and SQL reporting for 200 users.
- Worked on various things.
`;

const jobDescription = `
We need a frontend engineer with React, TypeScript, SQL, REST API, testing,
dashboard experience, and strong communication.
`;

describe("analyzeResumeLocally", () => {
  it("returns deterministic score and keyword findings", () => {
    const result = analyzeResumeLocally({
      resumeText,
      jobDescription,
      requiredSkills: ["React", "REST API", "Testing"],
    });

    expect(result.score).toBeGreaterThan(0);
    expect(result.matchedKeywords).toEqual(expect.arrayContaining(["react", "typescript", "sql"]));
    expect(result.missingKeywords).toEqual(expect.arrayContaining(["rest api", "testing"]));
  });

  it("detects required skill matches", () => {
    const result = analyzeResumeLocally({
      resumeText,
      jobDescription,
      requiredSkills: ["React", "Testing"],
    });

    expect(result.requiredSkillMatches).toEqual([
      { keyword: "React", present: true },
      { keyword: "Testing", present: false },
    ]);
  });

  it("detects contact info and sections", () => {
    const result = analyzeResumeLocally({ resumeText, jobDescription });

    expect(result.contactInfo.email).toBe(true);
    expect(result.contactInfo.phone).toBe(true);
    expect(result.contactInfo.links).toBe(true);
    expect(result.detectedSections).toEqual(
      expect.arrayContaining(["education", "skills", "projects"]),
    );
  });

  it("flags weak bullets", () => {
    const result = analyzeResumeLocally({ resumeText, jobDescription });

    expect(result.weakBullets.some((bullet) => bullet.text.includes("Worked on"))).toBe(true);
  });

  it("handles malicious text as plain text", () => {
    const result = analyzeResumeLocally({
      resumeText: `${resumeText}\n<script>alert("xss")</script>`,
      jobDescription,
    });

    expect(result.atsIssues.length).toBeGreaterThan(0);
  });
});
