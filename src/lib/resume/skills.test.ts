import { describe, expect, it } from "vitest";
import { normalizeSkillList } from "./skills";

describe("normalizeSkillList", () => {
  it("keeps base CSS only when no CSS variant is present", () => {
    expect(normalizeSkillList(["CSS", "React"])).toEqual(["CSS", "React"]);
  });

  it("removes base CSS when a specific CSS variant is present", () => {
    expect(normalizeSkillList(["CSS", "Tailwind CSS", "React"])).toEqual([
      "Tailwind CSS",
      "React",
    ]);
  });

  it("deduplicates skills case-insensitively", () => {
    expect(normalizeSkillList(["React", "react", "TypeScript"])).toEqual([
      "React",
      "TypeScript",
    ]);
  });
});
