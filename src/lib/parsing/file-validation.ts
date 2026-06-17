import {
  MAX_UPLOAD_FILES,
  MAX_UPLOAD_SIZE_LABEL,
  validateUploadLimits,
} from "@/lib/uploads/limits";

export const ACCEPTED_RESUME_EXTENSIONS = [".pdf", ".docx", ".txt"] as const;
export const ACCEPTED_RESUME_MIME_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
  "",
] as const;

export type FileValidationResult = {
  valid: boolean;
  message?: string;
};

export function getFileExtension(fileName: string): string {
  const index = fileName.lastIndexOf(".");

  return index === -1 ? "" : fileName.slice(index).toLowerCase();
}

export function validateResumeFiles(files: Pick<File, "name" | "size" | "type">[]): FileValidationResult {
  const uploadLimitResult = validateUploadLimits(files);

  if (!uploadLimitResult.valid) {
    return uploadLimitResult;
  }

  const unsupported = files.find((file) => {
    const extension = getFileExtension(file.name);
    return (
      !ACCEPTED_RESUME_EXTENSIONS.includes(
        extension as (typeof ACCEPTED_RESUME_EXTENSIONS)[number],
      ) ||
      !ACCEPTED_RESUME_MIME_TYPES.includes(
        file.type as (typeof ACCEPTED_RESUME_MIME_TYPES)[number],
      )
    );
  });

  if (unsupported) {
    return {
      valid: false,
      message: "Upload PDF, DOCX, or TXT resumes only.",
    };
  }

  return { valid: true };
}

export function uploadHelpText(): string {
  return `PDF, DOCX, or TXT. Max ${MAX_UPLOAD_SIZE_LABEL} each, ${MAX_UPLOAD_FILES} files at a time.`;
}
