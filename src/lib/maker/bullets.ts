import { commonSkills } from "./options";

const actionVerbs = ["Built", "Designed", "Implemented", "Integrated", "Improved", "Created"];
const leadingActionPattern =
  /^(built|build|designed|design|implemented|implement|integrated|integrate|improved|improve|created|create|developed|develop|architected|architect|engineered|engineer|made|make)\s+/i;

function boldMeasurables(value: string): string {
  return value.replace(/\b(\d[\d,.]*\+?%?|\[[XY]\]\+?|\[[XY]\]%)(?=\s|$|[,.])/g, "**$1**");
}

function cleanNotes(notes: string): string[] {
  return notes
    .split(/[\n.;]+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

export function notesToBullets(notes: string): string[] {
  return notes
    .split(/\r?\n/)
    .map((item) => item.trim().replace(/^[-*•]\s*/, ""))
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
    const detail = base[index % base.length]
      .replace(/^[-*•]\s*/, "")
      .replace(leadingActionPattern, "")
      .replace(/^\w/, (char) => char.toLowerCase());
    const stack = tech ? ` using ${tech}` : "";

    if (index === 0) {
      return boldMeasurables(`${verb} ${detail}${stack}.`);
    }

    if (index === 1) {
      return boldMeasurables(`${verb} reusable workflows for ${subject}${stack}.`);
    }

    return boldMeasurables(`${verb} clear technical documentation and implementation notes for ${subject}.`);
  });
}

export function polishSummaryLocally(summary: string): string {
  return summary
    .trim()
    .replace(/\s+/g, " ")
    .replace(/\bpassionate\b|\benthusiastic\b|\benthusiast\b|\bhighly motivated\b/gi, "")
    .replace(/\s+,/g, ",")
    .replace(/\s+\./g, ".")
    .replace(/^\w/, (char) => char.toUpperCase());
}

export function parseCommaList(value: string): string[] {
  return value
    .split(/[,;\n]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

const knownTech = [
  ...commonSkills,
  ".NET",
  "ASP.NET",
  "Bash",
  "Bootstrap",
  "Chakra UI",
  "Cloudflare",
  "Dart",
  "Drizzle",
  "Electron",
  "Expo",
  "Framer Motion",
  "GraphQL",
  "gRPC",
  "Heroku",
  "Java Spring",
  "Kotlin",
  "Laravel",
  "Mongoose",
  "Netlify",
  "PHP",
  "Postman",
  "RabbitMQ",
  "Railway",
  "Ruby on Rails",
  "Sass",
  "Shadcn UI",
  "Socket.io",
  "Spring Boot",
  "Svelte",
  "Swift",
  "TanStack Query",
  "tRPC",
  "Ubuntu",
  "WebRTC",
  "WebSockets",
  "Zustand",
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

export function normalizeExternalUrl(value: string): string {
  const trimmed = value.trim();

  if (!trimmed) {
    return "";
  }

  if (/^[a-z][a-z0-9+.-]*:\/\//i.test(trimmed) || trimmed.startsWith("mailto:") || trimmed.startsWith("tel:")) {
    return trimmed;
  }

  return `https://${trimmed}`;
}

export function inferTechStack(notes: string): string[] {
  const normalized = notes.toLowerCase();

  return [...new Set(knownTech)].filter((tech) => {
    const term = tech.toLowerCase();

    if (term.length <= 2 || /^[a-z+#.]+$/i.test(term)) {
      const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      return new RegExp(`(^|[^a-z0-9+#.])${escaped}($|[^a-z0-9+#.])`, "i").test(normalized);
    }

    return normalized.includes(term);
  });
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
