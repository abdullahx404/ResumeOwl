import type { AnalysisResult, AtsIssue, KeywordMatch, WeakBullet } from "@/types/resume";
import { commonCourses, commonSkills } from "@/lib/maker/options";
import { hasTerm, normalizeText, splitLines } from "./text";

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

const extraSkillTerms = [
  "rest api",
  "rest apis",
  "websocket",
  "websockets",
  "webrtc",
  "socket.io",
  "html5",
  "css3",
  "responsive web design",
  "frontend",
  "front-end",
  "front end",
  "front-end frameworks",
  "backend",
  "back-end",
  "back end",
  "backend development",
  "back-end development",
  "back end development",
  "database management",
  "debugging",
  "problem-solving",
  "communication",
  "teamwork",
  "testing",
  "ui/ux",
  "ui/ux principles",
  "version control",
  "git and github",
  "git & github",
  "git/github",
];

const ignoredRequiredSkillFragments = new Set([
  "and javascript",
  "or angular",
  "or similar",
  "required skills",
]);

const skillVocabulary = [...new Set([...commonSkills, ...commonCourses, ...extraSkillTerms])].sort(
  (a, b) => b.length - a.length,
);

const canonicalSkillLabels = new Map<string, string>([
  ["css3", "CSS"],
  ["front end", "Frontend"],
  ["front-end", "Frontend"],
  ["frontend", "Frontend"],
  ["back end", "Backend"],
  ["back-end", "Backend"],
  ["backend", "Backend"],
  ["back end development", "Backend Development"],
  ["back-end development", "Backend Development"],
  ["backend development", "Backend Development"],
  ["git & github", "Git and GitHub"],
  ["git/github", "Git and GitHub"],
  ["git and github", "Git and GitHub"],
  ["git github", "Git and GitHub"],
  ["html5", "HTML"],
  ["rest api", "REST APIs"],
  ["rest apis", "REST APIs"],
  ["ui/ux principles", "UI/UX"],
]);

function canonicalSkillLabel(term: string): string {
  const normalized = normalizeText(term);
  return canonicalSkillLabels.get(normalized) ?? term;
}

const skillPresenceAliases = new Map<string, string[]>([
  ["backend development", ["backend", "back-end", "back end", "server-side", "node.js", "express.js"]],
  ["frontend", ["frontend", "front-end", "front end", "react", "angular", "vue", "html", "css"]],
  ["front-end frameworks", ["react", "angular", "vue", "next.js", "frontend", "front-end"]],
  ["database management", ["database", "sql", "mysql", "postgresql", "mongodb"]],
  ["version control", ["git", "github", "git/github", "git and github"]],
  ["git and github", ["git", "github", "git/github", "git & github"]],
  ["responsive web design", ["responsive", "html", "css", "tailwind css", "bootstrap"]],
  ["basic cloud and deployment knowledge", ["cloud", "aws", "azure", "gcp", "vercel", "deployment"]],
]);

function hasSkillTerm(text: string, term: string): boolean {
  if (hasTerm(text, term)) {
    return true;
  }

  const canonical = normalizeText(canonicalSkillLabel(term));
  const aliases = skillPresenceAliases.get(canonical) ?? [];

  return aliases.some((alias) => hasTerm(text, alias));
}

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

function uniqueTerms(terms: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const term of terms) {
    const label = canonicalSkillLabel(term);
    const normalized = normalizeText(label);

    if (!normalized || seen.has(normalized)) {
      continue;
    }

    seen.add(normalized);
    result.push(label);
  }

  return result;
}

function extractSkillKeywords(text: string): string[] {
  return uniqueTerms(
    skillVocabulary.filter((term) => {
      const normalized = normalizeText(term);
      return normalized.length > 2 && hasSkillTerm(text, normalized);
    }),
  );
}

function normalizeRequiredSkills(requiredSkills: string[], jobDescription: string): string[] {
  const explicit = requiredSkills
    .flatMap((skill) => skill.split(/[,;\n]/))
    .map((skill) => skill.trim())
    .filter(Boolean)
    .filter((skill) => {
      const normalized = normalizeText(skill);
      return normalized.length > 2 && !ignoredRequiredSkillFragments.has(normalized);
    })
    .flatMap((skill) => {
      const matchedKnownTerms = skillVocabulary.filter(
        (term) => normalizeText(term).length > 2 && hasSkillTerm(skill, term),
      );
      return matchedKnownTerms.length ? matchedKnownTerms : [skill];
    });

  return uniqueTerms([...explicit, ...extractSkillKeywords(jobDescription)]);
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
      detail: "Some important role skills or tools from the job post were not found in the resume.",
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
}): AnalysisResult["scoreBreakdown"] & { total: number } {
  const keywordCoverage = jobKeywords.length
    ? (matchedKeywords.length / jobKeywords.length) * 35
    : 20;
  const requiredSkills = requiredSkillMatches.length
    ? (requiredSkillMatches.filter((skill) => skill.present).length /
        requiredSkillMatches.length) *
      25
    : 20;
  const sections = (detectedSections.length / Object.keys(sectionPatterns).length) * 15;
  const contact =
    Number(contactInfo.email) * 7 + Number(contactInfo.phone) * 5 + Number(contactInfo.links) * 3;
  const bulletQuality = Math.max(0, 10 - Math.min(10, weakBullets.length * 2));
  const total = Math.max(
    0,
    Math.min(100, Math.round(keywordCoverage + requiredSkills + sections + contact + bulletQuality)),
  );

  return {
    keywordCoverage: Math.round(keywordCoverage),
    requiredSkills: Math.round(requiredSkills),
    sections: Math.round(sections),
    contact: Math.round(contact),
    bulletQuality: Math.round(bulletQuality),
    total,
  };
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
  const jobKeywords = extractSkillKeywords(jobDescription);
  const matchedKeywords = uniqueTerms(jobKeywords.filter((keyword) => hasSkillTerm(resumeText, keyword)));
  const requiredSkillMatches = normalizeRequiredSkills(requiredSkills, jobDescription)
    .map((skill) => ({
      keyword: skill,
      present: hasSkillTerm(resumeText, skill),
    }));
  const missingKeywords = uniqueTerms([
    ...jobKeywords.filter((keyword) => !hasSkillTerm(resumeText, keyword)),
    ...requiredSkillMatches.filter((skill) => !skill.present).map((skill) => skill.keyword),
  ]);
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
  const scoreBreakdown = scoreResult({
    matchedKeywords,
    jobKeywords,
    requiredSkillMatches,
    detectedSections,
    contactInfo,
    weakBullets,
  });
  const suggestedImprovements = [
    missingKeywords.length
      ? `Review missing keywords: ${missingKeywords.slice(0, 8).join(", ")}. Add relevant ones only when they match your actual work.`
      : "Keyword coverage is strong for the provided job description.",
    weakBullets.length
      ? "Rewrite weak bullets with action verbs, concrete technical work, and supported metrics."
      : "Bullets are concise enough for this local quality check.",
    missingSections.length
      ? `Add missing common sections if relevant: ${missingSections.join(", ")}.`
      : "Core resume sections are present.",
  ];

  return {
    score: scoreBreakdown.total,
    scoreBreakdown: {
      keywordCoverage: scoreBreakdown.keywordCoverage,
      requiredSkills: scoreBreakdown.requiredSkills,
      sections: scoreBreakdown.sections,
      contact: scoreBreakdown.contact,
      bulletQuality: scoreBreakdown.bulletQuality,
    },
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
