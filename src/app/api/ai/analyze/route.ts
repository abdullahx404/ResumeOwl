import { NextResponse } from "next/server";
import { analyzeResumeLocally } from "@/lib/ats/analyzer";
import { extractJsonObject } from "@/lib/ai/json";
import { generateAiText, hasAiProvider } from "@/lib/ai/provider";
import { buildAnalyzePrompt } from "@/lib/ai/prompts";
import {
  aiAnalyzerFeedbackSchema,
  analyzerRequestSchema,
} from "@/lib/validation/analyzer";

export const runtime = "nodejs";
export const maxDuration = 10;

const aiAnalyzeTimeoutMs = 8000;

export async function POST(request: Request) {
  let payload: unknown;

  try {
    payload = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON request." },
      { status: 400 },
    );
  }

  const parsed = analyzerRequestSchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid analyzer input." },
      { status: 400 },
    );
  }

  if (!hasAiProvider()) {
    return NextResponse.json(
      {
        configured: false,
        error: "AI feedback is not configured yet. Local analysis is still available.",
      },
    );
  }

  try {
    const localAnalysis = analyzeResumeLocally(parsed.data);
    const prompt = buildAnalyzePrompt(parsed.data, localAnalysis);
    const rawFeedback = await generateAiText(prompt, {
      timeoutMs: aiAnalyzeTimeoutMs,
    });
    const json = extractJsonObject(rawFeedback);
    const feedback = aiAnalyzerFeedbackSchema.parse(json);

    return NextResponse.json({
      configured: true,
      feedback,
    });
  } catch {
    return NextResponse.json(
      {
        configured: true,
        error: "AI feedback could not be generated safely. Local analysis is still available.",
      },
    );
  }
}
