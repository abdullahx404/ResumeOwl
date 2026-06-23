"use client";

import { ArrowDown, ArrowUp, Copy, Download, Edit3, FileDown, Printer, RotateCcw, Save, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { downloadBlob, downloadTextFile, safeFileName } from "@/lib/export/filenames";
import { createPrintableResumeHtml } from "@/lib/export/print-html";
import { normalizeExternalUrl } from "@/lib/maker/bullets";
import { formatAcademicScore, sanitizeAcademicScoreInput } from "@/lib/resume/academic-score";
import { resumeContactItems } from "@/lib/resume/contact";
import { createLatexStyleSource } from "@/lib/resume/source";
import { formatResumeDateRange } from "@/lib/resume/dates";
import { cn } from "@/lib/utils";
import { useResumeStore } from "@/stores/resume-store";
import type { EducationEntry, ExperienceEntry, OptionalSection, ProjectEntry, ResumeDocument, ResumeSectionId, SkillGroup } from "@/types/resume";

const sectionLabels: Record<ResumeSectionId, string> = {
  education: "Education",
  skills: "Skills",
  projects: "Projects",
  experience: "Experience",
  optional: "Optional sections",
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
  const [isEditingSections, setIsEditingSections] = useState(false);
  const { resume, setResume, updatePersonal, updateSummary, setSectionOrder, reset } =
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
    const frame = document.createElement("iframe");
    frame.style.position = "fixed";
    frame.style.right = "0";
    frame.style.bottom = "0";
    frame.style.width = "0";
    frame.style.height = "0";
    frame.style.border = "0";
    frame.title = "Printable resume";
    document.body.appendChild(frame);

    const frameWindow = frame.contentWindow;
    const frameDocument = frame.contentDocument;

    if (!frameWindow || !frameDocument) {
      document.body.removeChild(frame);
      return;
    }

    frameDocument.open();
    frameDocument.write(createPrintableResumeHtml(resume));
    frameDocument.close();

    frameWindow.focus();
    frameWindow.setTimeout(() => {
      frameWindow.print();
      frameWindow.setTimeout(() => {
        frame.remove();
      }, 1000);
    }, 100);
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
            <h1 className="text-2xl font-semibold text-ink">
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
            Summary <span className="font-normal text-slate-400">(optional)</span>
            <textarea
              className="mt-1 min-h-28 w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-owl-600 focus:ring-2 focus:ring-owl-100"
              value={resume.summary ?? ""}
              onChange={(event) => updateSummary(event.target.value)}
            />
          </label>

          <button
            type="button"
            className={cn(
              "inline-flex w-full items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-semibold transition",
              isEditingSections
                ? "bg-owl-700 text-white hover:bg-owl-900"
                : "border border-slate-300 text-slate-700 hover:bg-slate-50",
            )}
            onClick={() => setIsEditingSections((current) => !current)}
          >
            {isEditingSections ? <Save className="h-4 w-4" /> : <Edit3 className="h-4 w-4" />}
            {isEditingSections ? "Done Editing Resume" : "Edit Resume"}
          </button>

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
          <div className="print-only">
            <h1 className="text-3xl font-bold uppercase tracking-normal text-ink">
              {resume.personal.fullName}
            </h1>
            {resume.personal.title ? (
              <p className="mt-1 text-sm font-medium text-slate-700">{resume.personal.title}</p>
            ) : null}
          </div>
          <input
            aria-label="Resume full name"
            className="no-print w-full bg-transparent text-center text-3xl font-bold uppercase tracking-normal text-ink outline-none"
            value={resume.personal.fullName}
            onChange={(event) => updatePersonal("fullName", event.target.value)}
          />
          <input
            aria-label="Resume title"
            className="no-print mt-1 w-full bg-transparent text-center text-sm font-medium text-slate-700 outline-none"
            value={resume.personal.title ?? ""}
            onChange={(event) => updatePersonal("title", event.target.value)}
          />
          <p className="mt-2 text-xs text-slate-600">
            {resumeContactItems(resume.personal).map((item, index) => (
              <span key={item.key}>
                {index > 0 ? " | " : ""}
                {item.href ? (
                  <a className="underline-offset-2 hover:underline" href={item.href} target="_blank" rel="noreferrer">
                    {item.label}
                  </a>
                ) : (
                  item.label
                )}
              </span>
            ))}
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
              {sectionId === "optional" ? null : (
                <h2 className="resume-heading">{sectionLabels[sectionId]}</h2>
              )}
              <ResumeSection sectionId={sectionId} editing={isEditingSections} resume={resume} setResume={setResume} />
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

function ResumeSection({
  sectionId,
  editing,
  resume,
  setResume,
}: {
  sectionId: ResumeSectionId;
  editing: boolean;
  resume: ResumeDocument;
  setResume: (resume: ResumeDocument) => void;
}) {
  function updateEducation(id: string, patch: Partial<EducationEntry>) {
    setResume({ ...resume, education: resume.education.map((item) => (item.id === id ? { ...item, ...patch } : item)) });
  }

  function updateSkillGroup(id: string, patch: Partial<SkillGroup>) {
    setResume({ ...resume, skillGroups: resume.skillGroups.map((item) => (item.id === id ? { ...item, ...patch } : item)) });
  }

  function updateProject(id: string, patch: Partial<ProjectEntry>) {
    setResume({ ...resume, projects: resume.projects.map((item) => (item.id === id ? { ...item, ...patch } : item)) });
  }

  function updateExperience(id: string, patch: Partial<ExperienceEntry>) {
    setResume({ ...resume, experience: resume.experience.map((item) => (item.id === id ? { ...item, ...patch } : item)) });
  }

  function updateOptionalSection(id: string, patch: Partial<OptionalSection>) {
    setResume({ ...resume, optionalSections: resume.optionalSections.map((item) => (item.id === id ? { ...item, ...patch } : item)) });
  }

  if (sectionId === "education") {
    return (
      <div className="mt-2 space-y-3">
        {resume.education.map((item) => (
          <div key={item.id}>
            {editing ? (
              <EditGrid>
                <EditInput label="Institute" value={item.institute} onChange={(value) => updateEducation(item.id, { institute: value })} />
                <EditInput label="Degree/Program" value={item.degree} onChange={(value) => updateEducation(item.id, { degree: value })} />
                <EditInput type="month" label="Intake Month/Year" value={item.startDate ?? ""} onChange={(value) => updateEducation(item.id, { startDate: value })} />
                <EditInput type="month" label="Graduation Month/Year" value={item.endDate ?? ""} onChange={(value) => updateEducation(item.id, { endDate: value })} />
                <EditInput label="CGPA/Percentage" value={item.cgpa ?? ""} onChange={(value) => {
                  const next = sanitizeAcademicScoreInput(value);
                  updateEducation(item.id, { cgpa: next || (value ? item.cgpa : "") });
                }} />
              </EditGrid>
            ) : null}
            <div className="flex flex-wrap justify-between gap-2 text-sm">
              <strong>{item.institute}</strong>
              <span className="text-slate-600">
                {formatResumeDateRange(item.startDate, item.endDate)}
              </span>
            </div>
            <p className="text-sm text-slate-700">
              {item.degree}
              {item.cgpa ? `, ${formatAcademicScore(item.cgpa)}` : ""}
            </p>
            {item.details?.length ? <BulletList items={item.details} /> : null}
          </div>
        ))}
        {resume.courses.length ? (
          editing ? (
            <EditTextarea label="Relevant Courses" value={resume.courses.join(", ")} onChange={(value) => setResume({ ...resume, courses: splitEditableList(value) })} />
          ) : (
            <p className="text-sm text-slate-700">
              <strong>Relevant Courses:</strong> {resume.courses.join(", ")}
            </p>
          )
        ) : null}
      </div>
    );
  }

  if (sectionId === "skills") {
    return (
      <div className="mt-2 space-y-1 text-sm">
        {resume.skillGroups.map((group) => (
          editing ? (
            <div key={group.id} className="rounded-md border border-slate-200 p-2">
              <EditInput label="Group" value={group.name} onChange={(value) => updateSkillGroup(group.id, { name: value })} />
              <EditTextarea label="Skills" value={group.skills.join(", ")} onChange={(value) => updateSkillGroup(group.id, { skills: splitEditableList(value) })} />
            </div>
          ) : (
            <p key={group.id}>
              <strong>{group.name}:</strong> {group.skills.join(", ")}
            </p>
          )
        ))}
      </div>
    );
  }

  if (sectionId === "projects") {
    return (
      <div className="mt-2 space-y-3">
        {resume.projects.map((project) => (
          <div key={project.id}>
            {editing ? (
              <EditGrid>
                <EditInput label="Project Name" value={project.name} onChange={(value) => updateProject(project.id, { name: value })} />
                <EditInput label="Link Name" value={project.linkLabel ?? ""} onChange={(value) => updateProject(project.id, { linkLabel: value })} />
                <EditInput label="Link Address" value={project.link ?? ""} onChange={(value) => updateProject(project.id, { link: value })} />
                <EditInput label="Tech Stack" value={project.techStack?.join(", ") ?? ""} onChange={(value) => updateProject(project.id, { techStack: splitEditableList(value) })} />
                <EditTextarea label="Bullets" value={project.bullets.join("\n")} onChange={(value) => updateProject(project.id, { bullets: splitEditableLines(value) })} />
              </EditGrid>
            ) : null}
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
            {editing ? (
              <EditGrid>
                <EditInput label="Role" value={item.role} onChange={(value) => updateExperience(item.id, { role: value })} />
                <EditInput label="Company" value={item.company} onChange={(value) => updateExperience(item.id, { company: value })} />
                <EditInput type="month" label="Start Month/Year" value={item.startDate ?? ""} onChange={(value) => updateExperience(item.id, { startDate: value })} />
                <EditInput type="month" label="End Month/Year" value={item.endDate ?? ""} onChange={(value) => updateExperience(item.id, { endDate: value })} />
                <EditTextarea label="Bullets" value={item.bullets.join("\n")} onChange={(value) => updateExperience(item.id, { bullets: splitEditableLines(value) })} />
              </EditGrid>
            ) : null}
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
        <div key={section.id} className="pt-1">
          {editing ? (
            <div className="mb-2 rounded-md border border-slate-200 p-2">
              <EditInput label="Section Title" value={section.title} onChange={(value) => updateOptionalSection(section.id, { title: value })} />
              <EditTextarea label="Bullets" value={section.items.join("\n")} onChange={(value) => updateOptionalSection(section.id, { items: splitEditableLines(value) })} />
            </div>
          ) : null}
          <h2 className="resume-heading">{section.title}</h2>
          <BulletList items={section.items} />
        </div>
      ))}
    </div>
  );
}

function splitEditableList(value: string) {
  return value.split(/[,;\n]/).map((item) => item.trim()).filter(Boolean);
}

function splitEditableLines(value: string) {
  return value.split("\n").map((item) => item.replace(/^[-*•]\s*/, "").trim()).filter(Boolean);
}

function EditGrid({ children }: { children: React.ReactNode }) {
  return <div className="no-print mb-3 grid gap-2 rounded-md border border-owl-100 bg-owl-50/40 p-2 md:grid-cols-2">{children}</div>;
}

function EditInput({ label, value, onChange, type = "text" }: { label: string; value: string; onChange: (value: string) => void; type?: string }) {
  return (
    <label className="block text-xs font-semibold text-slate-600">
      {label}
      <input
        type={type}
        className="mt-1 w-full rounded-md border border-slate-300 bg-white px-2 py-1.5 text-sm text-slate-800 outline-none focus:border-owl-600 focus:ring-2 focus:ring-owl-100"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}

function EditTextarea({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="block text-xs font-semibold text-slate-600 md:col-span-2">
      {label}
      <textarea
        className="mt-1 min-h-20 w-full rounded-md border border-slate-300 bg-white px-2 py-1.5 text-sm text-slate-800 outline-none focus:border-owl-600 focus:ring-2 focus:ring-owl-100"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
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
