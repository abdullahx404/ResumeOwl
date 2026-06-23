import { describe, expect, it } from "vitest";
import { importResumeText } from "./importer";

describe("importResumeText", () => {
  it("imports pasted resume text into ResumeOwl sections", () => {
    const resume = importResumeText(`
Abdullah Zia
Software Engineer
abdullah@example.com | 03139686967 | https://github.com/abdullahx404

Summary
Software engineer focused on full-stack systems.

Education
GIKI
Software Engineering, CGPA 3.53

Skills
Frontend: React, Next.js, TypeScript
Backend: Node.js, PostgreSQL

Projects
Oppassum
- Built a peer-to-peer file sharing platform.
- Implemented WebRTC transfer flows.

Experience
Intern, Example Studio
- Built reusable dashboard components.

Achievements
- Won university hackathon.
`);

    expect(resume.personal.fullName).toBe("Abdullah Zia");
    expect(resume.personal.title).toBe("Software Engineer");
    expect(resume.summary).toContain("full-stack systems");
    expect(resume.education).toHaveLength(1);
    expect(resume.skillGroups).toHaveLength(2);
    expect(resume.projects[0].bullets).toHaveLength(2);
    expect(resume.experience[0].role).toBe("Intern");
    expect(resume.optionalSections[0].title).toBe("Achievements");
    expect(resume.sectionOrder).toEqual(["education", "skills", "projects", "experience", "optional"]);
  });
});
