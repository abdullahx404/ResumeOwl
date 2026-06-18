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
    expect(result.matchedKeywords).toEqual(expect.arrayContaining(["React", "TypeScript", "SQL"]));
    expect(result.missingKeywords).toEqual(expect.arrayContaining(["REST APIs", "testing"]));
  });

  it("detects required skill matches", () => {
    const result = analyzeResumeLocally({
      resumeText,
      jobDescription,
      requiredSkills: ["React", "Testing"],
    });

    expect(result.requiredSkillMatches).toEqual(
      expect.arrayContaining([
        { keyword: "React", present: true },
        { keyword: "testing", present: false },
      ]),
    );
    expect(result.requiredSkillMatches).not.toEqual(
      expect.arrayContaining([
        { keyword: "C", present: true },
        { keyword: "R", present: true },
      ]),
    );
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

  it("ignores generic job description words when building missing keywords", () => {
    const result = analyzeResumeLocally({
      resumeText: "Skills\nReact, TypeScript\nProjects\n- Built React app for 100 users.",
      jobDescription:
        "Ideal candidate should build clean digital applications and solve user-friendly problems with React and PostgreSQL.",
    });

    expect(result.missingKeywords).toContain("PostgreSQL");
    expect(result.missingKeywords).not.toEqual(
      expect.arrayContaining(["ideal", "candidate", "build", "applications", "clean", "solve"]),
    );
  });

  it("canonicalizes equivalent skill names for cleaner counts", () => {
    const result = analyzeResumeLocally({
      resumeText: "Skills\nHTML, CSS, REST APIs",
      jobDescription: "Need HTML5, CSS3, REST API, and React.",
    });

    expect(result.requiredSkillMatches).toEqual(
      expect.arrayContaining([
        { keyword: "HTML", present: true },
        { keyword: "CSS", present: true },
        { keyword: "REST APIs", present: true },
        { keyword: "React", present: false },
      ]),
    );
    expect(result.requiredSkillMatches.filter((skill) => skill.keyword === "REST APIs")).toHaveLength(1);
  });

  it("matches backend and GitHub formatting variants", () => {
    const result = analyzeResumeLocally({
      resumeText: "Skills\nBackend, Git/GitHub, Node.js",
      jobDescription: "Need back-end development, git & github, and Node.js.",
    });

    expect(result.requiredSkillMatches).toEqual(
      expect.arrayContaining([
        { keyword: "Backend Development", present: true },
        { keyword: "Git and GitHub", present: true },
        { keyword: "Node.js", present: true },
      ]),
    );
    expect(result.missingKeywords).not.toContain("Backend Development");
  });

  it("shows missing required skills in the missing keyword list", () => {
    const result = analyzeResumeLocally({
      resumeText: "Skills\nReact, Node.js",
      jobDescription: "Need React and Node.js.",
      requiredSkills: ["React", "Express.js", "Angular"],
    });

    expect(result.missingKeywords).toEqual(expect.arrayContaining(["Express.js", "Angular"]));
  });
});
