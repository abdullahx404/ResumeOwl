import type { AnalysisResult, AtsIssue, KeywordMatch, WeakBullet } from "@/types/resume";
import { extractKeywords, hasTerm, normalizeText, splitLines } from "./text";

const sectionPatterns: Record<string, RegExp> = {
  education: /\b(education|academic background)\b/i,
  skills: /\b(skills|technical skills|technologies)\b/i,
  projects: /\b(projects|portfolio)\b/i,
  experience: /\b(experience|work history|employment)\b/i,
};

const actionVerbs = [
  "built",
  "created",
  "developed",
  "designed",
  "implemented",
  "improved",
  "optimized",
  "reduced",
  "increased",
  "automated",
  "integrated",
  "deployed",
  "tested",
  "led",
  "owned",
  "analyzed",
];

function detectSections(resumeText: string): string[] {
  return Object.entries(sectionPatterns)
    .filter(([, pattern]) => pattern.test(resumeText))
    .map(([section]) => section);
}

function detectContactInfo(resumeText: string) {
  return {
    email: /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i.test(resumeText),
    phone: /(?:\+?\d[\d\s().-]{7,}\d)/.test(resumeText),
    links: /\b(github\.com|linkedin\.com|https?:\/\/|www\.)/i.test(resumeText),
  };
}

function extractBullets(resumeText: string): string[] {
  return splitLines(resumeText)
    .filter((line) => /^[-*•]|^\d+[.)]/.test(line))
    .map((line) => line.replace(/^[-*•]\s*|^\d+[.)]\s*/, "").trim())
    .filter((line) => line.length > 0);
}

function analyzeBullets(bullets: string[]): WeakBullet[] {
  return bullets
    .map((bullet) => {
      const issues: string[] = [];
      const normalized = normalizeText(bullet);

      if (!actionVerbs.some((verb) => normalized.startsWith(verb))) {
        issues.push("Start with a stronger action verb.");
      }

      if (!/\d|%|\b(users|customers|requests|seconds|hours|minutes|revenue)\b/i.test(bullet)) {
        issues.push("Add measurable impact if the user can support it.");
      }

      if (bullet.length > 180) {
        issues.push("Shorten this bullet for recruiter scanning.");
      }

      if (/\b(responsible for|worked on|helped with|various|things)\b/i.test(bullet)) {
        issues.push("Replace vague wording with specific technical work.");
      }

      return {
        text: bullet,
        issues,
      };
    })
    .filter((bullet) => bullet.issues.length > 0);
}

function buildIssues({
  missingSections,
  contactInfo,
  weakBullets,
  missingKeywords,
}: {
  missingSections: string[];
  contactInfo: ReturnType<typeof detectContactInfo>;
  weakBullets: WeakBullet[];
  missingKeywords: string[];
}): AtsIssue[] {
  const issues: AtsIssue[] = [];

  if (!contactInfo.email) {
    issues.push({
      id: "missing-email",
      severity: "error",
      title: "Missing email",
      detail: "ATS and recruiters need a clear email address in the resume header.",
    });
  }

  if (!contactInfo.phone) {
    issues.push({
      id: "missing-phone",
      severity: "warning",
      title: "Missing phone",
      detail: "Add a phone number if you want recruiters to contact you directly.",
    });
  }

  if (missingSections.length) {
    issues.push({
      id: "missing-sections",
      severity: "warning",
      title: "Missing common sections",
      detail: `Consider adding: ${missingSections.join(", ")}.`,
    });
  }

  if (weakBullets.length) {
    issues.push({
      id: "weak-bullets",
      severity: "warning",
      title: "Weak bullet points",
      detail: `${weakBullets.length} bullet point${weakBullets.length === 1 ? "" : "s"} need stronger action, specificity, or measurable impact.`,
    });
  }

  if (missingKeywords.length) {
    issues.push({
      id: "missing-keywords",
      severity: "warning",
      title: "Missing job keywords",
      detail: "Add truthful missing terms only when they match your real experience.",
    });
  }

  if (!issues.length) {
    issues.push({
      id: "ats-readable",
      severity: "pass",
      title: "Readable structure",
      detail: "The resume includes core ATS-friendly signals for this local check.",
    });
  }

  return issues;
}

function scoreResult({
  matchedKeywords,
  jobKeywords,
  requiredSkillMatches,
  detectedSections,
  contactInfo,
  weakBullets,
}: {
  matchedKeywords: string[];
  jobKeywords: string[];
  requiredSkillMatches: KeywordMatch[];
  detectedSections: string[];
  contactInfo: ReturnType<typeof detectContactInfo>;
  weakBullets: WeakBullet[];
}): number {
  const keywordScore = jobKeywords.length
    ? (matchedKeywords.length / jobKeywords.length) * 45
    : 20;
  const requiredScore = requiredSkillMatches.length
    ? (requiredSkillMatches.filter((skill) => skill.present).length /
        requiredSkillMatches.length) *
      20
    : 15;
  const sectionScore = (detectedSections.length / Object.keys(sectionPatterns).length) * 15;
  const contactScore =
    Number(contactInfo.email) * 7 + Number(contactInfo.phone) * 5 + Number(contactInfo.links) * 3;
  const bulletPenalty = Math.min(15, weakBullets.length * 3);

  return Math.max(
    0,
    Math.min(100, Math.round(keywordScore + requiredScore + sectionScore + contactScore - bulletPenalty)),
  );
}

export function analyzeResumeLocally({
  resumeText,
  jobDescription,
  requiredSkills = [],
}: {
  resumeText: string;
  jobDescription: string;
  requiredSkills?: string[];
}): AnalysisResult {
  const jobKeywords = extractKeywords(jobDescription);
  const matchedKeywords = jobKeywords.filter((keyword) => hasTerm(resumeText, keyword));
  const missingKeywords = jobKeywords.filter((keyword) => !hasTerm(resumeText, keyword));
  const requiredSkillMatches = requiredSkills
    .map((skill) => skill.trim())
    .filter(Boolean)
    .map((skill) => ({
      keyword: skill,
      present: hasTerm(resumeText, skill),
    }));
  const detectedSections = detectSections(resumeText);
  const missingSections = Object.keys(sectionPatterns).filter(
    (section) => !detectedSections.includes(section),
  );
  const contactInfo = detectContactInfo(resumeText);
  const weakBullets = analyzeBullets(extractBullets(resumeText));
  const atsIssues = buildIssues({
    missingSections,
    contactInfo,
    weakBullets,
    missingKeywords,
  });
  const score = scoreResult({
    matchedKeywords,
    jobKeywords,
    requiredSkillMatches,
    detectedSections,
    contactInfo,
    weakBullets,
  });
  const suggestedImprovements = [
    missingKeywords.length
      ? `Review missing keywords: ${missingKeywords.slice(0, 8).join(", ")}. Add only the terms you can truthfully support.`
      : "Keyword coverage is strong for the provided job description.",
    weakBullets.length
      ? "Rewrite weak bullets with action verbs, concrete technical work, and supported metrics."
      : "Bullets are concise enough for this local quality check.",
    missingSections.length
      ? `Add missing common sections if relevant: ${missingSections.join(", ")}.`
      : "Core resume sections are present.",
  ];

  return {
    score,
    matchedKeywords,
    missingKeywords,
    requiredSkillMatches,
    detectedSections,
    missingSections,
    contactInfo,
    weakBullets,
    atsIssues,
    suggestedImprovements,
    beforeAfterSummary:
      "Before: local scan checked keyword overlap, required skills, sections, contact info, and bullet quality. After: use the suggestions to align truthful experience with the job description while keeping ATS-friendly structure.",
  };
}
