import { commonSkills } from "./options";
import { normalizeSkillList } from "@/lib/resume/skills";

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

function firstMeaningfulSentence(notes: string): string {
  return cleanNotes(notes)
    .map((item) => item.replace(/^[-*•]\s*/, "").replace(leadingActionPattern, "").trim())
    .find((item) => item.length > 8) ?? "project functionality";
}

function metricFromNotes(notes: string): string {
  const match = notes.match(/\b\d[\d,.]*\+?\s*(?:users|customers|requests|files|downloads|seconds|minutes|hours|%|percent)\b/i);

  return match?.[0] ?? "[X]+ users";
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
  const safeCount = Math.min(6, Math.max(3, count));
  const techItems = [...new Set(techStack.filter(Boolean))];
  const primaryTech = techItems.slice(0, 3).join(", ");
  const secondaryTech = techItems.slice(3, 6).join(", ");
  const subject = name.trim() || (sectionType === "project" ? "project" : "role");
  const metric = metricFromNotes(notes);
  const firstDetail = firstMeaningfulSentence(notes)
    .replace(metric, "")
    .replace(/\s+/g, " ")
    .replace(/\bused by\s*[,.]?/i, "")
    .replace(/^\w/, (char) => char.toLowerCase())
    .trim();

  if (sectionType === "project") {
    return [
      `Developed ${subject} for ${metric}, supporting ${firstDetail || "the core project workflow"}${primaryTech ? ` with ${primaryTech}` : ""}.`,
      `Architected the core workflow for direct and reliable project execution${secondaryTech ? ` using ${secondaryTech}` : ""}.`,
      "Implemented privacy-focused behavior without relying on persistent cloud storage.",
      "Optimized the user flow for faster sharing, lower friction, and clearer transfer status.",
      "Designed a concise interface that keeps setup simple while preserving reliability.",
      "Strengthened the implementation with clearer error handling and maintainable technical structure.",
    ].slice(0, safeCount).map(boldMeasurables);
  }

  return [
    `Developed ${subject} work around ${firstDetail}.`,
    "Coordinated technical tasks with clear ownership, follow-up, and execution.",
    "Improved team workflow by documenting decisions, blockers, and implementation details.",
    "Contributed to reliable delivery through testing, communication, and issue tracking.",
    "Turned ambiguous requirements into actionable technical tasks.",
    "Supported measurable team outcomes through structured execution and regular progress tracking.",
  ].slice(0, safeCount).map(boldMeasurables);
}

export function extractPlainSummary(value: string): string {
  const trimmed = value.trim();

  if (!trimmed) {
    return "";
  }

  try {
    const parsed = JSON.parse(trimmed) as unknown;

    if (typeof parsed === "string") {
      return parsed.trim();
    }

    if (parsed && typeof parsed === "object" && "summary" in parsed) {
      return String((parsed as { summary?: unknown }).summary ?? "").trim();
    }
  } catch {
    const match = trimmed.match(/"summary"\s*:\s*"([^"]+)"/);

    if (match?.[1]) {
      return match[1].trim();
    }
  }

  return trimmed;
}

export function polishSummaryLocally(summary: string): string {
  return extractPlainSummary(summary)
    .trim()
    .replace(/\s+/g, " ")
    .replace(/\bpassionate\b|\benthusiastic\b|\benthusiast\b|\bhighly motivated\b/gi, "")
    .replace(/\s+,/g, ",")
    .replace(/\s+\./g, ".")
    .replace(/^\w/, (char) => char.toUpperCase());
}

export function parseCommaList(value: string): string[] {
  return normalizeSkillList(value
    .split(/[,;\n]/)
    .map((item) => item.trim())
    .filter(Boolean));
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

  return normalizeSkillList([...new Set(knownTech)].filter((tech) => {
    const term = tech.toLowerCase();

    if (term.length <= 2 || /^[a-z+#.]+$/i.test(term)) {
      const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      return new RegExp(`(^|[^a-z0-9+#.])${escaped}($|[^a-z0-9+#.])`, "i").test(normalized);
    }

    return normalized.includes(term);
  }));
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
