export const MAX_UPLOAD_SIZE_BYTES = 10 * 1024 * 1024;
export const MAX_UPLOAD_SIZE_LABEL = "10 MB";
export const MAX_UPLOAD_FILES = 3;

export type UploadLimitResult = {
  valid: boolean;
  message?: string;
};

type UploadLike = {
  size: number;
  name?: string;
};

export function validateUploadLimits(files: UploadLike[]): UploadLimitResult {
  if (files.length > MAX_UPLOAD_FILES) {
    return {
      valid: false,
      message: `Upload up to ${MAX_UPLOAD_FILES} files at a time.`,
    };
  }

  const oversizedFile = files.find((file) => file.size > MAX_UPLOAD_SIZE_BYTES);

  if (oversizedFile) {
    return {
      valid: false,
      message: `${oversizedFile.name ?? "Each file"} must be ${MAX_UPLOAD_SIZE_LABEL} or smaller.`,
    };
  }

  return { valid: true };
}
