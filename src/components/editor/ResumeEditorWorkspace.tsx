"use client";

import Link from "next/link";
import { ArrowRight, ClipboardPaste, Eye, Loader2 } from "lucide-react";
import { useMemo, useState } from "react";
import { NotificationPill } from "@/components/ui/NotificationPill";
import { importResumeText, importedResumeSummary } from "@/lib/resume/importer";
import { useResumeStore } from "@/stores/resume-store";
import type { ResumeDocument } from "@/types/resume";

export function ResumeEditorWorkspace() {
  const setResume = useResumeStore((state) => state.setResume);
  const [rawResume, setRawResume] = useState("");
  const [notice, setNotice] = useState("");
  const [isImporting, setIsImporting] = useState(false);
  const [importedResume, setImportedResume] = useState<ResumeDocument | null>(null);
  const canImport = rawResume.trim().length > 0;
  const imported = useMemo(
    () => (rawResume.trim() ? importResumeText(rawResume) : null),
    [rawResume],
  );

  function flash(message: string) {
    setNotice(message);
    window.setTimeout(() => setNotice(""), 2400);
  }

  async function applyImport() {
    if (!canImport || !imported) {
      flash("Paste your resume text first.");
      return;
    }

    setIsImporting(true);
    await Promise.resolve();
    setResume(imported);
    setImportedResume(imported);
    setIsImporting(false);
    flash(importedResumeSummary(imported));
  }

  return (
    <>
      <NotificationPill message={notice} tone={notice.includes("Paste") ? "error" : "info"} />
      <div className="grid gap-6 xl:grid-cols-[minmax(0,0.9fr)_minmax(360px,1fr)]">
        <section className="surface-card rounded-lg p-5 shadow-soft">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-semibold text-ink">Resume Editor</h1>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Import your current resume first. ResumeOwl will extract the details, format them into sections, then you can edit the result.
              </p>
            </div>
            <ClipboardPaste className="h-7 w-7 text-owl-700" aria-hidden="true" />
          </div>

          <textarea
            className="mt-5 min-h-[420px] w-full rounded-md border border-slate-300 px-3 py-2 text-sm leading-6 outline-none transition focus:border-owl-600 focus:ring-2 focus:ring-owl-100"
            value={rawResume}
            onChange={(event) => setRawResume(event.target.value)}
            placeholder="Paste your current resume text here..."
          />

          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            <button
              type="button"
              className="touch-feedback inline-flex items-center justify-center gap-2 rounded-md bg-owl-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-owl-900 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={!canImport || isImporting}
              onClick={applyImport}
            >
              {isImporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
              {isImporting ? "Importing..." : "Import To ResumeOwl"}
            </button>
            <Link
              href="/preview"
              aria-disabled={!importedResume}
              className={`touch-feedback inline-flex items-center justify-center gap-2 rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold transition hover:bg-slate-50 ${
                importedResume ? "text-slate-700" : "pointer-events-none cursor-not-allowed text-slate-400 opacity-60"
              }`}
              onClick={() => {
                if (importedResume) {
                  setResume(importedResume);
                }
              }}
            >
              <Eye className="h-4 w-4" />
              Edit Imported Resume
            </Link>
          </div>
        </section>

        <section className="surface-card rounded-lg p-5 shadow-soft">
          <h2 className="text-lg font-semibold text-ink">Imported Resume Format</h2>
          {importedResume ? (
            <ImportedResumeDetails resume={importedResume} />
          ) : (
            <div className="mt-4 flex min-h-[420px] items-center justify-center rounded-md border border-dashed border-slate-300 p-6 text-center">
              <p className="max-w-sm text-sm leading-6 text-slate-600">
                Paste your resume, then click Import To ResumeOwl. Extracted sections will appear here in ResumeOwl format.
              </p>
            </div>
          )}
        </section>
      </div>
    </>
  );
}

function ImportedResumeDetails({ resume }: { resume: ResumeDocument }) {
  return (
    <div className="mt-4 space-y-4 text-sm text-slate-700">
      <PreviewRow label="Full Name" value={resume.personal.fullName} />
      <PreviewRow label="Title" value={resume.personal.title ?? ""} />
      <PreviewRow label="Contact" value={[resume.personal.email, resume.personal.phone, resume.personal.location].filter(Boolean).join(" | ")} />
      <PreviewRow label="Summary" value={resume.summary ?? ""} />
      <PreviewRow
        label="Education"
        value={resume.education.map((item) => [item.institute, item.degree, item.cgpa].filter(Boolean).join(", ")).join("\n")}
      />
      <PreviewRow label="Relevant Courses" value={resume.courses.join(", ")} />
      <PreviewRow
        label="Skills"
        value={resume.skillGroups.map((group) => `${group.name}: ${group.skills.join(", ")}`).join("\n")}
      />
      <PreviewRow
        label="Projects"
        value={resume.projects.map((project) => `${project.name}\n${project.bullets.map((bullet) => `- ${bullet}`).join("\n")}`).join("\n\n")}
      />
      <PreviewRow
        label="Experience"
        value={resume.experience.map((item) => `${item.role}, ${item.company}\n${item.bullets.map((bullet) => `- ${bullet}`).join("\n")}`).join("\n\n")}
      />
      <PreviewRow
        label="Optional Sections"
        value={resume.optionalSections.map((section) => `${section.title}\n${section.items.map((item) => `- ${item}`).join("\n")}`).join("\n\n")}
      />
    </div>
  );
}

function PreviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-slate-50 px-3 py-2">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-slate-800">{value || "Not detected"}</p>
    </div>
  );
}
