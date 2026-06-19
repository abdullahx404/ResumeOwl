"use client";

import { ChangeEvent, useMemo, useState } from "react";
import { FileUp, Loader2, RotateCcw, SearchCheck } from "lucide-react";
import { analyzeResumeLocally } from "@/lib/ats/analyzer";
import { uploadHelpText, validateResumeFiles } from "@/lib/parsing/file-validation";
import { parseResumeFiles } from "@/lib/parsing/resume-parser";
import { NotificationPill } from "@/components/ui/NotificationPill";
import type { AiAnalyzerFeedback } from "@/lib/validation/analyzer";
import type { AnalysisResult, ParsedResumeFile } from "@/types/resume";

function splitSkills(value: string): string[] {
  return value
    .split(/[,;\n]/)
    .map((skill) => skill.trim())
    .filter(Boolean);
}

export function AnalyzerWorkspace() {
  const [resumeText, setResumeText] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [requiredSkills, setRequiredSkills] = useState("");
  const [parsedFiles, setParsedFiles] = useState<ParsedResumeFile[]>([]);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [aiFeedback, setAiFeedback] = useState<AiAnalyzerFeedback | null>(null);
  const [aiStatus, setAiStatus] = useState<
    "idle" | "loading" | "ready" | "unavailable" | "error"
  >("idle");
  const [notice, setNotice] = useState("");
  const [aiError, setAiError] = useState("");
  const [isParsing, setIsParsing] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const canAnalyze = useMemo(
    () => resumeText.trim().length > 0 && jobDescription.trim().length > 0,
    [resumeText, jobDescription],
  );

  async function handleFiles(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    event.target.value = "";

    if (!files.length) {
      return;
    }

    const validation = validateResumeFiles(files);

    if (!validation.valid) {
      setNotice(validation.message ?? "Upload could not be accepted.");
      window.setTimeout(() => setNotice(""), 2400);
      return;
    }

    try {
      setIsParsing(true);
      const parsed = await parseResumeFiles(files);
      setParsedFiles(parsed);
      setResumeText(parsed.map((file) => file.text).join("\n\n"));
      setNotice(`${parsed.length} file${parsed.length === 1 ? "" : "s"} parsed locally.`);
      window.setTimeout(() => setNotice(""), 2400);
    } catch {
      setNotice("Could not parse that file. Try PDF, DOCX, TXT, or paste text.");
      window.setTimeout(() => setNotice(""), 2800);
    } finally {
      setIsParsing(false);
    }
  }

  async function analyze() {
    if (!canAnalyze) {
      setNotice("Add resume text and a job description first.");
      window.setTimeout(() => setNotice(""), 2400);
      return;
    }

    const skills = splitSkills(requiredSkills);
    setIsAnalyzing(true);
    const localResult = analyzeResumeLocally({
      resumeText,
      jobDescription,
      requiredSkills: skills,
    });
    setResult(localResult);
    setAiFeedback(null);
    setAiError("");
    setAiStatus("loading");

    try {
      const response = await fetch("/api/ai/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          resumeText,
          jobDescription,
          requiredSkills: skills,
        }),
      });
      const data = (await response.json()) as {
        configured?: boolean;
        feedback?: AiAnalyzerFeedback;
        error?: string;
      };

      if (!response.ok || !data.feedback) {
        setAiError(data.error ?? "");
        setAiStatus(data.configured === false ? "unavailable" : "error");
        return;
      }

      setAiFeedback(data.feedback);
      setAiStatus("ready");
    } catch {
      setAiError("AI feedback could not be reached. The local scan is still valid.");
      setAiStatus("error");
    } finally {
      setIsAnalyzing(false);
    }
  }

  function reset() {
    setResumeText("");
    setJobDescription("");
    setRequiredSkills("");
    setParsedFiles([]);
    setResult(null);
    setAiFeedback(null);
    setAiError("");
    setAiStatus("idle");
    setIsAnalyzing(false);
    setNotice("Analyzer data cleared from this session.");
    window.setTimeout(() => setNotice(""), 2400);
  }

  return (
    <>
      <NotificationPill message={notice} tone={notice.includes("Could not") ? "error" : "info"} />
      <div className="grid gap-6 lg:grid-cols-[420px_1fr]">
        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-soft">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-semibold text-ink">
                Local ATS scan
              </h1>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Upload or paste a resume, add a job description, and run a deterministic local scan.
              </p>
            </div>
            <SearchCheck className="h-7 w-7 text-owl-700" aria-hidden="true" />
          </div>

          <div className="mt-5 space-y-4">
            <label className="block text-sm font-medium text-slate-700">
              Resume files
              <span className="mt-1 flex cursor-pointer items-center justify-center gap-2 rounded-md border border-dashed border-slate-300 px-4 py-5 text-sm text-slate-600 transition hover:border-owl-600 hover:bg-owl-50">
                <FileUp className="h-5 w-5" aria-hidden="true" />
                {isParsing ? "Parsing..." : "Upload PDF, DOCX, or TXT"}
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

            <label className="block text-sm font-medium text-slate-700">
              Resume text
              <textarea
                className="mt-1 min-h-44 w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-owl-600 focus:ring-2 focus:ring-owl-100"
                value={resumeText}
                onChange={(event) => setResumeText(event.target.value)}
                placeholder="Paste resume text here if you do not upload a file."
              />
            </label>

            <label className="block text-sm font-medium text-slate-700">
              Job description
              <textarea
                className="mt-1 min-h-36 w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-owl-600 focus:ring-2 focus:ring-owl-100"
                value={jobDescription}
                onChange={(event) => setJobDescription(event.target.value)}
                placeholder="Paste the target job description."
              />
            </label>

            <label className="block text-sm font-medium text-slate-700">
              Required skills
              <textarea
                className="mt-1 min-h-20 w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-owl-600 focus:ring-2 focus:ring-owl-100"
                value={requiredSkills}
                onChange={(event) => setRequiredSkills(event.target.value)}
                placeholder="Optional: React, TypeScript, SQL"
              />
            </label>

            <div className="grid grid-cols-[1fr_auto] gap-2">
              <button
                type="button"
                className="rounded-md bg-owl-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-owl-900 disabled:cursor-not-allowed disabled:opacity-50"
                disabled={!canAnalyze || isParsing || isAnalyzing}
                onClick={analyze}
              >
                <span className="inline-flex items-center justify-center gap-2">
                  {isAnalyzing ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  {isAnalyzing ? "Analyzing..." : "Analyze Resume"}
                </span>
              </button>
              <button
                type="button"
                className="inline-flex items-center justify-center rounded-md border border-slate-300 px-3 py-2 text-slate-700 transition hover:bg-slate-50"
                aria-label="Clear analyzer data"
                onClick={reset}
              >
                <RotateCcw className="h-4 w-4" />
              </button>
            </div>
          </div>
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-soft">
          {result ? (
            <AnalysisResults
              result={result}
              aiFeedback={aiFeedback}
              aiError={aiError}
              aiStatus={aiStatus}
            />
          ) : (
            <EmptyResults />
          )}
        </section>
      </div>
    </>
  );
}

