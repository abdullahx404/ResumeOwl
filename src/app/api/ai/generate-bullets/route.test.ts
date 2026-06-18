import { describe, expect, it } from "vitest";
import { POST } from "./route";

describe("POST /api/ai/generate-bullets", () => {
  it("returns local bullets when AI is not configured", async () => {
    const response = await POST(
      new Request("http://localhost/api/ai/generate-bullets", {
        method: "POST",
        body: JSON.stringify({
          name: "ResumeOwl",
          notes: "built resume preview",
          techStack: ["Next.js"],
          count: 3,
          sectionType: "project",
        }),
      }),
    );
    const data = (await response.json()) as {
      configured: boolean;
      bullets: string[];
      suggestedName?: string;
      techStack?: string[];
    };

    expect(response.status).toBe(200);
    expect(data.configured).toBe(false);
    expect(data.bullets).toHaveLength(4);
    expect(data.suggestedName).toBeTruthy();
  });

  it("rejects invalid input", async () => {
    const response = await POST(
      new Request("http://localhost/api/ai/generate-bullets", {
        method: "POST",
        body: JSON.stringify({ name: "", count: 9 }),
      }),
    );

    expect(response.status).toBe(400);
  });
});
