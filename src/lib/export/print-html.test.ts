import { describe, expect, it } from "vitest";
import { sampleResume } from "@/lib/resume/sample";
import { createPrintableResumeHtml } from "./print-html";

describe("createPrintableResumeHtml", () => {
  it("creates text-first printable HTML without rasterizing the resume", () => {
    const html = createPrintableResumeHtml(sampleResume);

    expect(html).toContain("<a ");
    expect(html).toContain("ResumeOwl Prototype");
    expect(html).toContain("text-decoration: none");
    expect(html).toContain("margin-left: 6px");
    expect(html).not.toMatch(/<canvas|<img|toDataURL|html2canvas/i);
  });
});
