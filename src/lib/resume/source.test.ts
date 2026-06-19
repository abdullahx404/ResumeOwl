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

  it("uses short contact labels for profile links", () => {
    const source = createLatexStyleSource({
      ...sampleResume,
      personal: {
        ...sampleResume.personal,
        email: "abdullah@example.com",
        github: "abdullahx404",
        linkedin: "abdullahzia-linked",
        portfolio: "abdullah.dev",
      },
    });

    expect(source).toContain("\\href{mailto:abdullah@example.com}{abdullah@example.com}");
    expect(source).toContain("\\href{https://github.com/abdullahx404}{GitHub}");
    expect(source).toContain("\\href{https://linkedin.com/in/abdullahzia-linked}{LinkedIn}");
    expect(source).toContain("\\href{https://abdullah.dev}{Portfolio}");
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