function EmptyResults() {
  return (
    <div className="flex min-h-[520px] items-center justify-center rounded-md border border-dashed border-slate-300 p-6 text-center">
      <div>
        <SearchCheck className="mx-auto h-9 w-9 text-slate-400" aria-hidden="true" />
        <h2 className="mt-4 text-xl font-semibold text-ink">No scan yet</h2>
        <p className="mt-2 max-w-md text-sm leading-6 text-slate-600">
          Results will show keyword coverage, required skill matches, ATS issues,
          weak bullets, and suggested improvements. AI feedback appears automatically when configured.
        </p>
      </div>
    </div>
  );
}

function AnalysisResults({
  result,
  aiFeedback,
  aiError,
  aiStatus,
}: {
  result: AnalysisResult;
  aiFeedback: AiAnalyzerFeedback | null;
  aiError: string;
  aiStatus: "idle" | "loading" | "ready" | "unavailable" | "error";
}) {
  const requiredSkillMatchedCount = result.requiredSkillMatches.filter((skill) => skill.present).length;
  const requiredSkillMissingCount = result.requiredSkillMatches.filter((skill) => !skill.present).length;
  const matchedCount = result.requiredSkillMatches.length
    ? requiredSkillMatchedCount
    : result.matchedKeywords.length;
  const missingCount = result.requiredSkillMatches.length
    ? requiredSkillMissingCount
    : result.missingKeywords.length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 border-b border-slate-200 pb-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-owl-700">
            Match score
          </p>
          <h2 className="mt-1 text-4xl font-semibold text-ink">{result.score}%</h2>
        </div>
        <div className="grid grid-cols-3 gap-2 text-center text-sm">
          <Metric label="Matched" value={matchedCount} />
          <Metric label="Missing" value={missingCount} />
          <Metric label="Weak bullets" value={result.weakBullets.length} />
        </div>
      </div>

      <ResultBlock title="Score breakdown">
        <div className="grid gap-2 text-sm sm:grid-cols-5">
          <Metric label="Keywords" value={`${result.scoreBreakdown.keywordCoverage}/35`} />
          <Metric label="Required" value={`${result.scoreBreakdown.requiredSkills}/25`} />
          <Metric label="Sections" value={`${result.scoreBreakdown.sections}/15`} />
          <Metric label="Contact" value={`${result.scoreBreakdown.contact}/15`} />
          <Metric label="Bullets" value={`${result.scoreBreakdown.bulletQuality}/10`} />
        </div>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          The local score is calculated from skill keyword coverage, required skill matches,
          common ATS sections, contact details, and bullet quality. Generic filler words from the
          job post are ignored so the score focuses on real skills, tools, courses, and qualifications.
        </p>
      </ResultBlock>

      <ResultBlock title="Missing keywords">
        <PillList
          items={result.missingKeywords.slice(0, 18)}
          emptyText="No important missing keywords found."
          tone="warning"
        />
      </ResultBlock>

      <ResultBlock title="Required skills">
        {result.requiredSkillMatches.length ? (
          <div className="flex flex-wrap gap-2">
            {result.requiredSkillMatches.map((skill) => (
              <span
                key={skill.keyword}
                className={
                  skill.present
                    ? "rounded-full bg-owl-50 px-3 py-1 text-xs font-semibold text-owl-900"
                    : "rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-950"
                }
              >
                {skill.present ? "Found" : "Missing"}: {skill.keyword}
              </span>
            ))}
          </div>
        ) : (
          <p className="text-sm text-slate-600">No required skills were provided.</p>
        )}
      </ResultBlock>

      <ResultBlock title="ATS readability issues">
        <div className="space-y-2">
          {result.atsIssues.map((issue) => (
            <div key={issue.id} className="rounded-md border border-slate-200 p-3">
              <p className="text-sm font-semibold text-ink">{issue.title}</p>
              <p className="mt-1 text-sm leading-6 text-slate-600">{issue.detail}</p>
            </div>
          ))}
        </div>
      </ResultBlock>

      <ResultBlock title="Weak bullet points">
        {result.weakBullets.length ? (
          <div className="space-y-3">
            {result.weakBullets.slice(0, 6).map((bullet) => (
              <div key={bullet.text} className="rounded-md bg-slate-50 p-3">
                <p className="text-sm text-slate-800">{bullet.text}</p>
                <ul className="mt-2 list-disc pl-5 text-xs leading-5 text-slate-600">
                  {bullet.issues.map((issue) => (
                    <li key={issue}>{issue}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-slate-600">No weak bullet points found.</p>
        )}
      </ResultBlock>

      <ResultBlock title="Suggested improvements">
        <ul className="list-disc space-y-2 pl-5 text-sm leading-6 text-slate-700">
          {result.suggestedImprovements.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </ResultBlock>

      <ResultBlock title="Before/after summary">
        <p className="text-sm leading-6 text-slate-700">{result.beforeAfterSummary}</p>
      </ResultBlock>

      <AiFeedbackPanel status={aiStatus} feedback={aiFeedback} error={aiError} />
    </div>
  );
}

function Metric({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-md bg-slate-50 px-4 py-3">
      <p className="text-lg font-semibold text-ink">{value}</p>
      <p className="text-xs text-slate-500">{label}</p>
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

function PillList({
  items,
  emptyText,
  tone,
}: {
  items: string[];
  emptyText: string;
  tone: "warning" | "success";
}) {
  if (!items.length) {
    return <p className="text-sm text-slate-600">{emptyText}</p>;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item) => (
        <span
          key={item}
          className={
            tone === "warning"
              ? "rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-950"
              : "rounded-full bg-owl-50 px-3 py-1 text-xs font-semibold text-owl-900"
          }
        >
          {item}
        </span>
      ))}
    </div>
  );
}

function AiFeedbackPanel({
  status,
  feedback,
  error,
}: {
  status: "idle" | "loading" | "ready" | "unavailable" | "error";
  feedback: AiAnalyzerFeedback | null;
  error: string;
}) {
  if (status === "idle") {
    return null;
  }

  if (status === "loading") {
    return (
      <div className="rounded-lg border border-blue-100 bg-blue-50 p-4">
        <p className="flex items-center gap-2 text-sm font-semibold text-blue-950">
          <Loader2 className="h-4 w-4 animate-spin" />
          Checking AI Feedback...
        </p>
        <p className="mt-1 text-sm leading-6 text-blue-900">
          Local ATS results are already available. AI feedback will appear if a provider key is configured.
        </p>
      </div>
    );
  }

  if (status === "unavailable") {
    return (
      <div className="rounded-lg border border-amber-100 bg-amber-50 p-4">
        <p className="text-sm font-semibold text-amber-950">AI Feedback Failed, Local Scan Validated</p>
        <p className="mt-1 text-sm leading-6 text-amber-900">
          AI feedback is not configured. Add `GEMINI_API_KEY`, `GROQ_API_KEY`, or `OPENROUTER_API_KEY` on the server to enable recruiter-style AI feedback.
        </p>
      </div>
    );
  }

  if (status === "error" || !feedback) {
    return (
      <div className="rounded-lg border border-red-100 bg-red-50 p-4">
        <p className="text-sm font-semibold text-red-950">AI Feedback Failed, Local Scan Validated</p>
        <p className="mt-1 text-sm leading-6 text-red-900">
          {error || "The local scan is still valid. Try again later or check the configured AI provider."}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4 rounded-lg border border-owl-100 bg-owl-50 p-4">
      <div>
        <p className="text-sm font-semibold uppercase tracking-wide text-owl-900">
          Recruiter-style AI feedback
        </p>
        <p className="mt-2 text-sm leading-6 text-owl-950">{feedback.recruiterFeedback}</p>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-owl-950">AI suggested improvements</h3>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm leading-6 text-owl-950">
          {feedback.suggestedImprovements.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </div>

      {feedback.rewrittenWeakBullets.length ? (
        <div>
          <h3 className="text-sm font-semibold text-owl-950">Before/after bullet rewrites</h3>
          <div className="mt-2 space-y-3">
            {feedback.rewrittenWeakBullets.map((bullet) => (
              <div key={`${bullet.before}-${bullet.after}`} className="rounded-md bg-white p-3">
                <p className="text-xs font-semibold uppercase text-slate-500">Before</p>
                <p className="mt-1 text-sm text-slate-700">{bullet.before}</p>
                <p className="mt-3 text-xs font-semibold uppercase text-owl-700">After</p>
                <p className="mt-1 text-sm text-slate-900">{bullet.after}</p>
                <p className="mt-2 text-xs leading-5 text-slate-600">{bullet.rationale}</p>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      <p className="text-sm leading-6 text-owl-950">{feedback.beforeAfterSummary}</p>

      {feedback.cautionNotes.length ? (
        <div className="rounded-md border border-amber-200 bg-amber-50 p-3">
          <h3 className="text-sm font-semibold text-amber-950">Verify before using</h3>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm leading-6 text-amber-950">
            {feedback.cautionNotes.map((note) => (
              <li key={note}>{note}</li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
