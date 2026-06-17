import { describe, expect, it } from "vitest";
import { MAX_UPLOAD_FILES, MAX_UPLOAD_SIZE_BYTES } from "@/lib/uploads/limits";
import { getFileExtension, uploadHelpText, validateResumeFiles } from "./file-validation";

const baseFile = {
  name: "resume.pdf",
  size: 1024,
  type: "application/pdf",
};

describe("file validation", () => {
  it("detects file extensions case-insensitively", () => {
    expect(getFileExtension("Resume.PDF")).toBe(".pdf");
  });

  it("accepts PDF, DOCX, and TXT files", () => {
    const result = validateResumeFiles([
      baseFile,
      {
        name: "resume.docx",
        size: 1024,
        type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      },
      { name: "resume.txt", size: 1024, type: "text/plain" },
    ]);

    expect(result.valid).toBe(true);
  });

  it("rejects unsupported file types", () => {
    const result = validateResumeFiles([
      { name: "resume.exe", size: 1024, type: "application/octet-stream" },
    ]);

    expect(result.valid).toBe(false);
    expect(result.message).toContain("PDF, DOCX, or TXT");
  });

  it("rejects files over 10 MB", () => {
    const result = validateResumeFiles([
      { ...baseFile, size: MAX_UPLOAD_SIZE_BYTES + 1 },
    ]);

    expect(result.valid).toBe(false);
    expect(result.message).toContain("10 MB");
  });

  it("rejects more than 3 files", () => {
    const result = validateResumeFiles(
      Array.from({ length: MAX_UPLOAD_FILES + 1 }, (_, index) => ({
        ...baseFile,
        name: `resume-${index}.pdf`,
      })),
    );

    expect(result.valid).toBe(false);
    expect(result.message).toContain("3 files");
  });

  it("exposes upload help text for UI hints", () => {
    expect(uploadHelpText()).toContain("10 MB");
    expect(uploadHelpText()).toContain("3 files");
  });
});
