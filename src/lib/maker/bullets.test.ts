import { describe, expect, it } from "vitest";
import { generateLocalBullets, parseCommaList } from "./bullets";

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

  it("parses comma lists", () => {
    expect(parseCommaList("React, TypeScript\nSQL")).toEqual(["React", "TypeScript", "SQL"]);
  });
});
