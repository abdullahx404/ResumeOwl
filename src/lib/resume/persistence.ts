import { sampleResume } from "@/lib/resume/sample";
import type { ResumeDocument } from "@/types/resume";

export type StoredProfile = {
  fullName: string;
  title: string;
  onboarded: boolean;
};

const resumeStorageKey = "resumeowl.resume.v1";
const profileStorageKey = "resumeowl.profile.v1";

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
  return {
    ...resume,
    personal: {
      ...resume.personal,
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

  if (storedResume) {
    return storedResume;
  }

  const storedProfile = getStoredProfile();
  const resume = structuredClone(sampleResume);

  return storedProfile ? applyProfileToResume(resume, storedProfile) : resume;
}

export function clearStoredResume() {
  if (canUseBrowserStorage()) {
    localStorage.removeItem(resumeStorageKey);
  }
}
