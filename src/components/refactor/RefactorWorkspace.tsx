"use client";

import Link from "next/link";
import { Eye, FileUp, RotateCcw, Sparkles } from "lucide-react";
import { ChangeEvent, useState } from "react";
import { NotificationPill } from "@/components/ui/NotificationPill";
import { uploadHelpText, validateResumeFiles } from "@/lib/parsing/file-validation";
import { parseResumeFiles } from "@/lib/parsing/resume-parser";
import { refactorResumeLocally } from "@/lib/refactor/local";
import { useResumeStore } from "@/stores/resume-store";
import type { ParsedResumeFile, RefactorResult } from "@/types/resume";

function splitSkills(value: string): string[] {
  return value
    .split(/[,;\n]/)
    .map((skill) => skill.trim())
    .filter(Boolean);
}

export function RefactorWorkspace() {
  const setResume = useResumeStore((state) => state.setResume);
  const [resumeText, setResumeText] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [requiredSkills, setRequiredSkills] = useState("");
  const [parsedFiles, setParsedFiles] = useState<ParsedResumeFile[]>([]);
  const [result, setResult] = useState<RefactorResult | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "ready" | "error">("idle");
  const [notice, setNotice] = useState("");
  const [isParsing, setIsParsing] = useState(false);

  function flash(message: string) {
    setNotice(message);
    window.setTimeout(() => setNotice(""), 2600);
  }

  async function handleFiles(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    event.target.value = "";

    if (!files.length) {
      return;
    }

    const validation = validateResumeFiles(files);

    if (!validation.valid) {
      flash(validation.message ?? "Upload could not be accepted.");
      return;
    }

    try {
      setIsParsing(true);
      const parsed = await parseResumeFiles(files);
      setParsedFiles(parsed);
      setResumeText(parsed.map((file) => file.text).join("\n\n"));
      flash(`${parsed.length} file${parsed.length === 1 ? "" : "s"} parsed locally.`);
    } catch {
      flash("Could not parse that file. Try PDF, DOCX, TXT, or paste text.");
    } finally {
      setIsParsing(false);
    }
  }

  async function refactor() {
    if (!resumeText.trim() || !jobDescription.trim()) {
      flash("Add resume text and a job description first.");
      return;
    }

    const payload = {
      resumeText,
      jobDescription,
      requiredSkills: splitSkills(requiredSkills),
    };
    setStatus("loading");
    setResult(refactorResumeLocally(payload));

    try {
      const response = await fetch("/api/ai/refactor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = (await response.json()) as {
        configured?: boolean;
        result?: RefactorResult;
        error?: string;
      };

      if (!response.ok || !data.result) {
        setStatus("error");
        flash("Refactor failed. Local draft is still available.");
        return;
      }

      setResult(data.result);
      setStatus("ready");
      flash(data.configured === false ? "Local refactor draft created." : "AI-assisted refactor draft created.");
    } catch {
      setStatus("error");
      flash("Refactor failed. Local draft is still available.");
    }
  }

  function applyToPreview() {
    if (!result?.previewResume) {
      flash("Create a refactor draft first.");
      return;
    }

    setResume(result.previewResume);
    flash("Refactored draft sent to preview.");
  }

  function reset() {
    setResumeText("");
    setJobDescription("");
    setRequiredSkills("");
    setParsedFiles([]);
    setResult(null);
    setStatus("idle");
    flash("Refactor data cleared from this session.");
  }

  return (
    <>
      <NotificationPill message={notice} tone={status === "error" ? "error" : "info"} />
      <div className="grid gap-6 lg:grid-cols-[420px_1fr]">
        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-soft">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-owl-700">Phase 5</p>
            <h1 className="mt-1 text-2xl font-semibold text-ink">Resume Refactor</h1>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Rewrite a resume for a job description without adding unsupported experience or fake skills.
            </p>
          </div>

          <div className="mt-5 space-y-4">
            <label className="block text-sm font-medium text-slate-700">
              Existing resume
              <span className="mt-1 flex cursor-pointer items-center justify-center gap-2 rounded-md border border-dashed border-slate-300 px-4 py-5 text-sm text-slate-600 transition hover:border-owl-600 hover:bg-owl-50">
                <FileUp className="h-5 w-5" aria-hidden="true" />
                {isParsing ? "Parsing locally..." : "Upload PDF, DOCX, or TXT"}
                <input
                  className="sr-only"
                  type="file"
                  multiple
                  accept=".pdf,.docx,.txt,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
                  onChange={handleFiles}
                />
              </span>
              <span className="mt-1 block text-xs text-slate-500">{uploadHelpText()}</span>
            </label>

            {parsedFiles.length ? (
              <div className="rounded-md bg-slate-50 p-3 text-xs text-slate-600">
                {parsedFiles.map((file) => (
                  <p key={file.name}>
                    {file.name} - {file.type.toUpperCase()} - {file.text.length} chars
                  </p>
                ))}
              </div>
            ) : null}

            <TextArea label="Resume text" value={resumeText} onChange={setResumeText} placeholder="Paste resume text here." />
            <TextArea label="Job description" value={jobDescription} onChange={setJobDescription} placeholder="Paste target job description." />
            <TextArea label="Required skills" value={requiredSkills} onChange={setRequiredSkills} placeholder="Optional: React, TypeScript, SQL" small />

            <div className="grid grid-cols-[1fr_auto] gap-2">
              <button
                type="button"
                className="inline-flex items-center justify-center gap-2 rounded-md bg-owl-700 px-4 py-2 text-sm font-semibold text-white hover:bg-owl-900 disabled:cursor-not-allowed disabled:opacity-50"
                disabled={isParsing || status === "loading"}
                onClick={refactor}
              >
                <Sparkles className="h-4 w-4" />
                {status === "loading" ? "Refactoring..." : "Create refactor draft"}
              </button>
              <button
                type="button"
                className="inline-flex items-center justify-center rounded-md border border-slate-300 px-3 py-2 text-slate-700 hover:bg-slate-50"
                aria-label="Clear refactor data"
                onClick={reset}
              >
                <RotateCcw className="h-4 w-4" />
              </button>
            </div>
          </div>
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-soft">
          {result ? (
            <RefactorResultPanel
              result={result}
              onApply={applyToPreview}
              onTextChange={(value) =>
                setResult((current) =>
                  current ? { ...current, refactoredResumeText: value } : current,
                )
              }
              status={status}
            />
          ) : (
            <EmptyState />
          )}
        </section>
      </div>
    </>
  );
}

