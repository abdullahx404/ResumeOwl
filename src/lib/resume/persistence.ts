import { sampleResume } from "@/lib/resume/sample";
import type { ResumeDocument } from "@/types/resume";

export type StoredProfile = {
  fullName: string;
  title: string;
  onboarded: boolean;
};

const resumeStorageKey = "resumeowl.resume.v1";
const profileStorageKey = "resumeowl.profile.v1";
const sampleContactValues = new Set([
  "amina@example.com",
  "+92 300 0000000",
  "https://github.com/amina",
  "https://linkedin.com/in/amina",
  "https://amina.dev",
  "Lahore, Pakistan",
]);

function canUseBrowserStorage() {
  return typeof window !== "undefined";
}

function readJson<T>(key: string): T | null {
  if (!canUseBrowserStorage()) {
    return null;
  }

  try {
    const value = localStorage.getItem(key);
    return value ? (JSON.parse(value) as T) : null;
  } catch {
    localStorage.removeItem(key);
    return null;
  }
}

function writeJson<T>(key: string, value: T) {
  if (!canUseBrowserStorage()) {
    return;
  }

  localStorage.setItem(key, JSON.stringify(value));
}

export function applyProfileToResume(
  resume: ResumeDocument,
  profile: Pick<StoredProfile, "fullName" | "title">,
): ResumeDocument {
  const personal = { ...resume.personal };

  for (const field of ["email", "phone", "github", "linkedin", "portfolio", "location"] as const) {
    if (personal[field] && sampleContactValues.has(personal[field])) {
      personal[field] = "";
    }
  }

  return {
    ...resume,
    personal: {
      ...personal,
      fullName: profile.fullName || resume.personal.fullName,
      title: profile.title || resume.personal.title,
    },
  };
}

export function getStoredProfile(): StoredProfile | null {
  return readJson<StoredProfile>(profileStorageKey);
}

export function saveStoredProfile(profile: StoredProfile) {
  writeJson(profileStorageKey, profile);
}

export function getStoredResume(): ResumeDocument | null {
  return readJson<ResumeDocument>(resumeStorageKey);
}

export function saveStoredResume(resume: ResumeDocument) {
  writeJson(resumeStorageKey, resume);
}

export function getInitialResume(): ResumeDocument {
  const storedResume = getStoredResume();
  const storedProfile = getStoredProfile();

  if (storedResume) {
    return storedProfile ? applyProfileToResume(storedResume, storedProfile) : storedResume;
  }

  const resume = structuredClone(sampleResume);

  return storedProfile ? applyProfileToResume(resume, storedProfile) : resume;
}

export function clearStoredResume() {
  if (canUseBrowserStorage()) {
    localStorage.removeItem(resumeStorageKey);
  }
}
