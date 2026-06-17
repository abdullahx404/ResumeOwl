import { describe, expect, it } from "vitest";
import { sampleResume } from "@/lib/resume/sample";
import { buildDocxDocument, createDocxBlob } from "./docx";

describe("DOCX export", () => {
  it("builds a document object", () => {
    const document = buildDocxDocument(sampleResume);

    expect(document).toBeDefined();
  });

  it("creates a DOCX blob", async () => {
    const blob = await createDocxBlob(sampleResume);

    expect(blob.size).toBeGreaterThan(0);
    expect(blob.type).toBe(
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    );
  });
});