function TextArea({
  label,
  value,
  onChange,
  placeholder,
  small = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  small?: boolean;
}) {
  return (
    <label className="block text-sm font-medium text-slate-700">
      {label}
      <textarea
        className={`mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-owl-600 focus:ring-2 focus:ring-owl-100 ${small ? "min-h-20" : "min-h-36"}`}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
      />
    </label>
  );
}

function EmptyState() {
  return (
    <div className="flex min-h-[520px] items-center justify-center rounded-md border border-dashed border-slate-300 p-6 text-center">
      <div>
        <Sparkles className="mx-auto h-9 w-9 text-slate-400" aria-hidden="true" />
        <h2 className="mt-4 text-xl font-semibold text-ink">No refactor draft yet</h2>
        <p className="mt-2 max-w-md text-sm leading-6 text-slate-600">
          Add a resume and job description to create an editable ATS-friendly draft. If no API key is configured, ResumeOwl uses the local no-fabrication fallback.
        </p>
      </div>
    </div>
  );
}

function RefactorResultPanel({
  result,
  onApply,
  onTextChange,
  status,
}: {
  result: RefactorResult;
  onApply: () => void;
  onTextChange: (value: string) => void;
  status: "idle" | "loading" | "ready" | "error";
}) {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 border-b border-slate-200 pb-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-owl-700">Refactored draft</p>
          <h2 className="mt-1 text-2xl font-semibold text-ink">
            {status === "loading" ? "Local draft ready, checking AI..." : "Editable output"}
          </h2>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-md bg-owl-700 px-4 py-2 text-sm font-semibold text-white hover:bg-owl-900"
            onClick={onApply}
          >
            <Eye className="h-4 w-4" />
            Send to preview
          </button>
          <Link href="/preview" className="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
            Open preview
          </Link>
        </div>
      </div>

      <textarea
        className="min-h-80 w-full rounded-md border border-slate-300 bg-slate-50 px-4 py-3 font-mono text-sm leading-6 text-slate-800 outline-none focus:border-owl-600 focus:ring-2 focus:ring-owl-100"
        value={result.refactoredResumeText}
        onChange={(event) => onTextChange(event.target.value)}
        aria-label="Refactored resume text"
      />

      <ResultBlock title="Updated skills">
        <PillList items={result.updatedSkills} emptyText="No supported skills were detected yet." />
      </ResultBlock>

      <ResultBlock title="Improved bullets">
        {result.improvedBullets.length ? (
          <div className="space-y-3">
            {result.improvedBullets.map((bullet) => (
              <div key={`${bullet.before}-${bullet.after}`} className="rounded-md border border-slate-200 p-3">
                <p className="text-xs font-semibold uppercase text-slate-500">Before</p>
                <p className="mt-1 text-sm text-slate-700">{bullet.before}</p>
                <p className="mt-3 text-xs font-semibold uppercase text-owl-700">After</p>
                <p className="mt-1 text-sm text-slate-900">{bullet.after}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-slate-600">No existing bullets were found to rewrite.</p>
        )}
      </ResultBlock>

      <ResultBlock title="What improved">
        <ul className="list-disc space-y-2 pl-5 text-sm leading-6 text-slate-700">
          {result.improvementExplanation.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </ResultBlock>

      <ResultBlock title="ATS notes">
        <ul className="list-disc space-y-2 pl-5 text-sm leading-6 text-slate-700">
          {result.atsNotes.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </ResultBlock>
    </div>
  );
}

function ResultBlock({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">{title}</h3>
      <div className="mt-3">{children}</div>
    </div>
  );
}

function PillList({ items, emptyText }: { items: string[]; emptyText: string }) {
  if (!items.length) {
    return <p className="text-sm text-slate-600">{emptyText}</p>;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item) => (
        <span key={item} className="rounded-full bg-owl-50 px-3 py-1 text-xs font-semibold text-owl-900">
          {item}
        </span>
      ))}
    </div>
  );
}
