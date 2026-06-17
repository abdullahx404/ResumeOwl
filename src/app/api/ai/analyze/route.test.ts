import { describe, expect, it } from "vitest";
import { POST } from "./route";

describe("POST /api/ai/analyze", () => {
  it("returns unavailable when no AI provider is configured", async () => {
    const response = await POST(
      new Request("http://localhost/api/ai/analyze", {
        method: "POST",
        body: JSON.stringify({
          resumeText: "Ali\nSkills\nReact",
          jobDescription: "Need React",
          requiredSkills: ["React"],
        }),
      }),
    );
    const data = (await response.json()) as { configured?: boolean };

    expect(response.status).toBe(503);
    expect(data.configured).toBe(false);
  });

  it("rejects invalid input", async () => {
    const response = await POST(
      new Request("http://localhost/api/ai/analyze", {
        method: "POST",
        body: JSON.stringify({ resumeText: "", jobDescription: "" }),
      }),
    );

    expect(response.status).toBe(400);
  });
});
