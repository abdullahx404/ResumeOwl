import { NextResponse } from "next/server";
import { generateAiText, hasAiProvider } from "@/lib/ai/provider";
import {
  bulletGenerationRequestSchema,
  bulletGenerationResponseSchema,
} from "@/lib/validation/maker";

export const runtime = "nodejs";
export const maxDuration = 15;

const bulletGenerationTimeoutMs = 12000;
const bulletMarkerPattern = /^(?:[-*]|\u2022|\u2023|\u25E6|\d+[.)])\s+/;

function buildPrompt(input: ReturnType<typeof bulletGenerationRequestSchema.parse>) {
  return `
Rewrite the given project description into a resume-style project entry.

Requirements:
* Output exactly 1 project title line and ${input.count} bullet points, as defined in the bullet box.
* Keep the format professional, concise, and skill-focused.
* Start with a strong impact bullet including a bold numeric metric, such as **1000+ users**, **80% faster**, or **50% reduced cost**. If no metric is provided, create a realistic placeholder like **[X]+ users** or **[Y]% improvement**.
* Avoid repeating the same skills or technologies in multiple bullet points.
* Mention each major technology only once.
* Focus on architecture, implementation, reliability, performance, privacy, scalability, and user impact.
* Use strong action verbs like Developed, Architected, Implemented, Built, Designed, Optimized.
* Do not add fake features.
* Do not use buzzwords, fluff, or long sentences.
* Keep each bullet under 2 lines.
* Bold all numbers, percentages, and measurable impact.
* Return only the final formatted resume entry.

Input description:
${input.notes}
`.trim();
}

function cleanupLine(line: string) {
  return line
    .replace(/^```[\w-]*\s*/g, "")
    .replace(/```$/g, "")
    .replace(/^#{1,6}\s+/g, "")
    .replace(/^\*\*(.+)\*\*$/g, "$1")
    .trim();
}

function parseResumeEntry(raw: string, count: number) {
  const lines = raw
    .replace(/\r/g, "")
    .split("\n")
    .map(cleanupLine)
    .filter(Boolean);
  const title = lines.find((line) => !bulletMarkerPattern.test(line));
  const bulletLines = lines
    .filter((line) => bulletMarkerPattern.test(line))
    .map((line) => line.replace(bulletMarkerPattern, "").trim())
    .filter(Boolean);
  const fallbackBullets = lines.slice(title ? lines.indexOf(title) + 1 : 1).filter((line) => line !== title);
  const bullets = (bulletLines.length ? bulletLines : fallbackBullets)
    .map((bullet) => bullet.replace(/^["']|["']$/g, "").trim())
    .filter(Boolean)
    .slice(0, count);

  return bulletGenerationResponseSchema.parse({
    suggestedName: title,
    bullets,
  });
}

export async function POST(request: Request) {
  let payload: unknown;

  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON request." }, { status: 400 });
  }

  const parsed = bulletGenerationRequestSchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid bullet input." }, { status: 400 });
  }

  if (!hasAiProvider()) {
    return NextResponse.json(
      {
        configured: false,
        error: "AI generation is unavailable. Check the API key, quota, or provider limit.",
      },
      { status: 503 },
    );
  }

  try {
    const raw = await generateAiText(buildPrompt(parsed.data), {
      timeoutMs: bulletGenerationTimeoutMs,
      jsonMode: false,
    });
    const result = parseResumeEntry(raw, parsed.data.count);

    return NextResponse.json({
      configured: true,
      bullets: result.bullets,
      suggestedName: parsed.data.name || result.suggestedName,
    });
  } catch {
    return NextResponse.json(
      {
        configured: true,
        error: "AI generation failed or provider limit reached. Try again later.",
      },
      { status: 503 },
    );
  }
}
