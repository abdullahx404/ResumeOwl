import { afterEach, describe, expect, it, vi } from "vitest";
import { POST } from "./route";

describe("POST /api/ai/generate-bullets", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("falls back to local bullets when AI is not configured", async () => {
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
      error?: string;
      bullets?: string[];
    };

    expect(response.status).toBe(200);
    expect(data.configured).toBe(false);
    expect(data.error).toBeTruthy();
    expect(data.bullets?.length).toBe(3);
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

  it("falls back to local bullets when the configured provider fails", async () => {
    vi.stubEnv("AI_PROVIDER", "gemini");
    vi.stubEnv("GEMINI_API_KEY", "test-key");
    vi.stubEnv("AI_MODEL", "gemini-2.5-flash-lite");
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response("Service unavailable", { status: 503 })),
    );

    const response = await POST(
      new Request("http://localhost/api/ai/generate-bullets", {
        method: "POST",
        body: JSON.stringify({
          name: "Oppassum",
          notes: "Built peer-to-peer sharing for 1000+ users with WebRTC.",
          techStack: ["WebRTC"],
          count: 3,
          sectionType: "project",
        }),
      }),
    );
    const data = (await response.json()) as {
      configured: boolean;
      error?: string;
      bullets?: string[];
    };

    expect(response.status).toBe(200);
    expect(data.configured).toBe(false);
    expect(data.error).toContain("(503)");
    expect(data.bullets).toHaveLength(3);
  });
});
