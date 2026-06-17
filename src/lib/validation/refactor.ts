import { z } from "zod";
import { resumeDocumentSchema } from "./resume";

export const refactorRequestSchema = z.object({
  resumeText: z.string().trim().min(1, "Resume text is required").max(80_000),
  jobDescription: z.string().trim().min(1, "Job description is required").max(80_000),
  requiredSkills: z.array(z.string().trim().min(1)).max(80).default([]),
});

export const refactorResultSchema = z.object({
  refactoredResumeText: z.string().trim().min(1),
  updatedSkills: z.array(z.string().trim().min(1)).max(80),
  improvedBullets: z
    .array(
      z.object({
        before: z.string().trim().min(1),
        after: z.string().trim().min(1),
      }),
    )
    .max(20),
  atsNotes: z.array(z.string().trim().min(1)).max(12),
  improvementExplanation: z.array(z.string().trim().min(1)).max(12),
  previewResume: resumeDocumentSchema.optional(),
});

export type RefactorRequest = z.infer<typeof refactorRequestSchema>;
