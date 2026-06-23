import { normalizeExternalUrl, notesToBullets, parseCommaList } from "@/lib/maker/bullets";
import type { EducationEntry, ExperienceEntry, OptionalSection, ProjectEntry, ResumeDocument, SkillGroup } from "@/types/resume";

const sectionHeadingPattern = /^(summary|profile|objective|education|academic background|skills|technical skills|projects|portfolio|experience|work experience|employment|certifications|certificates|achievements|awards)$/i;

function createId(prefix: string, index: number) {
  return `${prefix}-import-${index}`;
}

function splitLines(text: string) {
  return text
    .replace(/\r/g, "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

function cleanBullet(line: string) {
  return line.replace(/^[-*•]\s*/, "").replace(/^\d+[.)]\s*/, "").trim();
}

function groupSections(lines: string[]) {
  const sections = new Map<string, string[]>();
  let current = "header";
  sections.set(current, []);

  for (const line of lines) {
    if (sectionHeadingPattern.test(line)) {
      current = line.toLowerCase();
      sections.set(current, []);
      continue;
    }

    sections.get(current)?.push(line);
  }

  return sections;
}

function findSection(sections: Map<string, string[]>, names: string[]) {
  for (const name of names) {
    const section = sections.get(name);

    if (section?.length) {
      return section;
    }
  }

  return [];
}

function parseHeader(lines: string[]) {
  const email = lines.join(" ").match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)?.[0] ?? "";
  const phone = lines.join(" ").match(/(?:\+?\d[\d\s().-]{7,}\d)/)?.[0]?.trim() ?? "";
  const github = lines.find((line) => /github/i.test(line)) ?? "";
  const linkedin = lines.find((line) => /linkedin/i.test(line)) ?? "";
  const portfolio = lines.find((line) => /https?:\/\/|www\./i.test(line) && !/github|linkedin/i.test(line)) ?? "";
  const name = lines.find((line) => !/[|@]|\d{5,}|https?:\/\/|www\.|github|linkedin/i.test(line)) ?? "Your Name";
  const title = lines.find((line) => line !== name && !/[|@]|\d{5,}|https?:\/\/|www\.|github|linkedin/i.test(line)) ?? "Your Role";

  return {
    fullName: name,
    title,
    email,
    phone,
    github,
    linkedin,
    portfolio,
    location: "",
  };
}

function parseEducation(lines: string[]): EducationEntry[] {
  if (!lines.length) {
    return [];
  }

  const entries: EducationEntry[] = [];
  const chunks = chunkByLikelyTitle(lines);

  chunks.forEach((chunk, index) => {
    const joined = chunk.join(" ");
    const cgpa = joined.match(/\b(?:CGPA|GPA)\s*:?\s*([0-9]+(?:\.[0-9]{1,2})?)/i)?.[1] ?? "";
    const dateMatch = joined.match(/((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sept|Sep|Oct|Nov|Dec|\d{4})[a-z]*\s+\d{4}|\d{4})(?:\s*[-–]\s*)((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sept|Sep|Oct|Nov|Dec|\d{4})[a-z]*\s+\d{4}|\d{4}|Present)/i);
    const institute = chunk[0] ?? "";
    const degree = chunk.find((line) => /degree|bachelor|master|bs |ms |software|computer|engineering|science/i.test(line)) ?? chunk[1] ?? "";

    entries.push({
      id: createId("edu", index + 1),
      institute,
      degree,
      startDate: dateMatch?.[1] ?? "",
      endDate: dateMatch?.[2] ?? "",
      cgpa,
      details: chunk.slice(2).map(cleanBullet).filter((line) => !/cgpa|gpa/i.test(line)),
    });
  });

  return entries;
}

