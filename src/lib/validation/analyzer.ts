import { z } from "zod";

export const analyzerRequestSchema = z.object({
  resumeText: z.string().trim().min(1, "Resume text is required").max(80_000),
  jobDescription: z.string().trim().min(1, "Job description is required").max(80_000),
  requiredSkills: z.array(z.string().trim().min(1)).max(80).default([]),
});

export const rewrittenBulletSchema = z.object({
  before: z.string().trim().min(1),
  after: z.string().trim().min(1),
  rationale: z.string().trim().min(1),
});

export const aiAnalyzerFeedbackSchema = z.object({
  recruiterFeedback: z.string().trim().min(1),
  suggestedImprovements: z.array(z.string().trim().min(1)).max(10),
  rewrittenWeakBullets: z.array(rewrittenBulletSchema).max(8),
  beforeAfterSummary: z.string().trim().min(1),
  cautionNotes: z.array(z.string().trim().min(1)).max(6),
});

export type AnalyzerRequest = z.infer<typeof analyzerRequestSchema>;
export type AiAnalyzerFeedback = z.infer<typeof aiAnalyzerFeedbackSchema>;
