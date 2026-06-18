import { NextResponse } from "next/server";
import { generateAiText, hasAiProvider } from "@/lib/ai/provider";
import { extractPlainSummary, polishSummaryLocally } from "@/lib/maker/bullets";

export const runtime = "nodejs";
export const maxDuration = 10;

const summaryTimeoutMs = 7000;

function buildPrompt(summary: string) {
  return `
Rewrite this resume summary into a concise, professional summary.

Rules:
- Keep the user's facts only.
- Do not invent skills, roles, metrics, education, experience, or achievements.
- Do not use flashy AI-style words such as passionate, enthusiast, enthusiastic, driven, dynamic, visionary, innovative, cutting-edge, or highly motivated.
- Keep it 1-2 sentences.
- Make it clear, structured, and suitable for a resume.
- Return only the polished summary text.

Summary:
${summary}
`.trim();
}

export async function POST(request: Request) {
  let payload: unknown;

  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON request." }, { status: 400 });
  }

  const summary =
    typeof payload === "object" && payload !== null && "summary" in payload
      ? String((payload as { summary?: unknown }).summary ?? "").trim()
      : "";

  if (!summary) {
    return NextResponse.json({ error: "Summary is required." }, { status: 400 });
  }

  if (!hasAiProvider()) {
    return NextResponse.json({
      configured: false,
      summary: polishSummaryLocally(summary),
    });
  }

  try {
    const polished = extractPlainSummary(await generateAiText(buildPrompt(summary), {
      preferFastModel: true,
      timeoutMs: summaryTimeoutMs,
    })).trim();

    return NextResponse.json({
      configured: true,
      summary: polished || polishSummaryLocally(summary),
    });
  } catch {
    return NextResponse.json({
      configured: true,
      summary: polishSummaryLocally(summary),
      error: "AI summary polish could not be generated safely, so local polish was used.",
    });
  }
}
