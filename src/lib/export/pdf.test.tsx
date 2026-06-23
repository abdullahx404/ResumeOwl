import { describe, expect, it } from "vitest";
import { sampleResume } from "@/lib/resume/sample";
import { createPdfBlob } from "./pdf";

describe("createPdfBlob", () => {
  it("creates a non-empty application/pdf blob", async () => {
    const blob = await createPdfBlob(sampleResume);

    expect(blob.type).toBe("application/pdf");
    expect(blob.size).toBeGreaterThan(1000);
  });
});
