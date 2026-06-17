import { describe, expect, it } from "vitest";
import { generateLocalBullets, inferProjectName, inferTechStack, parseCommaList, textToBullets } from "./bullets";

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

  it("keeps bullet counts between 2 and 6", () => {
    expect(
      generateLocalBullets({
        name: "App",
        notes: "built app",
        techStack: [],
        count: 10,
        sectionType: "project",
      }),
    ).toHaveLength(6);
  });

  it("does not duplicate leading action verbs in fallback bullets", () => {
    const bullets = generateLocalBullets({
      name: "Oppassum",
      notes: "Developed a browser-based file sharing platform used by 1000+ users",
      techStack: ["Next.js"],
      count: 2,
      sectionType: "project",
    });

    expect(bullets[0]).toContain("Built a browser-based file sharing platform");
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

  it("converts plain text into editable bullets", () => {
    expect(textToBullets("Won hackathon\nLed coding club", 3)).toEqual([
      "Won hackathon.",
      "Led coding club.",
    ]);
  });
});
