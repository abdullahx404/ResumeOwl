import { NextResponse } from "next/server";
import { generateAiText, hasAiProvider } from "@/lib/ai/provider";
import { extractJsonObject } from "@/lib/ai/json";
import { generateLocalBullets, inferTechStack } from "@/lib/maker/bullets";
import {
  bulletGenerationRequestSchema,
  bulletGenerationResponseSchema,
} from "@/lib/validation/maker";

export const runtime = "nodejs";
export const maxDuration = 10;

const bulletGenerationTimeoutMs = 7000;

function buildPrompt(input: ReturnType<typeof bulletGenerationRequestSchema.parse>) {
  if (input.sectionType === "project") {
    return `
Rewrite the given project description into a resume-style project entry.

Requirements:
* Output exactly 1 project title line and 4–5 bullet points.
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
* Use this exact project title line and do not rename it: ${input.name || "Project"}.
* Return only valid JSON in this shape: {"suggestedName":"${input.name || "Project"}","techStack":["..."],"bullets":["..."]}.

Input description:
${input.notes}

Explicit tech stack, if provided:
${input.techStack.join(", ") || "None provided"}
`.trim();
  }

  return `
You are ResumeOwl's resume bullet assistant.

Rules:
- Do not invent facts, metrics, tools, employers, users, outcomes, or skills.
- Use only the project or experience notes and explicit tech stack.
- Prefer tech-stack-specific and metric-aware bullets.
- If a metric, percentage, user count, volume, or scale is not provided, do not add one.
- Keep bullets short, technical, and ATS-friendly.
- Return only valid JSON in this shape: {"suggestedName":"...", "techStack":["..."], "bullets":["..."]}.

Name: ${input.name}
Section type: ${input.sectionType}
Bullet count: ${input.count}
Tech stack: ${input.techStack.join(", ") || "None provided"}
Additional hidden generation focus: ${input.generationFocus || "None"}
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
      suggestedName: parsed.data.name,
      techStack: parsed.data.sectionType === "project" ? inferTechStack(parsed.data.notes) : parsed.data.techStack,
      bullets: generateLocalBullets(parsed.data),
    });
  }

  try {
    const raw = await generateAiText(buildPrompt(parsed.data), {
      timeoutMs: bulletGenerationTimeoutMs,
    });
    const json = extractJsonObject(raw);
    const result = bulletGenerationResponseSchema.parse(json);

    return NextResponse.json({
      configured: true,
      bullets: result.bullets,
      suggestedName: parsed.data.name || result.suggestedName,
      techStack: result.techStack,
    });
  } catch {
    return NextResponse.json({
      configured: true,
      suggestedName: parsed.data.name,
      techStack: parsed.data.sectionType === "project" ? inferTechStack(parsed.data.notes) : parsed.data.techStack,
      bullets: generateLocalBullets(parsed.data),
      error: "AI bullets could not be generated safely, so local bullets were used.",
    });
  }
}
