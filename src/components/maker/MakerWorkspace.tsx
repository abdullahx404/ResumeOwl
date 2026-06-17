"use client";

import Link from "next/link";
import { Eye, Loader2, Plus, RotateCcw, Sparkles, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { NotificationPill } from "@/components/ui/NotificationPill";
import { generateLocalBullets, inferProjectName, inferTechStack, parseCommaList, textToBullets } from "@/lib/maker/bullets";
import { addUniqueValue, autoGroupSkills, commonCourses, commonSkills, filterOptions } from "@/lib/maker/options";
import { formatResumeDateRange } from "@/lib/resume/dates";
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

type MakerDraftState = {
  courses: string[];
  education: EducationEntry[];
  experience: ExperienceDraft[];
  optionalSections: OptionalSection[];
  personal: {
    fullName: string;
    title: string;
    email: string;
    phone: string;
    github: string;
    linkedin: string;
    portfolio: string;
    location: string;
    summary: string;
  };
  projects: ProjectDraft[];
  skillMode: SkillMode;
  skills: string[];
};

let inMemoryMakerDraft: MakerDraftState | null = null;

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
  const [draftHydrated, setDraftHydrated] = useState(false);
  const [skillMode, setSkillMode] = useState<SkillMode>("auto");
  const [courseQuery, setCourseQuery] = useState("");
  const [skillQuery, setSkillQuery] = useState("");
  const [courses, setCourses] = useState<string[]>([]);
  const [skills, setSkills] = useState<string[]>([]);
  const [projectGeneratingIds, setProjectGeneratingIds] = useState<string[]>([]);
  const [experienceGeneratingIds, setExperienceGeneratingIds] = useState<string[]>([]);
  const [optionalConvertingIds, setOptionalConvertingIds] = useState<string[]>([]);
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
  const liveResume = buildResumeDocument();

  useEffect(() => {
    if (inMemoryMakerDraft) {
      setCourses(inMemoryMakerDraft.courses);
      setEducation(inMemoryMakerDraft.education.length ? inMemoryMakerDraft.education : [emptyEducation()]);
      setExperience(inMemoryMakerDraft.experience);
      setOptionalSections(inMemoryMakerDraft.optionalSections);
      setPersonal(inMemoryMakerDraft.personal);
      setProjects(inMemoryMakerDraft.projects.length ? inMemoryMakerDraft.projects : [emptyProject()]);
      setSkillMode(inMemoryMakerDraft.skillMode);
      setSkills(inMemoryMakerDraft.skills);
    }

    setDraftHydrated(true);
  }, []);

  useEffect(() => {
    if (!draftHydrated) {
      return;
    }

    inMemoryMakerDraft = {
      courses,
      education,
      experience,
      optionalSections,
      personal,
      projects,
      skillMode,
      skills,
    };
  }, [courses, draftHydrated, education, experience, optionalSections, personal, projects, skillMode, skills]);

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
    if (!project.notes.trim()) {
      flash("Please provide a project description first.");
      return;
    }

    const payload = {
      name: project.name,
      notes: project.notes,
      techStack: parseCommaList(project.techStack),
      count: project.bulletCount,
      sectionType: "project" as const,
    };

    setProjectGeneratingIds((current) => addUniqueValue(current, project.id));

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
    } finally {
      setProjectGeneratingIds((current) => current.filter((id) => id !== project.id));
    }
  }

  async function generateBulletsForExperience(item: ExperienceDraft) {
    if (!item.notes.trim()) {
      flash("Please provide an experience description first.");
      return;
    }

    const payload = {
      name: item.role || "Experience",
      notes: item.notes,
      techStack: [],
      count: item.bulletCount,
      sectionType: "experience" as const,
    };

    setExperienceGeneratingIds((current) => addUniqueValue(current, item.id));

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
    } finally {
      setExperienceGeneratingIds((current) => current.filter((id) => id !== item.id));
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

  async function convertOptionalSection(section: OptionalSection) {
    if (!section.items.join("\n").trim()) {
      flash("Please add optional section text first.");
      return;
    }

    setOptionalConvertingIds((current) => addUniqueValue(current, section.id));
    await Promise.resolve();
    const bullets = textToBullets(section.items.join("\n"), 6);
    setOptionalSections((current) =>
      current.map((item) => (item.id === section.id ? { ...item, items: bullets } : item)),
    );
    setOptionalConvertingIds((current) => current.filter((id) => id !== section.id));
    flash("Optional section converted to bullets.");
  }

  function buildResumeDocument(): ResumeDocument {
    const resume: ResumeDocument = {
      personal,
      summary: personal.summary,
      education: education.filter((item) => item.institute || item.degree),
      courses,
      skillGroups: buildSkillGroups(),
      projects: projects
        .filter((project) => project.name || project.notes)
        .map<ProjectEntry>((project) => ({
          id: project.id,
          name: project.name || inferProjectName(project.notes),
          link: project.link,
          techStack: parseCommaList(project.techStack).length
            ? parseCommaList(project.techStack)
            : inferTechStack(project.notes),
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

    return resume;
  }

  function applyToPreview() {
    setResume(liveResume);
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
    inMemoryMakerDraft = null;
    flash("Maker data cleared from this session.");
  }

  return (
    <>
      <NotificationPill message={notice} tone="info" />
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(360px,0.9fr)]">
        <div className="space-y-5">
          <Header />
          <Panel title="Personal Information">
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
                  <TextField label="Degree/Program" value={item.degree} onChange={(value) => setEducation((current) => current.map((entry) => entry.id === item.id ? { ...entry, degree: value } : entry))} />
                  <TextField type="month" label="Intake Month/Year" value={item.startDate ?? ""} onChange={(value) => setEducation((current) => current.map((entry) => entry.id === item.id ? { ...entry, startDate: value } : entry))} />
                  <TextField type="month" label="Graduation Month/Year" value={item.endDate ?? ""} onChange={(value) => setEducation((current) => current.map((entry) => entry.id === item.id ? { ...entry, endDate: value } : entry))} />
                  <TextField label="CGPA" value={item.cgpa ?? ""} onChange={(value) => setEducation((current) => current.map((entry) => entry.id === item.id ? { ...entry, cgpa: value } : entry))} />
                  <button type="button" className="self-end rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50" onClick={() => setEducation((current) => current.filter((entry) => entry.id !== item.id))}>
                    Remove
                  </button>
                </div>
              ))}
            </div>
            <AddButton label="Add Education" onClick={() => setEducation((current) => [...current, emptyEducation()])} />
          </Panel>

          <SearchListPanel title="Relevant Courses" query={courseQuery} setQuery={setCourseQuery} options={courseOptions} values={courses} addValue={addCourse} removeValue={(value) => setCourses((current) => current.filter((item) => item !== value))} />

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
                <ProjectEditor key={project.id} project={project} setProjects={setProjects} isGenerating={projectGeneratingIds.includes(project.id)} onGenerate={() => generateBulletsForProject(project)} />
              ))}
            </div>
            <AddButton label="Add Project" onClick={() => setProjects((current) => [...current, emptyProject()])} />
          </Panel>

          <Panel title="Experience">
            <div className="space-y-3">
              {experience.map((item) => (
                <ExperienceEditor key={item.id} item={item} setExperience={setExperience} isGenerating={experienceGeneratingIds.includes(item.id)} onGenerate={() => generateBulletsForExperience(item)} />
              ))}
            </div>
            <AddButton label="Add Experience" onClick={() => setExperience((current) => [...current, emptyExperience()])} />
          </Panel>

          <Panel title={<TitleWithHint title="Optional Sections" hint="Achievements/Awards/Certifications" />}>
            <div className="space-y-3">
              {optionalSections.map((section) => (
                <div key={section.id} className="rounded-md border border-slate-200 p-3">
                  <TextField label="Section Title" value={section.title} onChange={(value) => setOptionalSections((current) => current.map((item) => item.id === section.id ? { ...item, title: value } : item))} />
                  <textarea aria-label={`${section.title} plain text or bullets`} className="mt-3 min-h-20 w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-owl-600 focus:ring-2 focus:ring-owl-100" value={section.items.join("\n")} onChange={(event) => setOptionalSections((current) => current.map((item) => item.id === section.id ? { ...item, items: event.target.value.split("\n") } : item))} />
                  <button type="button" className="mt-3 inline-flex min-w-40 items-center justify-center gap-2 rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-wait disabled:opacity-70" onClick={() => convertOptionalSection(section)} disabled={optionalConvertingIds.includes(section.id)}>
                    {optionalConvertingIds.includes(section.id) ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                    {optionalConvertingIds.includes(section.id) ? "Converting..." : "Convert To Bullets"}
                  </button>
                </div>
              ))}
            </div>
            <AddButton label="Add Optional Section" onClick={() => setOptionalSections((current) => [...current, emptyOptional()])} />
          </Panel>
        </div>

        <aside className="space-y-4 xl:sticky xl:top-6 xl:max-h-[calc(100vh-3rem)] xl:overflow-y-auto">
          <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-soft">
          <h2 className="text-lg font-semibold text-ink">Live Preview</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Updates automatically as you type. Open the full preview when you are ready to export.
          </p>
          <div className="mt-4 space-y-2">
            <button type="button" className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-owl-700 px-4 py-2 text-sm font-semibold text-white hover:bg-owl-900" onClick={applyToPreview}>
              <Eye className="h-4 w-4" />
              Update Preview
            </button>
            <Link href="/preview" className="inline-flex w-full items-center justify-center rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50" onClick={() => setResume(liveResume)}>
              Open Preview
            </Link>
            <button type="button" className="inline-flex w-full items-center justify-center gap-2 rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50" onClick={resetMaker}>
              <RotateCcw className="h-4 w-4" />
              Reset Maker
            </button>
          </div>
          </div>
          <LiveResumePreview resume={liveResume} />
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

function Panel({ title, children }: { title: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-soft">
      <h2 className="text-lg font-semibold text-ink">{title}</h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function TextField({ label, value, onChange, type = "text" }: { label: React.ReactNode; value: string; onChange: (value: string) => void; type?: string }) {
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

function ProjectEditor({ project, setProjects, isGenerating, onGenerate }: { project: ProjectDraft; setProjects: React.Dispatch<React.SetStateAction<ProjectDraft[]>>; isGenerating: boolean; onGenerate: () => void }) {
  return (
    <div className="rounded-md border border-slate-200 p-3">
      <div className="grid gap-3 md:grid-cols-2">
        <TextField label="Project Name" value={project.name} onChange={(value) => setProjects((current) => current.map((item) => item.id === project.id ? { ...item, name: value } : item))} />
        <TextField label={<TitleWithHint title="Link" hint="optional" />} value={project.link} onChange={(value) => setProjects((current) => current.map((item) => item.id === project.id ? { ...item, link: value } : item))} />
        <TextField label={<TitleWithHint title="Add Tech Stack" hint="optional" />} value={project.techStack} onChange={(value) => setProjects((current) => current.map((item) => item.id === project.id ? { ...item, techStack: value } : item))} />
        <label className="block text-sm font-medium text-slate-700">Bullet Count<select className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm" value={project.bulletCount} onChange={(event) => setProjects((current) => current.map((item) => item.id === project.id ? { ...item, bulletCount: Number(event.target.value) } : item))}>{[2, 3, 4, 5, 6].map((count) => <option key={count}>{count}</option>)}</select></label>
      </div>
      <textarea aria-label="Project details or description" className="mt-3 min-h-28 w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-owl-600 focus:ring-2 focus:ring-owl-100" value={project.notes} onChange={(event) => setProjects((current) => current.map((item) => item.id === project.id ? { ...item, notes: event.target.value } : item))} placeholder="Paste project details. ResumeOwl will infer name, tech stack, and bullets, then you can edit all of them." />
      <EditorButtons isGenerating={isGenerating} onGenerate={onGenerate} onRemove={() => setProjects((current) => current.filter((item) => item.id !== project.id))} />
      <BulletEditor bullets={project.bullets} setBullets={(bullets) => setProjects((current) => current.map((item) => item.id === project.id ? { ...item, bullets } : item))} />
    </div>
  );
}

function ExperienceEditor({ item, setExperience, isGenerating, onGenerate }: { item: ExperienceDraft; setExperience: React.Dispatch<React.SetStateAction<ExperienceDraft[]>>; isGenerating: boolean; onGenerate: () => void }) {
  return (
    <div className="rounded-md border border-slate-200 p-3">
      <div className="grid gap-3 md:grid-cols-2">
        <TextField label="Role" value={item.role} onChange={(value) => setExperience((current) => current.map((entry) => entry.id === item.id ? { ...entry, role: value } : entry))} />
        <TextField label="Company" value={item.company} onChange={(value) => setExperience((current) => current.map((entry) => entry.id === item.id ? { ...entry, company: value } : entry))} />
        <TextField type="month" label="Start Month/Year" value={item.startDate} onChange={(value) => setExperience((current) => current.map((entry) => entry.id === item.id ? { ...entry, startDate: value } : entry))} />
        <TextField type="month" label="End Month/Year" value={item.endDate} onChange={(value) => setExperience((current) => current.map((entry) => entry.id === item.id ? { ...entry, endDate: value } : entry))} />
      </div>
      <textarea className="mt-3 min-h-24 w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-owl-600 focus:ring-2 focus:ring-owl-100" value={item.notes} onChange={(event) => setExperience((current) => current.map((entry) => entry.id === item.id ? { ...entry, notes: event.target.value } : entry))} placeholder="What did you do?" />
      <EditorButtons isGenerating={isGenerating} onGenerate={onGenerate} onRemove={() => setExperience((current) => current.filter((entry) => entry.id !== item.id))} />
      <BulletEditor bullets={item.bullets} setBullets={(bullets) => setExperience((current) => current.map((entry) => entry.id === item.id ? { ...entry, bullets } : entry))} />
    </div>
  );
}

function EditorButtons({ isGenerating, onGenerate, onRemove }: { isGenerating: boolean; onGenerate: () => void; onRemove: () => void }) {
  return (
    <div className="mt-3 flex flex-wrap gap-2">
      <button type="button" className="inline-flex min-w-40 items-center justify-center gap-2 rounded-md bg-owl-700 px-3 py-2 text-sm font-semibold text-white hover:bg-owl-900 disabled:cursor-wait disabled:opacity-75" onClick={onGenerate} disabled={isGenerating}>
        {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
        {isGenerating ? "Generating..." : "Generate Bullets"}
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

function TitleWithHint({ title, hint }: { title: string; hint: string }) {
  return (
    <>
      {title} <span className="font-normal text-slate-400">({hint})</span>
    </>
  );
}

function LiveResumePreview({ resume }: { resume: ResumeDocument }) {
  return (
    <article className="min-h-[760px] rounded-lg border border-slate-200 bg-white px-5 py-6 shadow-soft sm:px-7">
      <header className="border-b border-slate-300 pb-3 text-center">
        <h2 className="text-xl font-bold uppercase tracking-normal text-ink">
          {resume.personal.fullName || "Your Name"}
        </h2>
        {resume.personal.title ? (
          <p className="mt-1 text-xs font-medium text-slate-700">{resume.personal.title}</p>
        ) : null}
        <p className="mt-2 break-words text-[11px] text-slate-600">
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
        <PreviewSection title="Summary">
          <p className="text-xs leading-5 text-slate-800">{resume.summary}</p>
        </PreviewSection>
      ) : null}

      {resume.education.length ? (
        <PreviewSection title="Education">
          <div className="space-y-2">
            {resume.education.map((item) => (
              <div key={item.id}>
                <div className="flex flex-wrap justify-between gap-2 text-xs">
                  <strong>{item.institute}</strong>
                  <span className="text-slate-600">
                    {formatResumeDateRange(item.startDate, item.endDate)}
                  </span>
                </div>
                <p className="text-xs text-slate-700">
                  {item.degree}
                  {item.cgpa ? `, CGPA ${item.cgpa}` : ""}
                </p>
              </div>
            ))}
            {resume.courses.length ? (
              <p className="text-xs text-slate-700">
                <strong>Relevant Courses:</strong> {resume.courses.join(", ")}
              </p>
            ) : null}
          </div>
        </PreviewSection>
      ) : null}

      {resume.skillGroups.length ? (
        <PreviewSection title="Skills">
          <div className="space-y-1 text-xs">
            {resume.skillGroups.map((group) => (
              <p key={group.id}>
                <strong>{group.name}:</strong> {group.skills.join(", ")}
              </p>
            ))}
          </div>
        </PreviewSection>
      ) : null}

      {resume.projects.length ? (
        <PreviewSection title="Projects">
          <div className="space-y-2">
            {resume.projects.map((project) => (
              <div key={project.id}>
                <div className="flex flex-wrap items-baseline justify-between gap-2 text-xs">
                  <strong>{project.name}</strong>
                  <span className="text-[11px] text-slate-600">{project.techStack?.join(", ")}</span>
                </div>
                <PreviewBullets items={project.bullets} />
              </div>
            ))}
          </div>
        </PreviewSection>
      ) : null}

      {resume.experience.length ? (
        <PreviewSection title="Experience">
          <div className="space-y-2">
            {resume.experience.map((item) => (
              <div key={item.id}>
                <div className="flex flex-wrap justify-between gap-2 text-xs">
                  <strong>
                    {[item.role, item.company].filter(Boolean).join(", ")}
                  </strong>
                  <span className="text-slate-600">
                    {formatResumeDateRange(item.startDate, item.endDate)}
                  </span>
                </div>
                <PreviewBullets items={item.bullets} />
              </div>
            ))}
          </div>
        </PreviewSection>
      ) : null}

      {resume.optionalSections.length ? (
        <PreviewSection title="Additional">
          <div className="space-y-2">
            {resume.optionalSections.map((section) => (
              <div key={section.id}>
                <h4 className="text-xs font-semibold text-slate-800">{section.title}</h4>
                <PreviewBullets items={section.items} />
              </div>
            ))}
          </div>
        </PreviewSection>
      ) : null}
    </article>
  );
}

function PreviewSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-4">
      <h3 className="border-b border-slate-300 pb-1 text-xs font-bold uppercase tracking-normal text-ink">
        {title}
      </h3>
      <div className="mt-2">{children}</div>
    </section>
  );
}

function PreviewBullets({ items }: { items: string[] }) {
  return (
    <ul className="mt-1 list-disc space-y-1 pl-4 text-xs leading-5 text-slate-800">
      {items.map((item) => (
        <li key={item} className="break-words">
          {item}
        </li>
      ))}
    </ul>
  );
}

function labelize(value: string) {
  const labels: Record<string, string> = {
    email: "Email",
    fullName: "Full Name",
    github: "GitHub",
    linkedin: "LinkedIn",
    location: "Location",
    phone: "Phone",
    portfolio: "Portfolio",
    title: "Title",
  };

  return labels[value] ?? value.replace(/([A-Z])/g, " $1").replace(/^./, (char) => char.toUpperCase());
}
