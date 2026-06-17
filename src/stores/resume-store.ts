"use client";

import { create } from "zustand";
import { sampleResume } from "@/lib/resume/sample";
import {
  applyProfileToResume,
  clearStoredResume,
  getInitialResume,
  saveStoredResume,
  type StoredProfile,
} from "@/lib/resume/persistence";
import type { PersonalInfo, ResumeDocument, ResumeSectionId } from "@/types/resume";

type ResumeStore = {
  resume: ResumeDocument;
  setResume: (resume: ResumeDocument) => void;
  hydrateResume: () => void;
  applyProfile: (profile: Pick<StoredProfile, "fullName" | "title">) => void;
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
  setResume: (resume) => {
    saveStoredResume(resume);
    set({ resume });
  },
  hydrateResume: () =>
    set(() => ({
      resume: getInitialResume(),
    })),
  applyProfile: (profile) =>
    set((state) => {
      const resume = applyProfileToResume(state.resume, profile);
      saveStoredResume(resume);

      return { resume };
    }),
  updatePersonal: (field, value) =>
    set((state) => {
      const resume = {
        ...state.resume,
        personal: {
          ...state.resume.personal,
          [field]: value,
        },
      };
      saveStoredResume(resume);

      return { resume };
    }),
  updateSummary: (value) =>
    set((state) => {
      const resume = {
        ...state.resume,
        summary: value,
      };
      saveStoredResume(resume);

      return { resume };
    }),
  setSectionOrder: (sectionOrder) =>
    set((state) => {
      const resume = {
        ...state.resume,
        sectionOrder,
      };
      saveStoredResume(resume);

      return { resume };
    }),
  reset: () => {
    clearStoredResume();
    set({ resume: getInitialResume() });
  },
}));
