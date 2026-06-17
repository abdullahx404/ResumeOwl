"use client";

import Link from "next/link";
import { Eye, Plus, RotateCcw, Sparkles, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { NotificationPill } from "@/components/ui/NotificationPill";
import { generateLocalBullets, inferProjectName, inferTechStack, parseCommaList, textToBullets } from "@/lib/maker/bullets";
import { addUniqueValue, autoGroupSkills, commonCourses, commonSkills, filterOptions } from "@/lib/maker/options";
import { useResumeStore } from "@/stores/resume-store";
import type {
  EducationEntry,
  ExperienceEntry,
  OptionalSection,
  ProjectEntry,
  ResumeDocument,
  SkillGroup,
} from "@/types/resume";

type SkillMode = "manual" | "auto" | "none";

type ProjectDraft = {
  id: string;
  name: string;
  link: string;
  notes: string;
  techStack: string;
  bulletCount: number;
  bullets: string[];
};

type ExperienceDraft = {
  id: string;
  role: string;
  company: string;
  startDate: string;
  endDate: string;
  notes: string;
  bulletCount: number;
  bullets: string[];
};

function createId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function emptyEducation(): EducationEntry {
  return {
    id: createId("edu"),
    institute: "",
    degree: "",
    startDate: "",
    endDate: "",
    cgpa: "",
    details: [],
  };
}

function emptyProject(): ProjectDraft {
  return {
    id: createId("project"),
    name: "",
    link: "",
    notes: "",
    techStack: "",
    bulletCount: 3,
    bullets: [],
  };
}

function emptyExperience(): ExperienceDraft {
  return {
    id: createId("exp"),
    role: "",
    company: "",
    startDate: "",
    endDate: "",
    notes: "",
    bulletCount: 3,
    bullets: [],
  };
}

function emptyOptional(): OptionalSection {
  return {
    id: createId("section"),
    title: "Achievements",
    items: [""],
  };
}

export function MakerWorkspace() {
  const setResume = useResumeStore((state) => state.setResume);
  const [notice, setNotice] = useState("");
  const [skillMode, setSkillMode] = useState<SkillMode>("auto");
  const [courseQuery, setCourseQuery] = useState("");
  const [skillQuery, setSkillQuery] = useState("");
  const [courses, setCourses] = useState<string[]>([]);
  const [skills, setSkills] = useState<string[]>([]);
  const [education, setEducation] = useState<EducationEntry[]>([emptyEducation()]);
  const [projects, setProjects] = useState<ProjectDraft[]>([emptyProject()]);
  const [experience, setExperience] = useState<ExperienceDraft[]>([]);
  const [optionalSections, setOptionalSections] = useState<OptionalSection[]>([]);
  const [personal, setPersonal] = useState({
    fullName: "",
    title: "",
    email: "",
    phone: "",
    github: "",
    linkedin: "",
    portfolio: "",
    location: "",
    summary: "",
  });

  const courseOptions = useMemo(() => filterOptions(commonCourses, courseQuery), [courseQuery]);
  const skillOptions = useMemo(() => filterOptions(commonSkills, skillQuery), [skillQuery]);

  function flash(message: string) {
    setNotice(message);
    window.setTimeout(() => setNotice(""), 2400);
  }

  function addCourse(value = courseQuery) {
    setCourses((current) => addUniqueValue(current, value));
    setCourseQuery("");
  }

  function addSkill(value = skillQuery) {
    setSkills((current) => addUniqueValue(current, value));
    setSkillQuery("");
  }

  async function generateBulletsForProject(project: ProjectDraft) {
    const payload = {
      name: project.name || "Project",
      notes: project.notes || project.name || "technical project work",
      techStack: parseCommaList(project.techStack),
      count: project.bulletCount,
      sectionType: "project" as const,
    };

    try {
      const response = await fetch("/api/ai/generate-bullets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = (await response.json()) as {
        bullets?: string[];
        configured?: boolean;
        suggestedName?: string;
        techStack?: string[];
      };
      const bullets = data.bullets?.length ? data.bullets : generateLocalBullets(payload);
      setProjects((current) =>
        current.map((item) =>
          item.id === project.id
            ? {
                ...item,
                name: data.suggestedName || item.name || inferProjectName(item.notes),
                techStack: data.techStack?.length
                  ? data.techStack.join(", ")
                  : item.techStack || inferTechStack(item.notes).join(", "),
                bullets,
              }
            : item,
        ),
      );
      flash(data.configured === false ? "Local bullets generated." : "Bullets generated.");
    } catch {
      setProjects((current) =>
        current.map((item) =>
          item.id === project.id
            ? {
                ...item,
                name: item.name || inferProjectName(item.notes),
                techStack: item.techStack || inferTechStack(item.notes).join(", "),
                bullets: generateLocalBullets(payload),
              }
            : item,
        ),
      );
      flash("Local bullets generated.");
    }
  }

  async function generateBulletsForExperience(item: ExperienceDraft) {
    const payload = {
      name: item.role || "Experience",
      notes: item.notes || item.role || "experience responsibilities",
      techStack: [],
      count: item.bulletCount,
      sectionType: "experience" as const,
    };

    try {
      const response = await fetch("/api/ai/generate-bullets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = (await response.json()) as { bullets?: string[]; configured?: boolean };
      const bullets = data.bullets?.length ? data.bullets : generateLocalBullets(payload);
      setExperience((current) =>
        current.map((entry) => (entry.id === item.id ? { ...entry, bullets } : entry)),
      );
      flash(data.configured === false ? "Local bullets generated." : "Bullets generated.");
    } catch {
      setExperience((current) =>
        current.map((entry) =>
          entry.id === item.id ? { ...entry, bullets: generateLocalBullets(payload) } : entry,
        ),
      );
      flash("Local bullets generated.");
    }
  }

  function buildSkillGroups(): SkillGroup[] {
    if (skillMode === "none") {
      return skills.length ? [{ id: "skills-all", name: "Skills", skills }] : [];
    }

    if (skillMode === "manual") {
      return skills.length ? [{ id: "skills-manual", name: "Technical Skills", skills }] : [];
    }

    return autoGroupSkills(skills);
  }

  function convertOptionalSection(section: OptionalSection) {
    const bullets = textToBullets(section.items.join("\n"), 6);
    setOptionalSections((current) =>
      current.map((item) => (item.id === section.id ? { ...item, items: bullets } : item)),
    );
    flash("Optional section converted to bullets.");
  }

  function applyToPreview() {
    if (!personal.fullName.trim()) {
      flash("Full name is required before preview.");
      return;
    }

    const resume: ResumeDocument = {
      personal,
      summary: personal.summary,
      education: education.filter((item) => item.institute || item.degree),
      courses,
      skillGroups: buildSkillGroups(),
      projects: projects
        .filter((project) => project.name)
        .map<ProjectEntry>((project) => ({
          id: project.id,
          name: project.name,
          link: project.link,
          techStack: parseCommaList(project.techStack),
          bullets:
            project.bullets.length > 0
              ? project.bullets
              : generateLocalBullets({
                  name: project.name,
                  notes: project.notes,
                  techStack: parseCommaList(project.techStack),
                  count: project.bulletCount,
                  sectionType: "project",
                }),
        })),
      experience: experience
        .filter((item) => item.role || item.company)
        .map<ExperienceEntry>((item) => ({
          id: item.id,
          role: item.role,
          company: item.company,
          startDate: item.startDate,
          endDate: item.endDate,
          bullets:
            item.bullets.length > 0
              ? item.bullets
              : generateLocalBullets({
                  name: item.role,
                  notes: item.notes,
                  techStack: [],
                  count: item.bulletCount,
                  sectionType: "experience",
                }),
        })),
      optionalSections: optionalSections
        .map((section) => ({
          ...section,
          items: section.items.map((item) => item.trim()).filter(Boolean),
        }))
        .filter((section) => section.title && section.items.length),
      sectionOrder: ["education", "skills", "projects", "experience", "optional"],
    };

    setResume(resume);
    flash("Resume preview updated.");
  }

  function resetMaker() {
    setSkillMode("auto");
    setCourseQuery("");
    setSkillQuery("");
    setCourses([]);
    setSkills([]);
    setEducation([emptyEducation()]);
    setProjects([emptyProject()]);
    setExperience([]);
    setOptionalSections([]);
    setPersonal({
      fullName: "",
      title: "",
      email: "",
      phone: "",
      github: "",
      linkedin: "",
      portfolio: "",
      location: "",
      summary: "",
    });
    flash("Maker data cleared from this session.");
  }

  return (
    <>
      <NotificationPill message={notice} tone="info" />
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="space-y-5">
          <Header />
          <Panel title="Personal information">
            <div className="grid gap-3 md:grid-cols-2">
              {Object.entries(personal)
                .filter(([key]) => key !== "summary")
                .map(([key, value]) => (
                  <label key={key} className="block text-sm font-medium text-slate-700">
                    {labelize(key)}
                    <input
                      className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-owl-600 focus:ring-2 focus:ring-owl-100"
                      value={value}
                      onChange={(event) =>
                        setPersonal((current) => ({ ...current, [key]: event.target.value }))
                      }
                    />
                  </label>
                ))}
            </div>
            <label className="mt-3 block text-sm font-medium text-slate-700">
              Summary
              <textarea
                className="mt-1 min-h-20 w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-owl-600 focus:ring-2 focus:ring-owl-100"
                value={personal.summary}
                onChange={(event) =>
                  setPersonal((current) => ({ ...current, summary: event.target.value }))
                }
              />
            </label>
          </Panel>

          <Panel title="Education">
            <div className="space-y-3">
              {education.map((item) => (
                <div key={item.id} className="grid gap-3 rounded-md border border-slate-200 p-3 md:grid-cols-2">
                  <TextField label="Institute" value={item.institute} onChange={(value) => setEducation((current) => current.map((entry) => entry.id === item.id ? { ...entry, institute: value } : entry))} />
                  <TextField label="Degree/program" value={item.degree} onChange={(value) => setEducation((current) => current.map((entry) => entry.id === item.id ? { ...entry, degree: value } : entry))} />
                  <TextField type="month" label="Intake month/year" value={item.startDate ?? ""} onChange={(value) => setEducation((current) => current.map((entry) => entry.id === item.id ? { ...entry, startDate: value } : entry))} />
                  <TextField type="month" label="Graduation month/year" value={item.endDate ?? ""} onChange={(value) => setEducation((current) => current.map((entry) => entry.id === item.id ? { ...entry, endDate: value } : entry))} />
                  <TextField label="CGPA" value={item.cgpa ?? ""} onChange={(value) => setEducation((current) => current.map((entry) => entry.id === item.id ? { ...entry, cgpa: value } : entry))} />
                  <button type="button" className="self-end rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50" onClick={() => setEducation((current) => current.filter((entry) => entry.id !== item.id))}>
                    Remove
                  </button>
                </div>
              ))}
            </div>
            <AddButton label="Add education" onClick={() => setEducation((current) => [...current, emptyEducation()])} />
          </Panel>

          <SearchListPanel title="Relevant courses" query={courseQuery} setQuery={setCourseQuery} options={courseOptions} values={courses} addValue={addCourse} removeValue={(value) => setCourses((current) => current.filter((item) => item !== value))} />

          <Panel title="Skills">
            <div className="grid gap-2 sm:grid-cols-3">
              {(["auto", "manual", "none"] as SkillMode[]).map((mode) => (
                <button key={mode} type="button" className={skillMode === mode ? "rounded-md bg-owl-700 px-3 py-2 text-sm font-semibold text-white" : "rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"} onClick={() => setSkillMode(mode)}>
                  {mode === "auto" ? "Auto-grouped" : mode === "manual" ? "Manual group" : "No grouping"}
                </button>
              ))}
            </div>
            <SearchList query={skillQuery} setQuery={setSkillQuery} options={skillOptions} values={skills} addValue={addSkill} removeValue={(value) => setSkills((current) => current.filter((item) => item !== value))} />
          </Panel>

          <Panel title="Projects">
            <div className="space-y-3">
              {projects.map((project) => (
                <ProjectEditor key={project.id} project={project} setProjects={setProjects} onGenerate={() => generateBulletsForProject(project)} />
              ))}
            </div>
            <AddButton label="Add project" onClick={() => setProjects((current) => [...current, emptyProject()])} />
          </Panel>

          <Panel title="Experience">
            <div className="space-y-3">
              {experience.map((item) => (
                <ExperienceEditor key={item.id} item={item} setExperience={setExperience} onGenerate={() => generateBulletsForExperience(item)} />
              ))}
            </div>
            <AddButton label="Add experience" onClick={() => setExperience((current) => [...current, emptyExperience()])} />
          </Panel>

          <Panel title="Optional sections">
            <div className="space-y-3">
              {optionalSections.map((section) => (
                <div key={section.id} className="rounded-md border border-slate-200 p-3">
                  <TextField label="Section title" value={section.title} onChange={(value) => setOptionalSections((current) => current.map((item) => item.id === section.id ? { ...item, title: value } : item))} />
                  <textarea aria-label={`${section.title} plain text or bullets`} className="mt-3 min-h-20 w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-owl-600 focus:ring-2 focus:ring-owl-100" value={section.items.join("\n")} onChange={(event) => setOptionalSections((current) => current.map((item) => item.id === section.id ? { ...item, items: event.target.value.split("\n") } : item))} />
                  <button type="button" className="mt-3 inline-flex items-center gap-2 rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50" onClick={() => convertOptionalSection(section)}>
                    <Sparkles className="h-4 w-4" />
                    Convert to bullets
                  </button>
                </div>
              ))}
            </div>
            <AddButton label="Add optional section" onClick={() => setOptionalSections((current) => [...current, emptyOptional()])} />
          </Panel>
        </div>

        <aside className="h-fit rounded-lg border border-slate-200 bg-white p-5 shadow-soft xl:sticky xl:top-6">
          <h2 className="text-lg font-semibold text-ink">Preview actions</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Generate truthful local bullets when needed, then update the shared resume preview.
          </p>
          <div className="mt-4 space-y-2">
            <button type="button" className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-owl-700 px-4 py-2 text-sm font-semibold text-white hover:bg-owl-900" onClick={applyToPreview}>
              <Eye className="h-4 w-4" />
              Update preview
            </button>
            <Link href="/preview" className="inline-flex w-full items-center justify-center rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
              Open preview
            </Link>
            <button type="button" className="inline-flex w-full items-center justify-center gap-2 rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50" onClick={resetMaker}>
              <RotateCcw className="h-4 w-4" />
              Reset maker
            </button>
          </div>
        </aside>
      </div>
    </>
  );
}

function Header() {
  return (
    <header className="rounded-lg border border-slate-200 bg-white p-5 shadow-soft">
      <p className="text-sm font-semibold uppercase tracking-wide text-owl-700">Phase 4</p>
      <h1 className="mt-1 text-3xl font-semibold text-ink">Resume Maker</h1>
      <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
        Build a resume from structured inputs, generate editable bullets from your own notes, and send the result to the LaTeX-style preview.
      </p>
    </header>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-soft">
      <h2 className="text-lg font-semibold text-ink">{title}</h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function TextField({ label, value, onChange, type = "text" }: { label: string; value: string; onChange: (value: string) => void; type?: string }) {
  return (
    <label className="block text-sm font-medium text-slate-700">
      {label}
      <input type={type} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-owl-600 focus:ring-2 focus:ring-owl-100" value={value} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}

function AddButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button type="button" className="mt-3 inline-flex items-center gap-2 rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50" onClick={onClick}>
      <Plus className="h-4 w-4" />
      {label}
    </button>
  );
}

function SearchListPanel(props: { title: string; query: string; setQuery: (value: string) => void; options: string[]; values: string[]; addValue: (value?: string) => void; removeValue: (value: string) => void }) {
  return (
    <Panel title={props.title}>
      <SearchList {...props} />
    </Panel>
  );
}

function SearchList({ query, setQuery, options, values, addValue, removeValue }: { query: string; setQuery: (value: string) => void; options: string[]; values: string[]; addValue: (value?: string) => void; removeValue: (value: string) => void }) {
  return (
    <div className="mt-3">
      <div className="flex gap-2">
        <input className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-owl-600 focus:ring-2 focus:ring-owl-100" value={query} onChange={(event) => setQuery(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); addValue(); } }} placeholder="Search or add custom" />
        <button type="button" className="rounded-md bg-owl-700 px-3 py-2 text-sm font-semibold text-white hover:bg-owl-900" onClick={() => addValue()}>
          Add
        </button>
      </div>
      <div className="mt-2 flex flex-wrap gap-2">
        {options.map((option) => (
          <button key={option} type="button" className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-owl-50 hover:text-owl-900" onClick={() => addValue(option)}>
            {option}
          </button>
        ))}
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {values.map((value) => (
          <span key={value} className="inline-flex items-center gap-2 rounded-full bg-owl-50 px-3 py-1 text-xs font-semibold text-owl-900">
            {value}
            <button type="button" aria-label={`Remove ${value}`} onClick={() => removeValue(value)}>
              <Trash2 className="h-3 w-3" />
            </button>
          </span>
        ))}
      </div>
    </div>
  );
}

function ProjectEditor({ project, setProjects, onGenerate }: { project: ProjectDraft; setProjects: React.Dispatch<React.SetStateAction<ProjectDraft[]>>; onGenerate: () => void }) {
  return (
    <div className="rounded-md border border-slate-200 p-3">
      <div className="grid gap-3 md:grid-cols-2">
        <TextField label="Project name (editable)" value={project.name} onChange={(value) => setProjects((current) => current.map((item) => item.id === project.id ? { ...item, name: value } : item))} />
        <TextField label="Link optional" value={project.link} onChange={(value) => setProjects((current) => current.map((item) => item.id === project.id ? { ...item, link: value } : item))} />
        <TextField label="Detected tech stack (editable)" value={project.techStack} onChange={(value) => setProjects((current) => current.map((item) => item.id === project.id ? { ...item, techStack: value } : item))} />
        <label className="block text-sm font-medium text-slate-700">Bullet count<select className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm" value={project.bulletCount} onChange={(event) => setProjects((current) => current.map((item) => item.id === project.id ? { ...item, bulletCount: Number(event.target.value) } : item))}>{[2, 3, 4, 5, 6].map((count) => <option key={count}>{count}</option>)}</select></label>
      </div>
      <textarea aria-label="Project details or description" className="mt-3 min-h-28 w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-owl-600 focus:ring-2 focus:ring-owl-100" value={project.notes} onChange={(event) => setProjects((current) => current.map((item) => item.id === project.id ? { ...item, notes: event.target.value } : item))} placeholder="Paste project details. ResumeOwl will infer name, tech stack, and bullets, then you can edit all of them." />
      <EditorButtons onGenerate={onGenerate} onRemove={() => setProjects((current) => current.filter((item) => item.id !== project.id))} />
      <BulletEditor bullets={project.bullets} setBullets={(bullets) => setProjects((current) => current.map((item) => item.id === project.id ? { ...item, bullets } : item))} />
    </div>
  );
}

function ExperienceEditor({ item, setExperience, onGenerate }: { item: ExperienceDraft; setExperience: React.Dispatch<React.SetStateAction<ExperienceDraft[]>>; onGenerate: () => void }) {
  return (
    <div className="rounded-md border border-slate-200 p-3">
      <div className="grid gap-3 md:grid-cols-2">
        <TextField label="Role" value={item.role} onChange={(value) => setExperience((current) => current.map((entry) => entry.id === item.id ? { ...entry, role: value } : entry))} />
        <TextField label="Company" value={item.company} onChange={(value) => setExperience((current) => current.map((entry) => entry.id === item.id ? { ...entry, company: value } : entry))} />
        <TextField type="month" label="Start month/year" value={item.startDate} onChange={(value) => setExperience((current) => current.map((entry) => entry.id === item.id ? { ...entry, startDate: value } : entry))} />
        <TextField type="month" label="End month/year" value={item.endDate} onChange={(value) => setExperience((current) => current.map((entry) => entry.id === item.id ? { ...entry, endDate: value } : entry))} />
      </div>
      <textarea className="mt-3 min-h-24 w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-owl-600 focus:ring-2 focus:ring-owl-100" value={item.notes} onChange={(event) => setExperience((current) => current.map((entry) => entry.id === item.id ? { ...entry, notes: event.target.value } : entry))} placeholder="What did you do?" />
      <EditorButtons onGenerate={onGenerate} onRemove={() => setExperience((current) => current.filter((entry) => entry.id !== item.id))} />
      <BulletEditor bullets={item.bullets} setBullets={(bullets) => setExperience((current) => current.map((entry) => entry.id === item.id ? { ...entry, bullets } : entry))} />
    </div>
  );
}

function EditorButtons({ onGenerate, onRemove }: { onGenerate: () => void; onRemove: () => void }) {
  return (
    <div className="mt-3 flex flex-wrap gap-2">
      <button type="button" className="inline-flex items-center gap-2 rounded-md bg-owl-700 px-3 py-2 text-sm font-semibold text-white hover:bg-owl-900" onClick={onGenerate}>
        <Sparkles className="h-4 w-4" />
        Generate bullets
      </button>
      <button type="button" className="rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50" onClick={onRemove}>
        Remove
      </button>
    </div>
  );
}

function BulletEditor({ bullets, setBullets }: { bullets: string[]; setBullets: (bullets: string[]) => void }) {
  if (!bullets.length) {
    return null;
  }

  return (
    <textarea className="mt-3 min-h-28 w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-owl-600 focus:ring-2 focus:ring-owl-100" value={bullets.join("\n")} onChange={(event) => setBullets(event.target.value.split("\n").filter(Boolean))} />
  );
}

function labelize(value: string) {
  return value.replace(/([A-Z])/g, " $1").replace(/^./, (char) => char.toUpperCase());
}
