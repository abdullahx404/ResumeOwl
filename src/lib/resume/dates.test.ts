import { describe, expect, it } from "vitest";
import { formatResumeDate, formatResumeDateRange } from "./dates";

describe("resume date formatting", () => {
  it("formats month inputs for resume display", () => {
    expect(formatResumeDate("2023-09")).toBe("Sept 2023");
    expect(formatResumeDate("2027-06")).toBe("June 2027");
  });

  it("formats date ranges and keeps existing free text", () => {
    expect(formatResumeDateRange("2023-09", "2027-06")).toBe("Sept 2023 - June 2027");
    expect(formatResumeDateRange("Jun 2025", "Aug 2025")).toBe("Jun 2025 - Aug 2025");
  });
});
