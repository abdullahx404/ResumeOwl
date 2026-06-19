"use client";

import Link from "next/link";
import { Eye, Loader2, Plus, RotateCcw, Sparkles, Trash2 } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { NotificationPill } from "@/components/ui/NotificationPill";
import { extractPlainSummary, inferTechStack, normalizeExternalUrl, notesToBullets, parseCommaList, polishSummaryLocally, textToBullets } from "@/lib/maker/bullets";
import { addUniqueValue, autoGroupSkills, commonCourses, commonSkills, filterOptions } from "@/lib/maker/options";
import { formatAcademicScore, sanitizeAcademicScoreInput } from "@/lib/resume/academic-score";
import { resumeContactItems } from "@/lib/resume/contact";
import { formatResumeDateRange } from "@/lib/resume/dates";
import { getStoredProfile } from "@/lib/resume/persistence";
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
  linkLabel: string;
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

type ManualSkillGroupDraft = {
  id: string;
  name: string;
  query: string;
  skills: string[];
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
  manualSkillGroups: ManualSkillGroupDraft[];
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
    linkLabel: "",
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

function emptyManualSkillGroup(name = ""): ManualSkillGroupDraft {
  return {
    id: createId("skill-group"),
    name,
    query: "",
    skills: [],
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
  const [manualSkillGroups, setManualSkillGroups] = useState<ManualSkillGroupDraft[]>([
    emptyManualSkillGroup("Frontend"),
  ]);
  const [projectGeneratingIds, setProjectGeneratingIds] = useState<string[]>([]);
  const [projectExtractingIds, setProjectExtractingIds] = useState<string[]>([]);
  const [experienceGeneratingIds, setExperienceGeneratingIds] = useState<string[]>([]);
  const [optionalConvertingIds, setOptionalConvertingIds] = useState<string[]>([]);
  const [optionalPolishingIds, setOptionalPolishingIds] = useState<string[]>([]);
  const [isPolishingSummary, setIsPolishingSummary] = useState(false);
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
      setManualSkillGroups(
        inMemoryMakerDraft.manualSkillGroups?.length
          ? inMemoryMakerDraft.manualSkillGroups
          : [emptyManualSkillGroup("Frontend")],
      );
    } else {
      const profile = getStoredProfile();

      if (profile?.onboarded) {
        setPersonal((current) => ({
          ...current,
          fullName: profile.fullName,
          title: profile.title,
        }));
      }
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
      manualSkillGroups,
    };
  }, [courses, draftHydrated, education, experience, manualSkillGroups, optionalSections, personal, projects, skillMode, skills]);

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
      count: Math.max(3, Math.min(6, project.bulletCount)),
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
        error?: string;
        suggestedName?: string;
        techStack?: string[];
      };
      if (!response.ok || !data.bullets?.length) {
        flash(data.error || "AI generation failed or provider limit reached.");
        return;
      }

      const bullets = data.bullets;
      setProjects((current) =>
        current.map((item) =>
          item.id === project.id
            ? {
                ...item,
                techStack: data.techStack?.length ? data.techStack.join(", ") : item.techStack,
                bullets,
              }
            : item,
        ),
      );
      flash(data.configured === false ? "AI generation unavailable." : "Bullets generated.");
    } catch {
      flash("AI generation failed or provider limit reached.");
    } finally {
      setProjectGeneratingIds((current) => current.filter((id) => id !== project.id));
    }
  }

  function extractTechStackForProject(project: ProjectDraft) {
    if (!project.notes.trim()) {
      flash("Please provide a project description first.");
      return;
    }

    setProjectExtractingIds((current) => addUniqueValue(current, project.id));
    const techStack = inferTechStack(project.notes).slice(0, 6);
    setProjects((current) =>
      current.map((item) =>
        item.id === project.id ? { ...item, techStack: techStack.join(", ") } : item,
      ),
    );
    window.setTimeout(() => {
      setProjectExtractingIds((current) => current.filter((id) => id !== project.id));
    }, 200);
    flash(techStack.length ? "Tech stack extracted." : "No clear tech stack found.");
  }

  async function polishSummary() {
    if (!personal.summary.trim()) {
      flash("Please add a summary first.");
      return;
    }

    setIsPolishingSummary(true);

    try {
      const response = await fetch("/api/ai/polish-summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ summary: personal.summary }),
      });
      const data = (await response.json()) as { summary?: string; configured?: boolean };
      const summary = extractPlainSummary(data.summary?.trim() || polishSummaryLocally(personal.summary));

      setPersonal((current) => ({ ...current, summary }));
      flash(data.configured === false ? "Summary polished locally." : "Summary polished.");
    } catch {
      setPersonal((current) => ({ ...current, summary: polishSummaryLocally(current.summary) }));
      flash("Summary polished locally.");
    } finally {
      setIsPolishingSummary(false);
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
      const data = (await response.json()) as { bullets?: string[]; configured?: boolean; error?: string };
      if (!response.ok || !data.bullets?.length) {
        flash(data.error || "AI generation failed or provider limit reached.");
        return;
      }

      const bullets = data.bullets;
      setExperience((current) =>
        current.map((entry) => (entry.id === item.id ? { ...entry, bullets } : entry)),
      );
      flash(data.configured === false ? "AI generation unavailable." : "Bullets generated.");
    } catch {
      flash("AI generation failed or provider limit reached.");
    } finally {
      setExperienceGeneratingIds((current) => current.filter((id) => id !== item.id));
    }
  }

  function buildSkillGroups(): SkillGroup[] {
    if (skillMode === "none") {
      return skills.length ? [{ id: "skills-all", name: "Skills", skills }] : [];
    }

    if (skillMode === "manual") {
      return manualSkillGroups
        .map((group) => ({
          id: group.id,
          name: group.name.trim() || "Skill Group",
          skills: group.skills,
        }))
        .filter((group) => group.skills.length > 0);
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

  async function polishOptionalSection(section: OptionalSection) {
    const currentItems = section.items.map((item) => item.trim()).filter(Boolean);

    if (!currentItems.length) {
      flash("Please add optional section text first.");
      return;
    }

    setOptionalPolishingIds((current) => addUniqueValue(current, section.id));

    try {
      const response = await fetch("/api/ai/polish-optional", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: section.title || "Optional Section",
          text: currentItems.join("\n"),
          count: Math.max(3, Math.min(6, currentItems.length)),
        }),
      });
      const data = (await response.json()) as { bullets?: string[]; configured?: boolean; error?: string };

      if (!response.ok || !data.bullets?.length) {
        flash(data.error || "AI generation failed or provider limit reached.");
        return;
      }

      const bullets = data.bullets;
      setOptionalSections((current) =>
        current.map((item) => (item.id === section.id ? { ...item, items: bullets } : item)),
      );
      flash(data.configured === false ? "AI generation unavailable." : "Optional section polished.");
    } catch {
      flash("AI generation failed or provider limit reached.");
    } finally {
      setOptionalPolishingIds((current) => current.filter((id) => id !== section.id));
    }
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
          name: project.name || "Project",
          link: normalizeExternalUrl(project.link),
          linkLabel: project.linkLabel || project.name || "Project",
          techStack: parseCommaList(project.techStack).length
            ? parseCommaList(project.techStack)
            : [],
          bullets: project.bullets.length > 0 ? project.bullets : notesToBullets(project.notes),
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
              : notesToBullets(item.notes),
        })),
      optionalSections: optionalSections
        .map((section) => ({
          ...section,
          items: section.items.map((item) => item.trim()).filter(Boolean),
        }))
        .filter((section) => section.title && section.items.length),
      sectionOrder: [
        ...(education.some((item) => item.institute || item.degree) ? (["education"] as const) : []),
        ...(buildSkillGroups().length ? (["skills"] as const) : []),
        ...(projects.some((project) => project.name || project.notes) ? (["projects"] as const) : []),
        ...(experience.some((item) => item.role || item.company) ? (["experience"] as const) : []),
        ...(optionalSections.some((section) => section.title && section.items.some((item) => item.trim())) ? (["optional"] as const) : []),
      ],
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
    setManualSkillGroups([emptyManualSkillGroup("Frontend")]);
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
            <AutoGrowTextarea
              label={<TitleWithHint title="Summary" hint="optional" />}
              value={personal.summary}
              onChange={(value) => setPersonal((current) => ({ ...current, summary: value }))}
            />
            <button
              type="button"
              className="mt-3 inline-flex min-w-40 items-center justify-center gap-2 rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-wait disabled:opacity-75"
              onClick={polishSummary}
              disabled={isPolishingSummary}
            >
              {isPolishingSummary ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              {isPolishingSummary ? "Polishing..." : "Polish Summary With AI"}
            </button>
          </Panel>

          <Panel title="Education">
            <div className="space-y-3">
              {education.map((item) => (
                <div key={item.id} className="grid gap-3 rounded-md border border-slate-200 p-3 md:grid-cols-2">
                  <TextField label="Institute" value={item.institute} onChange={(value) => setEducation((current) => current.map((entry) => entry.id === item.id ? { ...entry, institute: value } : entry))} />
                  <TextField label="Degree/Program" value={item.degree} onChange={(value) => setEducation((current) => current.map((entry) => entry.id === item.id ? { ...entry, degree: value } : entry))} />
                  <TextField type="month" label="Intake Month/Year" value={item.startDate ?? ""} onChange={(value) => setEducation((current) => current.map((entry) => entry.id === item.id ? { ...entry, startDate: value } : entry))} />
                  <TextField type="month" label="Graduation Month/Year" value={item.endDate ?? ""} onChange={(value) => setEducation((current) => current.map((entry) => entry.id === item.id ? { ...entry, endDate: value } : entry))} />
                  <TextField label="CGPA/Percentage" value={item.cgpa ?? ""} onChange={(value) => {
                    const next = sanitizeAcademicScoreInput(value);
                    setEducation((current) => current.map((entry) => entry.id === item.id ? { ...entry, cgpa: next || (value ? entry.cgpa : "") } : entry));
                  }} />
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
                  {mode === "auto" ? "Auto-Grouped" : mode === "manual" ? "Manual Group" : "No Grouping"}
                </button>
              ))}
            </div>
            {skillMode === "manual" ? (
              <ManualSkillGroups
                groups={manualSkillGroups}
                setGroups={setManualSkillGroups}
              />
            ) : (
              <SearchList query={skillQuery} setQuery={setSkillQuery} options={skillOptions} values={skills} addValue={addSkill} removeValue={(value) => setSkills((current) => current.filter((item) => item !== value))} />
            )}
          </Panel>

          <Panel title="Projects">
            <div className="space-y-3">
              {projects.map((project) => (
                <ProjectEditor
                  key={project.id}
                  project={project}
                  setProjects={setProjects}
                  isExtracting={projectExtractingIds.includes(project.id)}
                  isGenerating={projectGeneratingIds.includes(project.id)}
                  onExtractTech={() => extractTechStackForProject(project)}
                  onGenerate={() => generateBulletsForProject(project)}
                />
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
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button type="button" className="inline-flex min-w-40 items-center justify-center gap-2 rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-wait disabled:opacity-70" onClick={() => convertOptionalSection(section)} disabled={optionalConvertingIds.includes(section.id) || optionalPolishingIds.includes(section.id)}>
                      {optionalConvertingIds.includes(section.id) ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                      {optionalConvertingIds.includes(section.id) ? "Converting..." : "Convert To Bullets"}
                    </button>
                    <button type="button" className="inline-flex min-w-40 items-center justify-center gap-2 rounded-md bg-owl-700 px-3 py-2 text-sm font-semibold text-white hover:bg-owl-900 disabled:cursor-wait disabled:opacity-75" onClick={() => polishOptionalSection(section)} disabled={optionalConvertingIds.includes(section.id) || optionalPolishingIds.includes(section.id)}>
                      {optionalPolishingIds.includes(section.id) ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                      {optionalPolishingIds.includes(section.id) ? "Polishing..." : "Polish Bullets"}
                    </button>
                    <button type="button" className="rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50" onClick={() => setOptionalSections((current) => current.filter((item) => item.id !== section.id))}>
                      Remove Section
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <AddButton label="Add Optional Section" onClick={() => setOptionalSections((current) => [...current, emptyOptional()])} />
          </Panel>
        </div>

        <aside className="space-y-4 xl:sticky xl:top-6 xl:self-start">
          <LiveResumePreview resume={liveResume} />
          <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-soft">
            <h2 className="text-lg font-semibold text-ink">Resume Overview</h2>
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
        </aside>
      </div>
    </>
  );
}

function Header() {
  return (
    <header className="rounded-lg border border-slate-200 bg-white p-5 shadow-soft">
      <h1 className="text-3xl font-semibold text-ink">Resume Maker</h1>
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

function AutoGrowTextarea({ label, value, onChange }: { label: React.ReactNode; value: string; onChange: (value: string) => void }) {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    const textarea = textareaRef.current;

    if (!textarea) {
      return;
    }

    textarea.style.height = "auto";
    textarea.style.height = `${textarea.scrollHeight}px`;
  }, [value]);

  return (
    <label className="mt-3 block text-sm font-medium text-slate-700">
      {label}
      <textarea
        ref={textareaRef}
        className="mt-1 min-h-20 w-full resize-none overflow-hidden rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-owl-600 focus:ring-2 focus:ring-owl-100"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
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

function ManualSkillGroups({
  groups,
  setGroups,
}: {
  groups: ManualSkillGroupDraft[];
  setGroups: React.Dispatch<React.SetStateAction<ManualSkillGroupDraft[]>>;
}) {
  function updateGroup(groupId: string, update: Partial<ManualSkillGroupDraft>) {
    setGroups((current) =>
      current.map((group) => (group.id === groupId ? { ...group, ...update } : group)),
    );
  }

  function addSkillToGroup(group: ManualSkillGroupDraft, value = group.query) {
    const skills = addUniqueValue(group.skills, value);
    setGroups((current) =>
      current.map((item) => (item.id === group.id ? { ...item, skills, query: "" } : item)),
    );
  }

  function removeSkillFromGroup(groupId: string, skill: string) {
    setGroups((current) =>
      current.map((group) =>
        group.id === groupId
          ? { ...group, skills: group.skills.filter((item) => item !== skill) }
          : group,
      ),
    );
  }

  return (
    <div className="mt-4 space-y-4">
      {groups.map((group) => {
        const options = filterOptions(commonSkills, group.query);

        return (
          <div key={group.id} className="rounded-md border border-slate-200 p-3">
            <div className="grid gap-3 md:grid-cols-[1fr_auto]">
              <TextField
                label="Group Name"
                value={group.name}
                onChange={(value) => updateGroup(group.id, { name: value })}
              />
              <button
                type="button"
                className="self-end rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                onClick={() => setGroups((current) => current.filter((item) => item.id !== group.id))}
              >
                Remove Group
              </button>
            </div>
            <SearchList
              query={group.query}
              setQuery={(value) => updateGroup(group.id, { query: value })}
              options={options}
              values={group.skills}
              addValue={(value) => addSkillToGroup(group, value)}
              removeValue={(skill) => removeSkillFromGroup(group.id, skill)}
            />
          </div>
        );
      })}
      <AddButton
        label="Add Skill Group"
        onClick={() => setGroups((current) => [...current, emptyManualSkillGroup()])}
      />
    </div>
  );
}

function ProjectEditor({
  project,
  setProjects,
  isExtracting,
  isGenerating,
  onExtractTech,
  onGenerate,
}: {
  project: ProjectDraft;
  setProjects: React.Dispatch<React.SetStateAction<ProjectDraft[]>>;
  isExtracting: boolean;
  isGenerating: boolean;
  onExtractTech: () => void;
  onGenerate: () => void;
}) {
  return (
    <div className="rounded-md border border-slate-200 p-3">
      <div className="grid gap-3 md:grid-cols-2">
        <TextField label="Project Name" value={project.name} onChange={(value) => setProjects((current) => current.map((item) => item.id === project.id ? { ...item, name: value } : item))} />
        <TextField label={<TitleWithHint title="Link Name" hint="optional" />} value={project.linkLabel} onChange={(value) => setProjects((current) => current.map((item) => item.id === project.id ? { ...item, linkLabel: value } : item))} />
        <TextField label={<TitleWithHint title="Link Address" hint="optional" />} value={project.link} onChange={(value) => setProjects((current) => current.map((item) => item.id === project.id ? { ...item, link: value } : item))} />
        <TextField label={<TitleWithHint title="Add Tech Stack" hint="optional" />} value={project.techStack} onChange={(value) => setProjects((current) => current.map((item) => item.id === project.id ? { ...item, techStack: value } : item))} />
        <label className="block text-sm font-medium text-slate-700">Bullet Count<select className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm" value={project.bulletCount} onChange={(event) => setProjects((current) => current.map((item) => item.id === project.id ? { ...item, bulletCount: Number(event.target.value) } : item))}>{[3, 4, 5, 6].map((count) => <option key={count}>{count}</option>)}</select></label>
      </div>
      <textarea aria-label="Project details or description" className="mt-3 min-h-28 w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-owl-600 focus:ring-2 focus:ring-owl-100" value={project.notes} onChange={(event) => setProjects((current) => current.map((item) => item.id === project.id ? { ...item, notes: event.target.value } : item))} placeholder="Paste project details. Add the project name above; ResumeOwl can extract tech stack and generate editable bullets." />
      <EditorButtons
        isExtracting={isExtracting}
        isGenerating={isGenerating}
        onExtractTech={onExtractTech}
        onGenerate={onGenerate}
        onRemove={() => setProjects((current) => current.filter((item) => item.id !== project.id))}
      />
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
        <label className="block text-sm font-medium text-slate-700">Bullet Count<select className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm" value={item.bulletCount} onChange={(event) => setExperience((current) => current.map((entry) => entry.id === item.id ? { ...entry, bulletCount: Number(event.target.value) } : entry))}>{[3, 4, 5, 6].map((count) => <option key={count}>{count}</option>)}</select></label>
      </div>
      <textarea className="mt-3 min-h-24 w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-owl-600 focus:ring-2 focus:ring-owl-100" value={item.notes} onChange={(event) => setExperience((current) => current.map((entry) => entry.id === item.id ? { ...entry, notes: event.target.value } : entry))} placeholder="What did you do?" />
      <EditorButtons isGenerating={isGenerating} onGenerate={onGenerate} onRemove={() => setExperience((current) => current.filter((entry) => entry.id !== item.id))} />
      <BulletEditor bullets={item.bullets} setBullets={(bullets) => setExperience((current) => current.map((entry) => entry.id === item.id ? { ...entry, bullets } : entry))} />
    </div>
  );
}

function EditorButtons({
  isExtracting = false,
  isGenerating,
  onExtractTech,
  onGenerate,
  onRemove,
}: {
  isExtracting?: boolean;
  isGenerating: boolean;
  onExtractTech?: () => void;
  onGenerate: () => void;
  onRemove: () => void;
}) {
  return (
    <div className="mt-3 flex flex-wrap gap-2">
      {onExtractTech ? (
        <button type="button" className="inline-flex min-w-40 items-center justify-center gap-2 rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-wait disabled:opacity-75" onClick={onExtractTech} disabled={isExtracting || isGenerating}>
          {isExtracting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
          {isExtracting ? "Extracting..." : "Extract Tech Stack"}
        </button>
      ) : null}
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
  const sections = buildPreviewSections(resume);

  return (
    <article className="resume-page min-h-[1000px] rounded-lg border border-slate-200 bg-white px-8 py-10 shadow-soft sm:px-12 xl:max-h-[calc(100vh-3rem)] xl:overflow-y-scroll">
      <PreviewHeader resume={resume} />
      {sections.map((section) => (
        <PreviewSection key={section.key} title={section.title}>
          {section.content}
        </PreviewSection>
      ))}
    </article>
  );
}

type PreviewSectionItem = { key: string; title: string; content: React.ReactNode };

function PreviewHeader({ resume }: { resume: ResumeDocument }) {
  return (
    <header className="pb-4 text-center">
      <h2 className="text-3xl font-bold uppercase tracking-normal text-ink">
        {resume.personal.fullName || "Your Name"}
      </h2>
      {resume.personal.title ? (
        <p className="mt-1 text-sm font-medium text-slate-700">{resume.personal.title}</p>
      ) : null}
      <p className="mt-2 break-words text-xs text-slate-600">
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
  );
}

function buildPreviewSections(resume: ResumeDocument): PreviewSectionItem[] {
  const sections: PreviewSectionItem[] = [];

  if (resume.summary?.trim()) {
    sections.push({
      key: "summary",
      title: "Summary",
      content: <p className="text-sm leading-6 text-slate-800">{resume.summary}</p>,
    });
  }

  if (resume.education.length || resume.courses.length) {
    sections.push({
      key: "education",
      title: "Education",
      content: (
        <div className="space-y-2">
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
                {item.cgpa ? `, ${formatAcademicScore(item.cgpa)}` : ""}
              </p>
            </div>
          ))}
          {resume.courses.length ? (
            <p className="text-sm text-slate-700">
              <strong>Relevant Courses:</strong> {resume.courses.join(", ")}
            </p>
          ) : null}
        </div>
      ),
    });
  }

  if (resume.skillGroups.length) {
    sections.push({
      key: "skills",
      title: "Skills",
      content: (
        <div className="space-y-1 text-sm">
          {resume.skillGroups.map((group) => (
            <p key={group.id}>
              <strong>{group.name}:</strong> {group.skills.join(", ")}
            </p>
          ))}
        </div>
      ),
    });
  }

  if (resume.projects.length) {
    sections.push({
      key: "projects",
      title: "Projects",
      content: (
        <div className="space-y-2">
          {resume.projects.map((project) => (
            <div key={project.id}>
              <div className="flex flex-wrap items-baseline justify-between gap-2 text-sm">
                <strong className="inline-flex flex-wrap items-baseline gap-1">
                  {project.name}
                  {project.link ? (
                    <a className="font-medium italic text-slate-500 underline" href={normalizeExternalUrl(project.link)} target="_blank" rel="noreferrer">
                      {project.linkLabel || "Link"}
                    </a>
                  ) : null}
                </strong>
                <span className="text-xs text-slate-600">{project.techStack?.join(", ")}</span>
              </div>
              <PreviewBullets items={project.bullets} />
            </div>
          ))}
        </div>
      ),
    });
  }

  if (resume.experience.length) {
    sections.push({
      key: "experience",
      title: "Experience",
      content: (
        <div className="space-y-2">
          {resume.experience.map((item) => (
            <div key={item.id}>
              <div className="flex flex-wrap justify-between gap-2 text-sm">
                <strong>{[item.role, item.company].filter(Boolean).join(", ")}</strong>
                <span className="text-slate-600">
                  {formatResumeDateRange(item.startDate, item.endDate)}
                </span>
              </div>
              <PreviewBullets items={item.bullets} />
            </div>
          ))}
        </div>
      ),
    });
  }

  resume.optionalSections.forEach((section) => {
    sections.push({
      key: section.id,
      title: section.title,
      content: <PreviewBullets items={section.items} />,
    });
  });

  return sections;
}

function PreviewSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-4">
      <h3 className="resume-heading">
        {title}
      </h3>
      <div className="mt-2">{children}</div>
    </section>
  );
}

function PreviewBullets({ items }: { items: string[] }) {
  return (
    <ul className="mt-1 list-disc space-y-1 pl-5 text-sm leading-6 text-slate-800">
      {items.map((item) => (
        <li key={item} className="break-words">
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
