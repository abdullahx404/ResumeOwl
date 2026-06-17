import { NextResponse } from "next/server";
import { extractJsonObject } from "@/lib/ai/json";
import { generateAiText, hasAiProvider } from "@/lib/ai/provider";
import { buildRefactorPrompt } from "@/lib/ai/prompts";
import { refactorResumeLocally } from "@/lib/refactor/local";
import { refactorRequestSchema, refactorResultSchema } from "@/lib/validation/refactor";

export const runtime = "nodejs";
export const maxDuration = 30;

export async function POST(request: Request) {
  let payload: unknown;

  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON request." }, { status: 400 });
  }

  const parsed = refactorRequestSchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid refactor input." }, { status: 400 });
  }

  const localResult = refactorResumeLocally(parsed.data);

  if (!hasAiProvider()) {
    return NextResponse.json({
      configured: false,
      result: localResult,
    });
  }

  try {
    const prompt = buildRefactorPrompt(parsed.data, JSON.stringify(localResult));
    const raw = await generateAiText(prompt);
    const json = extractJsonObject(raw);
    const aiResult = refactorResultSchema.parse(json);

    return NextResponse.json({
      configured: true,
      result: {
        ...localResult,
        ...aiResult,
        previewResume: localResult.previewResume,
      },
    });
  } catch {
    return NextResponse.json({
      configured: true,
      result: localResult,
      error: "AI refactor could not be generated safely, so local refactor was used.",
    });
  }
}
