export function sanitizeAcademicScoreInput(value: string): string {
  const normalized = value.replace(/\s/g, "").replace(",", ".");

  if (normalized === "") {
    return "";
  }

  const withoutPercent = normalized.endsWith("%") ? normalized.slice(0, -1) : normalized;
  const match = withoutPercent.match(/^\d{0,3}(?:\.\d{0,2})?$/);

  if (!match) {
    return "";
  }

  return normalized;
}

export function formatAcademicScore(value?: string): string {
  const trimmed = value?.trim();

  if (!trimmed) {
    return "";
  }

  const normalized = sanitizeAcademicScoreInput(trimmed);

  if (!normalized) {
    return trimmed;
  }

  const numericValue = Number.parseFloat(normalized.replace("%", ""));

  if (Number.isNaN(numericValue)) {
    return trimmed;
  }

  return numericValue <= 10 ? `CGPA ${normalized.replace("%", "")}` : `${normalized.replace("%", "")}%`;
}
