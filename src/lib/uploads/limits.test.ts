import { describe, expect, it } from "vitest";
import {
  MAX_UPLOAD_FILES,
  MAX_UPLOAD_SIZE_BYTES,
  validateUploadLimits,
} from "./limits";

describe("validateUploadLimits", () => {
  it("accepts up to three files that are 10 MB or smaller", () => {
    const result = validateUploadLimits([
      { name: "resume.pdf", size: MAX_UPLOAD_SIZE_BYTES },
      { name: "cover.docx", size: 1024 },
      { name: "notes.txt", size: 2048 },
    ]);

    expect(result.valid).toBe(true);
  });

  it("rejects more than three files", () => {
    const result = validateUploadLimits(
      Array.from({ length: MAX_UPLOAD_FILES + 1 }, (_, index) => ({
        name: `file-${index}.txt`,
        size: 1024,
      })),
    );

    expect(result.valid).toBe(false);
    expect(result.message).toContain("3 files");
  });

  it("rejects files larger than 10 MB", () => {
    const result = validateUploadLimits([
      { name: "large-resume.pdf", size: MAX_UPLOAD_SIZE_BYTES + 1 },
    ]);

    expect(result.valid).toBe(false);
    expect(result.message).toContain("10 MB");
  });
});
