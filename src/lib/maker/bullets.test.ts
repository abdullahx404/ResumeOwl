import { describe, expect, it } from "vitest";
import { extractPlainSummary, generateLocalBullets, inferProjectName, inferTechStack, normalizeExternalUrl, notesToBullets, parseCommaList, polishSummaryLocally, textToBullets } from "./bullets";

describe("maker bullets", () => {
  it("generates the requested number of truthful local bullets", () => {
    const bullets = generateLocalBullets({
      name: "Portfolio",
      notes: "built authentication screens; added responsive dashboard",
      techStack: ["React", "TypeScript"],
      count: 4,
      sectionType: "project",
    });

    expect(bullets).toHaveLength(4);
    expect(bullets[0]).toContain("React, TypeScript");
  });

  it("keeps project bullet counts between 4 and 5", () => {
    expect(
      generateLocalBullets({
        name: "App",
        notes: "built app",
        techStack: [],
        count: 10,
        sectionType: "project",
      }),
    ).toHaveLength(5);
  });

  it("does not duplicate leading action verbs in fallback bullets", () => {
    const bullets = generateLocalBullets({
      name: "Oppassum",
      notes: "Developed a browser-based file sharing platform used by 1000+ users",
      techStack: ["Next.js"],
      count: 2,
      sectionType: "project",
    });

    expect(bullets[0]).toContain("Developed Oppassum");
    expect(bullets[0]).toContain("a browser-based file sharing platform");
    expect(bullets[0]).toContain("**1000+** users");
    expect(bullets[0]).not.toContain("Built developed");
  });

  it("parses comma lists", () => {
    expect(parseCommaList("React, TypeScript\nSQL")).toEqual(["React", "TypeScript", "SQL"]);
  });

  it("infers project name and tech stack from details", () => {
    const details = "ResumeOwl: Built a resume analyzer with Next.js, React, TypeScript, and PostgreSQL notes.";

    expect(inferProjectName(details)).toBe("ResumeOwl");
    expect(inferTechStack(details)).toEqual(
      expect.arrayContaining(["Next.js", "React", "TypeScript", "PostgreSQL"]),
    );
  });

  it("does not infer short tech names from ordinary words", () => {
    expect(inferTechStack("Created clean dashboards for reporting")).not.toEqual(
      expect.arrayContaining(["C", "R", "Go"]),
    );
  });

  it("converts plain text into editable bullets", () => {
    expect(textToBullets("Won hackathon\nLed coding club", 3)).toEqual([
      "Won hackathon.",
      "Led coding club.",
    ]);
  });

  it("keeps original project note lines as bullets before generation", () => {
    expect(notesToBullets("Built app\n- Added auth\n\nImproved dashboard")).toEqual([
      "Built app",
      "Added auth",
      "Improved dashboard",
    ]);
  });

  it("normalizes bare external links", () => {
    expect(normalizeExternalUrl("www.resume.owl")).toBe("https://www.resume.owl");
    expect(normalizeExternalUrl("https://resumeowl.vercel.app")).toBe("https://resumeowl.vercel.app");
  });

  it("polishes summaries locally without flashy wording", () => {
    expect(polishSummaryLocally(" passionate software engineering student. ")).not.toMatch(/passionate/i);
  });

  it("unwraps AI summary JSON into plain summary text", () => {
    expect(extractPlainSummary('{"summary":"Software engineering student focused on full-stack projects."}')).toBe(
      "Software engineering student focused on full-stack projects.",
    );
  });
});
