import { NextResponse } from "next/server";
import { generateAiText, hasAiProvider } from "@/lib/ai/provider";
import { textToBullets } from "@/lib/maker/bullets";

export const runtime = "nodejs";
export const maxDuration = 15;

const optionalTimeoutMs = 12000;
const bulletMarkerPattern = /^(?:[-*]|\u2022|\u2023|\u25E6|\d+[.)])\s+/;

function buildPrompt(input: { title: string; text: string; count: number }) {
  return `
Rewrite the optional resume section text into a clean resume section.

Requirements:
* Output exactly ${input.count} bullet points.
* Keep the section truthful and based only on the provided text.
* Do not invent awards, certifications, organizations, dates, rankings, metrics, or impact.
* Use concise resume wording with strong action verbs.
* Keep each bullet under 2 lines.
* Preserve specific names, awards, certificates, and placements when provided.
* Do not use buzzwords, fluff, or AI-style wording.
* Return only the final bullet points.

Section title:
${input.title}

Input text:
${input.text}
`.trim();
}

function parseBullets(raw: string, count: number) {
  const lines = raw
    .replace(/\r/g, "")
    .split("\n")
    .map((line) => line.replace(/^```[\w-]*\s*/g, "").replace(/```$/g, "").trim())
    .filter(Boolean);
  const marked = lines
    .filter((line) => bulletMarkerPattern.test(line))
    .map((line) => line.replace(bulletMarkerPattern, "").trim());
  const bullets = (marked.length ? marked : lines)
    .map((line) => line.replace(/^["']|["']$/g, "").trim())
    .filter(Boolean)
    .slice(0, count);

  return bullets;
}

export async function POST(request: Request) {
  let payload: unknown;

  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON request." }, { status: 400 });
  }

  const input = {
    title:
      typeof payload === "object" && payload !== null && "title" in payload
        ? String((payload as { title?: unknown }).title ?? "Optional Section").trim()
        : "Optional Section",
    text:
      typeof payload === "object" && payload !== null && "text" in payload
        ? String((payload as { text?: unknown }).text ?? "").trim()
        : "",
    count:
      typeof payload === "object" && payload !== null && "count" in payload
        ? Math.max(1, Math.min(6, Number((payload as { count?: unknown }).count) || 3))
        : 3,
  };

  if (!input.text) {
    return NextResponse.json({ error: "Optional section text is required." }, { status: 400 });
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
    const raw = await generateAiText(buildPrompt(input), {
      timeoutMs: optionalTimeoutMs,
      jsonMode: false,
    });
    const bullets = parseBullets(raw, input.count);

    if (!bullets.length) {
      throw new Error("No bullets returned");
    }

    return NextResponse.json({ configured: true, bullets });
  } catch {
    return NextResponse.json(
      {
        configured: true,
        bullets: textToBullets(input.text, input.count),
        error: "AI generation failed or provider limit reached. Local bullets were used.",
      },
      { status: 503 },
    );
  }
}
