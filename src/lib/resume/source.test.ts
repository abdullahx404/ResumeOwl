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

  it("includes project link labels as LaTeX links", () => {
    const source = createLatexStyleSource(sampleResume);

    expect(source).toContain("\\href{https://github.com/example/resumeowl}{GitHub}");
  });

  it("normalizes bare project links and converts bold markers", () => {
    const source = createLatexStyleSource({
      ...sampleResume,
      projects: [
        {
          ...sampleResume.projects[0],
          link: "www.resume.owl",
          bullets: ["Built for **1000+ users**."],
        },
      ],
    });

    expect(source).toContain("\\href{https://www.resume.owl}{GitHub}");
    expect(source).toContain("\\textbf{1000+ users}");
  });

  it("keeps relevant courses when no education entry is filled", () => {
    const source = createLatexStyleSource({
      ...sampleResume,
      education: [],
      courses: ["Algorithms"],
      sectionOrder: ["education"],
    });

    expect(source).toContain("\\section*{Education}");
    expect(source).toContain("Relevant Courses");
    expect(source).toContain("Algorithms");
  });
});
