import { analyzeResumeLocally } from "@/lib/ats/analyzer";
import { extractKeywords, hasTerm, splitLines } from "@/lib/ats/text";
import type { RefactorRequest } from "@/lib/validation/refactor";
import type { RefactorResult, ResumeDocument } from "@/types/resume";

function extractName(lines: string[]): string {
  const candidate = lines.find((line) => line.length > 2 && !line.includes("@"));
  return candidate ?? "Resume Candidate";
}

function extractContact(text: string) {
  return {
    email: text.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)?.[0] ?? "",
    phone: text.match(/(?:\+?\d[\d\s().-]{7,}\d)/)?.[0] ?? "",
    github: text.match(/https?:\/\/github\.com\/[^\s]+|github\.com\/[^\s]+/i)?.[0] ?? "",
    linkedin: text.match(/https?:\/\/(?:www\.)?linkedin\.com\/[^\s]+|linkedin\.com\/[^\s]+/i)?.[0] ?? "",
  };
}

function extractBullets(text: string): string[] {
  return splitLines(text)
    .filter((line) => /^[-*•]|^\d+[.)]/.test(line))
    .map((line) => line.replace(/^[-*•]\s*|^\d+[.)]\s*/, "").trim())
    .filter(Boolean);
}

function strengthenBullet(bullet: string): string {
  const cleaned = bullet
    .replace(/\b(responsible for|worked on|helped with)\b/gi, "Contributed to")
    .replace(/\s+/g, " ")
    .trim();

  if (/^(built|created|developed|designed|implemented|improved|optimized|integrated|tested|deployed|contributed)\b/i.test(cleaned)) {
    return cleaned.endsWith(".") ? cleaned : `${cleaned}.`;
  }

  return `Improved ${cleaned.charAt(0).toLowerCase()}${cleaned.slice(1)}${cleaned.endsWith(".") ? "" : "."}`;
}

function buildPreviewResume(request: RefactorRequest, bullets: string[], updatedSkills: string[]): ResumeDocument {
  const lines = splitLines(request.resumeText);
  const contact = extractContact(request.resumeText);

  return {
    personal: {
      fullName: extractName(lines),
      title: "Targeted Resume",
      email: contact.email,
      phone: contact.phone,
      github: contact.github,
      linkedin: contact.linkedin,
      portfolio: "",
      location: "",
    },
    summary:
      "Targeted resume draft generated from the provided resume and job description. Review every line before using.",
    education: [],
    courses: [],
    skillGroups: updatedSkills.length
      ? [{ id: "skills-refactored", name: "Relevant Skills", skills: updatedSkills }]
      : [],
    projects: bullets.length
      ? [
          {
            id: "project-refactored",
            name: "Relevant Work Highlights",
            techStack: updatedSkills.slice(0, 8),
            bullets: bullets.slice(0, 6),
          },
        ]
      : [],
    experience: [],
    optionalSections: [
      {
        id: "refactor-note",
        title: "Review Notes",
        items: ["Verify all generated wording against your actual experience before downloading."],
      },
    ],
    sectionOrder: ["skills", "projects", "experience", "education", "optional"],
  };
}

export function refactorResumeLocally(request: RefactorRequest): RefactorResult {
  const analysis = analyzeResumeLocally(request);
  const jobKeywords = extractKeywords(request.jobDescription, 30);
  const existingSkills = [...jobKeywords, ...request.requiredSkills]
    .filter((skill) => hasTerm(request.resumeText, skill))
    .slice(0, 18);
  const originalBullets = extractBullets(request.resumeText);
  const improvedBullets = originalBullets.slice(0, 8).map((bullet) => ({
    before: bullet,
    after: strengthenBullet(bullet),
  }));
  const selectedBullets = improvedBullets.length
    ? improvedBullets.map((bullet) => bullet.after)
    : [
        "Reviewed existing resume content against the target job description.",
        "Identified truthful skills and keywords already supported by the resume.",
        "Prepared an ATS-friendly draft without adding unsupported claims.",
      ];
  const refactoredResumeText = [
    "REFACTORED RESUME DRAFT",
    "",
    "Relevant Skills",
    existingSkills.length ? existingSkills.join(", ") : "No directly supported job keywords detected yet.",
    "",
    "Improved Highlights",
    ...selectedBullets.map((bullet) => `- ${bullet}`),
    "",
    "ATS Notes",
    ...analysis.atsIssues.map((issue) => `- ${issue.title}: ${issue.detail}`),
  ].join("\n");

  return {
    refactoredResumeText,
    updatedSkills: existingSkills,
    improvedBullets,
    atsNotes: analysis.atsIssues.map((issue) => `${issue.title}: ${issue.detail}`),
    improvementExplanation: [
      "Matched only job keywords already supported by the resume.",
      "Strengthened vague bullets without adding fake metrics or new responsibilities.",
      "Kept output editable so the user can verify every claim before export.",
    ],
    previewResume: buildPreviewResume(request, selectedBullets, existingSkills),
  };
}
