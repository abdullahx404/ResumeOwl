const actionVerbs = ["Built", "Designed", "Implemented", "Integrated", "Improved", "Created"];

function cleanNotes(notes: string): string[] {
  return notes
    .split(/[\n.;]+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

export function generateLocalBullets({
  name,
  notes,
  techStack,
  count,
  sectionType,
}: {
  name: string;
  notes: string;
  techStack: string[];
  count: number;
  sectionType: "project" | "experience";
}): string[] {
  const safeCount = Math.min(6, Math.max(2, count));
  const noteParts = cleanNotes(notes);
  const tech = techStack.filter(Boolean).join(", ");
  const subject = name.trim() || (sectionType === "project" ? "project" : "role");
  const base = noteParts.length
    ? noteParts
    : [
        sectionType === "project"
          ? `developed ${subject}`
          : `contributed to ${subject} responsibilities`,
      ];

  return Array.from({ length: safeCount }, (_, index) => {
    const verb = actionVerbs[index % actionVerbs.length];
    const detail = base[index % base.length].replace(/^\w/, (char) => char.toLowerCase());
    const stack = tech ? ` using ${tech}` : "";

    if (index === 0) {
      return `${verb} ${detail}${stack}.`;
    }

    if (index === 1) {
      return `${verb} reusable workflows for ${subject}${stack}.`;
    }

    return `${verb} clear technical documentation and implementation notes for ${subject}.`;
  });
}

export function parseCommaList(value: string): string[] {
  return value
    .split(/[,;\n]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

const knownTech = [
  "AWS",
  "Docker",
  "Express.js",
  "FastAPI",
  "Firebase",
  "Java",
  "JavaScript",
  "MongoDB",
  "Next.js",
  "Node.js",
  "PostgreSQL",
  "Python",
  "React",
  "SQL",
  "Tailwind CSS",
  "TypeScript",
];

export function inferProjectName(notes: string): string {
  const firstLine = notes
    .split(/\r?\n/)
    .map((line) => line.trim())
    .find(Boolean);

  if (!firstLine) {
    return "Technical Project";
  }

  const colonName = firstLine.match(/^([^:.-]{3,80})[:.-]/)?.[1]?.trim();
  if (colonName) {
    return colonName;
  }

  return firstLine
    .replace(/\b(i|we)\s+(built|created|developed|made|implemented)\s+/i, "")
    .split(/\s+/)
    .slice(0, 7)
    .join(" ")
    .replace(/^\w/, (char) => char.toUpperCase());
}

export function inferTechStack(notes: string): string[] {
  const normalized = notes.toLowerCase();

  return knownTech.filter((tech) => normalized.includes(tech.toLowerCase()));
}

export function textToBullets(text: string, count = 3): string[] {
  const parts = cleanNotes(text);
  const safeCount = Math.min(6, Math.max(2, count));

  if (!parts.length) {
    return [];
  }

  return parts.slice(0, safeCount).map((part) => {
    const trimmed = part.replace(/^[-*•]\s*/, "").trim();
    return trimmed.endsWith(".") ? trimmed : `${trimmed}.`;
  });
}
