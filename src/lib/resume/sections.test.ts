import { describe, expect, it } from "vitest";
import { sampleResume } from "./sample";
import { addSection, moveSection, removeSection } from "./sections";

describe("section helpers", () => {
  it("moves a section up", () => {
    const result = moveSection(sampleResume, "projects", "up");

    expect(result.sectionOrder).toEqual([
      "education",
      "projects",
      "skills",
      "experience",
      "optional",
    ]);
  });

  it("does not move the first section up", () => {
    const result = moveSection(sampleResume, "education", "up");

    expect(result.sectionOrder).toEqual(sampleResume.sectionOrder);
  });

  it("removes and re-adds a section", () => {
    const removed = removeSection(sampleResume, "optional");
    const added = addSection(removed, "optional");

    expect(removed.sectionOrder).not.toContain("optional");
    expect(added.sectionOrder.at(-1)).toBe("optional");
  });
});
