"use client";

import { ArrowDown, ArrowUp, Copy, Download, FileDown, Printer, RotateCcw, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { downloadBlob, downloadTextFile, safeFileName } from "@/lib/export/filenames";
import { normalizeExternalUrl } from "@/lib/maker/bullets";
import { createLatexStyleSource } from "@/lib/resume/source";
import { formatResumeDateRange } from "@/lib/resume/dates";
import { cn } from "@/lib/utils";
import { useResumeStore } from "@/stores/resume-store";
import type { ResumeDocument, ResumeSectionId } from "@/types/resume";

const sectionLabels: Record<ResumeSectionId, string> = {
  education: "Education",
  skills: "Skills",
  projects: "Projects",
  experience: "Experience",
  optional: "Additional",
};

function SectionControls({
  sectionId,
  index,
  total,
  onMove,
  onRemove,
}: {
  sectionId: ResumeSectionId;
  index: number;
  total: number;
  onMove: (sectionId: ResumeSectionId, direction: "up" | "down") => void;
  onRemove: (sectionId: ResumeSectionId) => void;
}) {
  return (
    <div className="no-print absolute right-0 top-0 flex translate-y-[-50%] gap-1 rounded-full border border-slate-200 bg-white p-1 shadow-sm">
      <button
        type="button"
        className="rounded-full p-1.5 text-slate-500 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
        aria-label={`Move ${sectionLabels[sectionId]} up`}
        disabled={index === 0}
        onClick={() => onMove(sectionId, "up")}
      >
        <ArrowUp className="h-4 w-4" />
      </button>
      <button
        type="button"
        className="rounded-full p-1.5 text-slate-500 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
        aria-label={`Move ${sectionLabels[sectionId]} down`}
        disabled={index === total - 1}
        onClick={() => onMove(sectionId, "down")}
      >
        <ArrowDown className="h-4 w-4" />
      </button>
      <button
        type="button"
        className="rounded-full p-1.5 text-slate-500 hover:bg-red-50 hover:text-red-700"
        aria-label={`Remove ${sectionLabels[sectionId]}`}
        onClick={() => onRemove(sectionId)}
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );
}

export function ResumePreview() {
  const [copyStatus, setCopyStatus] = useState("");
  const { resume, updatePersonal, updateSummary, setSectionOrder, reset } =
    useResumeStore();

  const source = useMemo(() => createLatexStyleSource(resume), [resume]);
  const visibleSectionOrder = resume.sectionOrder.filter((sectionId) => sectionHasContent(sectionId, resume));

  function moveSection(sectionId: ResumeSectionId, direction: "up" | "down") {
    const currentIndex = resume.sectionOrder.indexOf(sectionId);
    const targetIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;

    if (currentIndex === -1 || targetIndex < 0 || targetIndex >= resume.sectionOrder.length) {
      return;
    }

    const nextOrder = [...resume.sectionOrder];
    [nextOrder[currentIndex], nextOrder[targetIndex]] = [
      nextOrder[targetIndex],
      nextOrder[currentIndex],
    ];
    setSectionOrder(nextOrder);
  }

  function removeSection(sectionId: ResumeSectionId) {
    setSectionOrder(resume.sectionOrder.filter((id) => id !== sectionId));
  }

  async function copySource() {
    await navigator.clipboard.writeText(source);
    setCopyStatus("Source copied");
    window.setTimeout(() => setCopyStatus(""), 1800);
  }

  function printResume() {
    const previousTitle = document.title;
    document.title = safeFileName(resume.personal.fullName);
    window.print();
    window.setTimeout(() => {
      document.title = previousTitle;
    }, 500);
  }

  function sourceFileName(extension: "tex" | "docx") {
    return `${safeFileName(resume.personal.fullName)}.${extension}`;
  }

  function downloadSource() {
    downloadTextFile(source, sourceFileName("tex"), "application/x-tex");
    setCopyStatus("Source downloaded");
    window.setTimeout(() => setCopyStatus(""), 1800);
  }

  async function downloadDocx() {
    const { createDocxBlob } = await import("@/lib/export/docx");
    const blob = await createDocxBlob(resume);
    downloadBlob(blob, sourceFileName("docx"));
    setCopyStatus("DOCX downloaded");
    window.setTimeout(() => setCopyStatus(""), 1800);
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[340px_1fr]">
      <aside className="no-print h-fit rounded-lg border border-slate-200 bg-white p-5 shadow-soft">
        <div className="space-y-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-owl-700">
              Phase 1 Preview
            </p>
            <h1 className="mt-1 text-2xl font-semibold text-ink">
              Resume editor
            </h1>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Edit your resume, reorder sections, copy LaTeX-style source, or print to PDF.
            </p>
          </div>

          <label className="block text-sm font-medium text-slate-700">
            Full name
            <input
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-owl-600 focus:ring-2 focus:ring-owl-100"
              value={resume.personal.fullName}
              onChange={(event) => updatePersonal("fullName", event.target.value)}
            />
          </label>

          <label className="block text-sm font-medium text-slate-700">
            Title
            <input
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-owl-600 focus:ring-2 focus:ring-owl-100"
              value={resume.personal.title ?? ""}
              onChange={(event) => updatePersonal("title", event.target.value)}
            />
          </label>

          <label className="block text-sm font-medium text-slate-700">
            Summary
            <textarea
              className="mt-1 min-h-28 w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-owl-600 focus:ring-2 focus:ring-owl-100"
              value={resume.summary ?? ""}
              onChange={(event) => updateSummary(event.target.value)}
            />
          </label>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              className="inline-flex items-center justify-center gap-2 rounded-md bg-owl-700 px-3 py-2 text-sm font-semibold text-white transition hover:bg-owl-900"
              onClick={printResume}
            >
              <Printer className="h-4 w-4" />
              PDF
            </button>
            <button
              type="button"
              className="inline-flex items-center justify-center gap-2 rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              onClick={copySource}
            >
              <Copy className="h-4 w-4" />
              Source
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              className="inline-flex items-center justify-center gap-2 rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              onClick={downloadDocx}
            >
              <FileDown className="h-4 w-4" />
              DOCX
            </button>
            <button
              type="button"
              className="inline-flex items-center justify-center gap-2 rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              onClick={downloadSource}
            >
              <Download className="h-4 w-4" />
              LaTeX Code
            </button>
          </div>

          <button
            type="button"
            className="inline-flex w-full items-center justify-center gap-2 rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            onClick={reset}
          >
            <RotateCcw className="h-4 w-4" />
            Clear current edits
          </button>

          {copyStatus ? (
            <p className="rounded-full bg-owl-50 px-3 py-2 text-center text-sm font-medium text-owl-900">
              {copyStatus}
            </p>
          ) : null}
        </div>
      </aside>

      <article className="resume-page mx-auto min-h-[1000px] w-full max-w-[850px] bg-white px-8 py-10 shadow-soft sm:px-12 print:min-h-0 print:max-w-none print:shadow-none">
        <header className="pb-4 text-center">
          <input
            aria-label="Resume full name"
            className="w-full bg-transparent text-center text-3xl font-bold uppercase tracking-normal text-ink outline-none"
            value={resume.personal.fullName}
            onChange={(event) => updatePersonal("fullName", event.target.value)}
          />
          <input
            aria-label="Resume title"
            className="mt-1 w-full bg-transparent text-center text-sm font-medium text-slate-700 outline-none"
            value={resume.personal.title ?? ""}
            onChange={(event) => updatePersonal("title", event.target.value)}
          />
          <p className="mt-2 text-xs text-slate-600">
            {[
              resume.personal.email,
              resume.personal.phone,
              resume.personal.location,
              resume.personal.github,
              resume.personal.linkedin,
              resume.personal.portfolio,
            ]
              .filter(Boolean)
              .join(" | ")}
          </p>
        </header>

        {resume.summary?.trim() ? (
          <section className="relative mt-5 pt-3">
            <div className="no-print absolute right-0 top-0 flex translate-y-[-50%] gap-1 rounded-full border border-slate-200 bg-white p-1 shadow-sm">
              <button
                type="button"
                className="rounded-full p-1.5 text-slate-500 hover:bg-red-50 hover:text-red-700"
                aria-label="Remove Summary"
                onClick={() => updateSummary("")}
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
            <h2 className="resume-heading">Summary</h2>
            <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-800">
              {resume.summary}
            </p>
          </section>
        ) : null}

        <div className="mt-2 space-y-5">
          {visibleSectionOrder.map((sectionId, index) => (
            <section key={sectionId} className="relative pt-3">
              <SectionControls
                sectionId={sectionId}
                index={index}
                total={visibleSectionOrder.length}
                onMove={moveSection}
                onRemove={removeSection}
              />
              <h2 className="resume-heading">{sectionLabels[sectionId]}</h2>
              <ResumeSection sectionId={sectionId} />
            </section>
          ))}
        </div>
      </article>
    </div>
  );
}

function sectionHasContent(sectionId: ResumeSectionId, resume: ResumeDocument) {
  if (sectionId === "education") {
    return resume.education.length > 0 || resume.courses.length > 0;
  }

  if (sectionId === "skills") {
    return resume.skillGroups.some((group) => group.skills.length > 0);
  }

  if (sectionId === "projects") {
    return resume.projects.length > 0;
  }

  if (sectionId === "experience") {
    return resume.experience.length > 0;
  }

  return resume.optionalSections.some((section) => section.items.some((item) => item.trim()));
}

function ResumeSection({ sectionId }: { sectionId: ResumeSectionId }) {
  const resume = useResumeStore((state) => state.resume);

  if (sectionId === "education") {
    return (
      <div className="mt-2 space-y-3">
        {resume.education.map((item) => (
          <div key={item.id}>
            <div className="flex flex-wrap justify-between gap-2 text-sm">
              <strong>{item.institute}</strong>
              <span className="text-slate-600">
                {formatResumeDateRange(item.startDate, item.endDate)}
              </span>
            </div>
            <p className="text-sm text-slate-700">
              {item.degree}
              {item.cgpa ? `, CGPA ${item.cgpa}` : ""}
            </p>
            {item.details?.length ? <BulletList items={item.details} /> : null}
          </div>
        ))}
        {resume.courses.length ? (
          <p className="text-sm text-slate-700">
            <strong>Relevant Courses:</strong> {resume.courses.join(", ")}
          </p>
        ) : null}
      </div>
    );
  }

  if (sectionId === "skills") {
    return (
      <div className="mt-2 space-y-1 text-sm">
        {resume.skillGroups.map((group) => (
          <p key={group.id}>
            <strong>{group.name}:</strong> {group.skills.join(", ")}
          </p>
        ))}
      </div>
    );
  }

  if (sectionId === "projects") {
    return (
      <div className="mt-2 space-y-3">
        {resume.projects.map((project) => (
          <div key={project.id}>
            <div className="flex flex-wrap items-baseline justify-between gap-2 text-sm">
              <strong className="inline-flex flex-wrap items-baseline gap-1">
                {project.name}
                {project.link ? (
                  <a
                    className="text-xs font-medium italic text-slate-500 underline"
                    href={normalizeExternalUrl(project.link)}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {project.linkLabel || "Link"}
                  </a>
                ) : null}
              </strong>
              <span className="text-xs text-slate-600">{project.techStack?.join(", ")}</span>
            </div>
            <BulletList items={project.bullets} />
          </div>
        ))}
      </div>
    );
  }

  if (sectionId === "experience") {
    return (
      <div className="mt-2 space-y-3">
        {resume.experience.map((item) => (
          <div key={item.id}>
            <div className="flex flex-wrap justify-between gap-2 text-sm">
              <strong>
                {item.role}, {item.company}
              </strong>
              <span className="text-slate-600">
                {formatResumeDateRange(item.startDate, item.endDate)}
              </span>
            </div>
            <BulletList items={item.bullets} />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="mt-2 space-y-3">
      {resume.optionalSections.map((section) => (
        <div key={section.id}>
          <h3 className="text-sm font-semibold text-slate-800">{section.title}</h3>
          <BulletList items={section.items} />
        </div>
      ))}
    </div>
  );
}

function BulletList({ items }: { items: string[] }) {
  return (
    <ul className="mt-1 list-disc space-y-1 pl-5 text-sm leading-6 text-slate-800">
      {items.map((item) => (
        <li key={item} className={cn("break-words")}>
          <InlineStrong text={item} />
        </li>
      ))}
    </ul>
  );
}

function InlineStrong({ text }: { text: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);

  return (
    <>
      {parts.map((part, index) =>
        part.startsWith("**") && part.endsWith("**") ? (
          <strong key={`${part}-${index}`}>{part.slice(2, -2)}</strong>
        ) : (
          <span key={`${part}-${index}`}>{part}</span>
        ),
      )}
    </>
  );
}
