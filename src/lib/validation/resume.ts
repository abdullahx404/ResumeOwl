import { z } from "zod";

export const idSchema = z.string().min(1);

export const personalInfoSchema = z.object({
  fullName: z.string().trim().min(1, "Full name is required"),
  title: z.string().trim().optional(),
  email: z.string().trim().email("Enter a valid email").optional().or(z.literal("")),
  phone: z.string().trim().optional(),
  github: z.string().trim().url("Enter a valid URL").optional().or(z.literal("")),
  linkedin: z.string().trim().url("Enter a valid URL").optional().or(z.literal("")),
  portfolio: z.string().trim().url("Enter a valid URL").optional().or(z.literal("")),
  location: z.string().trim().optional(),
});

export const educationEntrySchema = z.object({
  id: idSchema,
  institute: z.string().trim().min(1, "Institute is required"),
  degree: z.string().trim().min(1, "Degree is required"),
  startDate: z.string().trim().optional(),
  endDate: z.string().trim().optional(),
  cgpa: z.string().trim().optional(),
  details: z.array(z.string().trim()).default([]),
});

export const skillGroupSchema = z.object({
  id: idSchema,
  name: z.string().trim().min(1, "Skill group name is required"),
  skills: z.array(z.string().trim().min(1)).default([]),
});

export const projectEntrySchema = z.object({
  id: idSchema,
  name: z.string().trim().min(1, "Project name is required"),
  link: z.string().trim().url("Enter a valid URL").optional().or(z.literal("")),
  linkLabel: z.string().trim().optional(),
  techStack: z.array(z.string().trim().min(1)).default([]),
  bullets: z.array(z.string().trim().min(1)).min(1, "Add at least one bullet"),
});

export const experienceEntrySchema = z.object({
  id: idSchema,
  role: z.string().trim().min(1, "Role is required"),
  company: z.string().trim().min(1, "Company is required"),
  startDate: z.string().trim().optional(),
  endDate: z.string().trim().optional(),
  bullets: z.array(z.string().trim().min(1)).min(1, "Add at least one bullet"),
});

export const optionalSectionSchema = z.object({
  id: idSchema,
  title: z.string().trim().min(1, "Section title is required"),
  items: z.array(z.string().trim().min(1)).default([]),
});

export const resumeSectionIdSchema = z.enum([
  "education",
  "skills",
  "projects",
  "experience",
  "optional",
]);

export const resumeDocumentSchema = z.object({
  personal: personalInfoSchema,
  summary: z.string().trim().optional(),
  education: z.array(educationEntrySchema).default([]),
  courses: z.array(z.string().trim().min(1)).default([]),
  skillGroups: z.array(skillGroupSchema).default([]),
  projects: z.array(projectEntrySchema).default([]),
  experience: z.array(experienceEntrySchema).default([]),
  optionalSections: z.array(optionalSectionSchema).default([]),
  sectionOrder: z.array(resumeSectionIdSchema).default([
    "education",
    "skills",
    "projects",
    "experience",
    "optional",
  ]),
});
