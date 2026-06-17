import { describe, expect, it } from "vitest";
import { sampleResume } from "./sample";
import { createLatexStyleSource } from "./source";

describe("createLatexStyleSource", () => {
  it("includes key resume sections", () => {
    const source = createLatexStyleSource(sampleResume);

    expect(source).toContain("\\section*{Education}");
    expect(source).toContain("\\section*{Skills}");
    expect(source).toContain("\\section*{Projects}");
  });

  it("escapes LaTeX-sensitive characters", () => {
    const source = createLatexStyleSource({
      ...sampleResume,
      personal: {
        ...sampleResume.personal,
        fullName: "A&B_User",
      },
    });

    expect(source).toContain("A\\&B\\_User");
  });
});