function parseSkills(lines: string[]): SkillGroup[] {
  const groups: SkillGroup[] = [];

  lines.forEach((line, index) => {
    const separatorIndex = line.indexOf(":");
    const [name, values] = separatorIndex >= 0
      ? [line.slice(0, separatorIndex), line.slice(separatorIndex + 1)]
      : ["Skills", line];
    const skills = parseCommaList(values);

    if (skills.length) {
      groups.push({
        id: createId("skills", index + 1),
        name: name.trim(),
        skills,
      });
    }
  });

  return groups;
}

function parseProjects(lines: string[]): ProjectEntry[] {
  return chunkByLikelyTitle(lines).map((chunk, index) => {
    const title = cleanBullet(chunk[0] ?? `Project ${index + 1}`);
    const link = chunk.find((line) => /https?:\/\/|www\./i.test(line)) ?? "";
    const bullets = chunk.slice(1).map(cleanBullet).filter((line) => line && line !== link);

    return {
      id: createId("project", index + 1),
      name: title,
      link: link ? normalizeExternalUrl(link) : "",
      linkLabel: link ? "Link" : "",
      techStack: [],
      bullets: bullets.length ? bullets : notesToBullets(chunk.join("\n")),
    };
  });
}

function parseExperience(lines: string[]): ExperienceEntry[] {
  return chunkByLikelyTitle(lines).map((chunk, index) => {
    const title = cleanBullet(chunk[0] ?? "Experience");
    const [role, company = ""] = title.split(/\s*(?:[-|,])\s+/);

    return {
      id: createId("exp", index + 1),
      role: role.trim(),
      company: company.trim(),
      startDate: "",
      endDate: "",
      bullets: chunk.slice(1).map(cleanBullet).filter(Boolean),
    };
  });
}

function parseOptional(title: string, lines: string[], index: number): OptionalSection | null {
  const items = lines.map(cleanBullet).filter(Boolean);

  return items.length
    ? {
        id: createId("optional", index),
        title,
        items,
      }
    : null;
}

function chunkByLikelyTitle(lines: string[]) {
  const chunks: string[][] = [];

  for (const line of lines) {
    const isBullet = /^[-*•]|\d+[.)]/.test(line);
    const previous = chunks.at(-1);

    if (!previous || (!isBullet && previous.some((item) => /^[-*•]|\d+[.)]/.test(item)))) {
      chunks.push([line]);
    } else {
      previous.push(line);
    }
  }

  return chunks.filter((chunk) => chunk.some(Boolean));
}

export function importResumeText(text: string): ResumeDocument {
  const lines = splitLines(text);
  const sections = groupSections(lines);
  const summaryLines = findSection(sections, ["summary", "profile", "objective"]);
  const education = parseEducation(findSection(sections, ["education", "academic background"]));
  const skillGroups = parseSkills(findSection(sections, ["skills", "technical skills"]));
  const projects = parseProjects(findSection(sections, ["projects", "portfolio"]));
  const experience = parseExperience(findSection(sections, ["experience", "work experience", "employment"]));
  const optionalSections = [
    parseOptional("Certifications", findSection(sections, ["certifications", "certificates"]), 1),
    parseOptional("Achievements", findSection(sections, ["achievements", "awards"]), 2),
  ].filter((section): section is OptionalSection => Boolean(section));

  return {
    personal: parseHeader(sections.get("header") ?? lines.slice(0, 6)),
    summary: summaryLines.join(" "),
    education,
    courses: [],
    skillGroups,
    projects,
    experience,
    optionalSections,
    sectionOrder: [
      ...(education.length ? (["education"] as const) : []),
      ...(skillGroups.length ? (["skills"] as const) : []),
      ...(projects.length ? (["projects"] as const) : []),
      ...(experience.length ? (["experience"] as const) : []),
      ...(optionalSections.length ? (["optional"] as const) : []),
    ],
  };
}

export function importedResumeSummary(resume: ResumeDocument) {
  const sectionCount = resume.sectionOrder.length + Number(Boolean(resume.summary));

  return `${sectionCount} section${sectionCount === 1 ? "" : "s"} imported.`;
}
