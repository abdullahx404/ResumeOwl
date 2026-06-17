import { describe, expect, it } from "vitest";
import { POST } from "./route";

describe("POST /api/ai/refactor", () => {
  it("returns local refactor when AI is not configured", async () => {
    const response = await POST(
      new Request("http://localhost/api/ai/refactor", {
        method: "POST",
        body: JSON.stringify({
          resumeText: "Ali\nSkills\nReact\n- Worked on dashboard.",
          jobDescription: "Need React and TypeScript",
          requiredSkills: ["React"],
        }),
      }),
    );
    const data = (await response.json()) as {
      configured: boolean;
      result: { refactoredResumeText: string };
    };

    expect(response.status).toBe(200);
    expect(data.configured).toBe(false);
    expect(data.result.refactoredResumeText).toContain("REFACTORED RESUME DRAFT");
  });

  it("rejects invalid input", async () => {
    const response = await POST(
      new Request("http://localhost/api/ai/refactor", {
        method: "POST",
        body: JSON.stringify({ resumeText: "", jobDescription: "" }),
      }),
    );

    expect(response.status).toBe(400);
  });
});
