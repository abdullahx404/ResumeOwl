"use client";

import { create } from "zustand";
import { sampleResume } from "@/lib/resume/sample";
import type { PersonalInfo, ResumeDocument, ResumeSectionId } from "@/types/resume";

type ResumeStore = {
  resume: ResumeDocument;
  setResume: (resume: ResumeDocument) => void;
  updatePersonal: (field: keyof PersonalInfo, value: string) => void;
  updateSummary: (value: string) => void;
  setSectionOrder: (sectionOrder: ResumeSectionId[]) => void;
  reset: () => void;
};

function cloneSample(): ResumeDocument {
  return structuredClone(sampleResume);
}

export const useResumeStore = create<ResumeStore>((set) => ({
  resume: cloneSample(),
  setResume: (resume) => set({ resume }),
  updatePersonal: (field, value) =>
    set((state) => ({
      resume: {
        ...state.resume,
        personal: {
          ...state.resume.personal,
          [field]: value,
        },
      },
    })),
  updateSummary: (value) =>
    set((state) => ({
      resume: {
        ...state.resume,
        summary: value,
      },
    })),
  setSectionOrder: (sectionOrder) =>
    set((state) => ({
      resume: {
        ...state.resume,
        sectionOrder,
      },
    })),
  reset: () => set({ resume: cloneSample() }),
}));
