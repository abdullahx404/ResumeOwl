import { NextResponse } from "next/server";
import { generateAiText, hasAiProvider } from "@/lib/ai/provider";
import { extractJsonObject } from "@/lib/ai/json";
import { generateLocalBullets } from "@/lib/maker/bullets";
import {
  bulletGenerationRequestSchema,
  bulletGenerationResponseSchema,
} from "@/lib/validation/maker";

export const runtime = "nodejs";
export const maxDuration = 30;

function buildPrompt(input: ReturnType<typeof bulletGenerationRequestSchema.parse>) {
  return `
You are ResumeOwl's resume bullet assistant.

Rules:
- Do not invent facts, metrics, tools, employers, users, outcomes, or skills.
- Use only the project or experience notes and explicit tech stack.
- If a metric is not provided, do not add one.
- Keep bullets short, technical, and ATS-friendly.
- Return only valid JSON in this shape: {"bullets":["..."]}.

Name: ${input.name}
Section type: ${input.sectionType}
Bullet count: ${input.count}
Tech stack: ${input.techStack.join(", ") || "None provided"}
Notes:
${input.notes}
`.trim();
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
    return NextResponse.json({
      configured: false,
      bullets: generateLocalBullets(parsed.data),
    });
  }

  try {
    const raw = await generateAiText(buildPrompt(parsed.data));
    const json = extractJsonObject(raw);
    const result = bulletGenerationResponseSchema.parse(json);

    return NextResponse.json({
      configured: true,
      bullets: result.bullets,
    });
  } catch {
    return NextResponse.json({
      configured: true,
      bullets: generateLocalBullets(parsed.data),
      error: "AI bullets could not be generated safely, so local bullets were used.",
    });
  }
}
