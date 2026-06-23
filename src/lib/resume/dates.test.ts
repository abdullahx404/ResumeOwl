import { describe, expect, it } from "vitest";
import { formatResumeDate, formatResumeDateRange, isValidMonthDateRange } from "./dates";

describe("resume date formatting", () => {
  it("formats month inputs for resume display", () => {
    expect(formatResumeDate("2023-09")).toBe("Sept 2023");
    expect(formatResumeDate("2027-06")).toBe("June 2027");
  });

  it("formats date ranges and keeps existing free text", () => {
    expect(formatResumeDateRange("2023-09", "2027-06")).toBe("Sept 2023 - June 2027");
    expect(formatResumeDateRange("Jun 2025", "Aug 2025")).toBe("Jun 2025 - Aug 2025");
  });

  it("validates chronological month ranges", () => {
    expect(isValidMonthDateRange("2026-05", "2027-05")).toBe(true);
    expect(isValidMonthDateRange("2026-05", "2026-05")).toBe(true);
    expect(isValidMonthDateRange("2026-05", "2026-04")).toBe(false);
    expect(isValidMonthDateRange("May 2026", "April 2026")).toBe(true);
  });
});
