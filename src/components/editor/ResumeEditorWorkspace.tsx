"use client";

import Link from "next/link";
import { ArrowRight, ClipboardPaste, Eye, Loader2 } from "lucide-react";
import { useMemo, useState } from "react";
import { NotificationPill } from "@/components/ui/NotificationPill";
import { importResumeText, importedResumeSummary } from "@/lib/resume/importer";
import { useResumeStore } from "@/stores/resume-store";

export function ResumeEditorWorkspace() {
  const setResume = useResumeStore((state) => state.setResume);
  const [rawResume, setRawResume] = useState("");
  const [notice, setNotice] = useState("");
  const [isImporting, setIsImporting] = useState(false);
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
    setIsImporting(false);
    flash(importedResumeSummary(imported));
  }

  return (
    <>
      <NotificationPill message={notice} tone={notice.includes("Paste") ? "error" : "info"} />
      <div className="grid gap-6 xl:grid-cols-[minmax(0,0.9fr)_minmax(360px,1fr)]">
        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-soft">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-semibold text-ink">Resume Editor</h1>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Paste an existing resume, import it into ResumeOwl sections, then continue editing in the live preview.
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
              className="inline-flex items-center justify-center gap-2 rounded-md bg-owl-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-owl-900 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={!canImport || isImporting}
              onClick={applyImport}
            >
              {isImporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
              {isImporting ? "Importing..." : "Import To ResumeOwl"}
            </button>
            <Link
              href="/preview"
              className="inline-flex items-center justify-center gap-2 rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              onClick={() => {
                if (imported) {
                  setResume(imported);
                }
              }}
            >
              <Eye className="h-4 w-4" />
              Open Editable Preview
            </Link>
          </div>
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-soft">
          <h2 className="text-lg font-semibold text-ink">Imported Structure</h2>
          {canImport && imported ? (
            <div className="mt-4 space-y-4 text-sm text-slate-700">
              <PreviewRow label="Name" value={imported.personal.fullName} />
              <PreviewRow label="Title" value={imported.personal.title ?? ""} />
              <PreviewRow label="Summary" value={imported.summary ?? ""} />
              <PreviewRow label="Education" value={`${imported.education.length} item(s)`} />
              <PreviewRow label="Skills" value={`${imported.skillGroups.length} group(s)`} />
              <PreviewRow label="Projects" value={`${imported.projects.length} item(s)`} />
              <PreviewRow label="Experience" value={`${imported.experience.length} item(s)`} />
              <PreviewRow label="Optional" value={`${imported.optionalSections.length} section(s)`} />
            </div>
          ) : (
            <div className="mt-4 flex min-h-[420px] items-center justify-center rounded-md border border-dashed border-slate-300 p-6 text-center">
              <p className="max-w-sm text-sm leading-6 text-slate-600">
                The imported structure will appear here once you paste resume text.
              </p>
            </div>
          )}
        </section>
      </div>
    </>
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
