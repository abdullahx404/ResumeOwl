export type ContactLink = {
  label: string;
  value: string;
  href?: string;
};

export type PersonalInfo = {
  fullName: string;
  title?: string;
  email?: string;
  phone?: string;
  github?: string;
  linkedin?: string;
  portfolio?: string;
  location?: string;
};

export type EducationEntry = {
  id: string;
  institute: string;
  degree: string;
  startDate?: string;
  endDate?: string;
  cgpa?: string;
  details?: string[];
};

export type SkillGroup = {
  id: string;
  name: string;
  skills: string[];
};

export type ProjectEntry = {
  id: string;
  name: string;
  link?: string;
  linkLabel?: string;
  techStack?: string[];
  bullets: string[];
};

export type ExperienceEntry = {
  id: string;
  role: string;
  company: string;
  startDate?: string;
  endDate?: string;
  bullets: string[];
};

export type OptionalSection = {
  id: string;
  title: string;
  items: string[];
};

export type ResumeSectionId =
  | "education"
  | "skills"
  | "projects"
  | "experience"
  | "optional";

export type ResumeDocument = {
  personal: PersonalInfo;
  summary?: string;
  education: EducationEntry[];
  courses: string[];
  skillGroups: SkillGroup[];
  projects: ProjectEntry[];
  experience: ExperienceEntry[];
  optionalSections: OptionalSection[];
  sectionOrder: ResumeSectionId[];
};

export type EditableResumeField =
  | keyof PersonalInfo
  | "summary";

export type ParsedResumeFile = {
  name: string;
  type: "pdf" | "docx" | "text";
  text: string;
};

export type AtsIssue = {
  id: string;
  severity: "pass" | "warning" | "error";
  title: string;
  detail: string;
};

export type WeakBullet = {
  text: string;
  issues: string[];
};

export type KeywordMatch = {
  keyword: string;
  present: boolean;
};

export type AnalysisResult = {
  score: number;
  matchedKeywords: string[];
  missingKeywords: string[];
  requiredSkillMatches: KeywordMatch[];
  detectedSections: string[];
  missingSections: string[];
  contactInfo: {
    email: boolean;
    phone: boolean;
    links: boolean;
  };
  weakBullets: WeakBullet[];
  atsIssues: AtsIssue[];
  suggestedImprovements: string[];
  beforeAfterSummary: string;
};

export type RefactorResult = {
  refactoredResumeText: string;
  updatedSkills: string[];
  improvedBullets: Array<{
    before: string;
    after: string;
  }>;
  atsNotes: string[];
  improvementExplanation: string[];
  previewResume?: ResumeDocument;
};
