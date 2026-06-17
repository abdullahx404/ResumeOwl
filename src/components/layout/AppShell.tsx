"use client";

import { ArrowRight, Check } from "lucide-react";
import { useEffect, useState } from "react";
import {
  getStoredProfile,
  saveStoredProfile,
  type StoredProfile,
} from "@/lib/resume/persistence";
import { useResumeStore } from "@/stores/resume-store";

type Step = "welcome" | "name" | "role" | "done";

export function AppShell({ children }: { children: React.ReactNode }) {
  const hydrateResume = useResumeStore((state) => state.hydrateResume);
  const applyProfile = useResumeStore((state) => state.applyProfile);
  const [step, setStep] = useState<Step>("done");
  const [fullName, setFullName] = useState("");
  const [title, setTitle] = useState("");
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    hydrateResume();
    const profile = getStoredProfile();

    if (profile?.onboarded) {
      setStep("done");
    } else {
      setFullName(profile?.fullName ?? "");
      setTitle(profile?.title ?? "");
      setStep("welcome");
    }

    setHydrated(true);
  }, [hydrateResume]);

  function saveAndEnter() {
    const profile: StoredProfile = {
      fullName: fullName.trim() || "Your Name",
      title: title.trim() || "Your Role",
      onboarded: true,
    };

    saveStoredProfile(profile);
    applyProfile(profile);
    setStep("done");
  }

  return (
    <>
      {children}
      {hydrated && step !== "done" ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 px-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="resumeowl-onboarding-title"
        >
          <div className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-6 shadow-2xl">
            {step === "welcome" ? (
              <>
                <p className="text-sm font-semibold uppercase tracking-wide text-owl-700">
                  ResumeOwl
                </p>
                <h2 id="resumeowl-onboarding-title" className="mt-2 text-2xl font-semibold text-ink">
                  Welcome To ResumeOwl
                </h2>
                <p className="mt-3 text-sm leading-6 text-slate-600">
                  Build, analyze, and export your resume without an account. Your profile and resume stay saved in this browser unless browser history or site data is cleared.
                </p>
                <button
                  type="button"
                  className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-md bg-owl-700 px-4 py-2 text-sm font-semibold text-white hover:bg-owl-900"
                  onClick={() => setStep("name")}
                >
                  Next
                  <ArrowRight className="h-4 w-4" />
                </button>
              </>
            ) : null}

            {step === "name" ? (
              <>
                <h2 id="resumeowl-onboarding-title" className="text-2xl font-semibold text-ink">
                  What Is Your Full Name?
                </h2>
                <input
                  autoFocus
                  className="mt-4 w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-owl-600 focus:ring-2 focus:ring-owl-100"
                  value={fullName}
                  onChange={(event) => setFullName(event.target.value)}
                  placeholder="Full Name"
                />
                <button
                  type="button"
                  className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-md bg-owl-700 px-4 py-2 text-sm font-semibold text-white hover:bg-owl-900 disabled:cursor-not-allowed disabled:opacity-60"
                  disabled={!fullName.trim()}
                  onClick={() => setStep("role")}
                >
                  Next
                  <ArrowRight className="h-4 w-4" />
                </button>
              </>
            ) : null}

            {step === "role" ? (
              <>
                <h2 id="resumeowl-onboarding-title" className="text-2xl font-semibold text-ink">
                  What Role Are You Targeting?
                </h2>
                <input
                  autoFocus
                  className="mt-4 w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-owl-600 focus:ring-2 focus:ring-owl-100"
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  placeholder="Software Engineer"
                />
                <button
                  type="button"
                  className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-md bg-owl-700 px-4 py-2 text-sm font-semibold text-white hover:bg-owl-900 disabled:cursor-not-allowed disabled:opacity-60"
                  disabled={!title.trim()}
                  onClick={saveAndEnter}
                >
                  Start Building
                  <Check className="h-4 w-4" />
                </button>
              </>
            ) : null}
          </div>
        </div>
      ) : null}
    </>
  );
}
