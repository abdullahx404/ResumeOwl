import { z } from "zod";
import { resumeDocumentSchema } from "./resume";

export const bulletGenerationRequestSchema = z.object({
  name: z.string().trim().min(1).max(120),
  notes: z.string().trim().min(1).max(4000),
  techStack: z.array(z.string().trim().min(1)).max(30).default([]),
  count: z.number().int().min(2).max(6),
  sectionType: z.enum(["project", "experience"]),
});

export const bulletGenerationResponseSchema = z.object({
  bullets: z.array(z.string().trim().min(1)).min(2).max(6),
});

export const makerResumeSchema = resumeDocumentSchema;

export type BulletGenerationRequest = z.infer<typeof bulletGenerationRequestSchema>;
