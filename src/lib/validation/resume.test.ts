import { describe, expect, it } from "vitest";
import { sampleResume } from "@/lib/resume/sample";
import { resumeDocumentSchema } from "./resume";

describe("resumeDocumentSchema", () => {
  it("accepts a complete resume document", () => {
    const result = resumeDocumentSchema.safeParse(sampleResume);

    expect(result.success).toBe(true);
  });

  it("requires a full name", () => {
    const result = resumeDocumentSchema.safeParse({
      ...sampleResume,
      personal: {
        ...sampleResume.personal,
        fullName: "",
      },
    });

    expect(result.success).toBe(false);
  });

  it("rejects invalid portfolio URLs", () => {
    const result = resumeDocumentSchema.safeParse({
      ...sampleResume,
      personal: {
        ...sampleResume.personal,
        portfolio: "not-a-url",
      },
    });

    expect(result.success).toBe(false);
  });
});
