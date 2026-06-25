import { normalizeExternalUrl } from "@/lib/maker/bullets";
import { formatAcademicScore } from "@/lib/resume/academic-score";
import { resumeContactItems } from "@/lib/resume/contact";
import { formatResumeDateRange } from "@/lib/resume/dates";
import type { ResumeDocument, ResumeSectionId } from "@/types/resume";

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function inlineStrong(text: string) {
  return escapeHtml(text).replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
}

function bulletList(items: string[]) {
  if (!items.length) {
    return "";
  }

  return `<ul>${items.map((item) => `<li>${inlineStrong(item)}</li>`).join("")}</ul>`;
}

function heading(title: string) {
  return `<h2>${escapeHtml(title)}</h2>`;
}

function sectionTitle(sectionId: ResumeSectionId) {
  const titles: Record<ResumeSectionId, string> = {
    education: "Education",
    skills: "Skills",
    projects: "Projects",
    experience: "Experience",
    optional: "Optional Sections",
  };

  return titles[sectionId];
}

function contactHtml(resume: ResumeDocument) {
  return resumeContactItems(resume.personal)
    .map((item) =>
      item.href
        ? `<a href="${escapeHtml(item.href)}">${escapeHtml(item.label)}</a>`
        : escapeHtml(item.label),
    )
    .join(" | ");
}

function educationHtml(resume: ResumeDocument) {
  if (!resume.education.length && !resume.courses.length) {
    return "";
  }

  const entries = resume.education
    .map(
      (item) => `
        <div class="entry">
          <div class="row"><strong>${escapeHtml(item.institute)}</strong><span>${escapeHtml(formatResumeDateRange(item.startDate, item.endDate))}</span></div>
          <p>${escapeHtml(item.degree)}${item.cgpa ? `, ${escapeHtml(formatAcademicScore(item.cgpa))}` : ""}</p>
          ${bulletList(item.details ?? [])}
        </div>
      `,
    )
    .join("");

  const courses = resume.courses.length
    ? `<p><strong>Relevant Courses:</strong> ${escapeHtml(resume.courses.join(", "))}</p>`
    : "";

  return `${heading(sectionTitle("education"))}${entries}${courses}`;
}

function skillsHtml(resume: ResumeDocument) {
  const groups = resume.skillGroups.filter((group) => group.skills.length);

  if (!groups.length) {
    return "";
  }

  return `${heading(sectionTitle("skills"))}${groups
    .map((group) => `<p><strong>${escapeHtml(group.name)}:</strong> ${escapeHtml(group.skills.join(", "))}</p>`)
    .join("")}`;
}

function projectsHtml(resume: ResumeDocument) {
  if (!resume.projects.length) {
    return "";
  }

  return `${heading(sectionTitle("projects"))}${resume.projects
    .map((project) => {
      const link = project.link
        ? ` <a class="side-link" href="${escapeHtml(normalizeExternalUrl(project.link))}">${escapeHtml(project.linkLabel || "Link")}</a>`
        : "";
      const stack = project.techStack?.length
        ? `<span>${escapeHtml(project.techStack.join(", "))}</span>`
        : "<span></span>";

      return `
        <div class="entry">
          <div class="row"><strong>${escapeHtml(project.name)}${link}</strong>${stack}</div>
          ${bulletList(project.bullets)}
        </div>
      `;
    })
    .join("")}`;
}

function experienceHtml(resume: ResumeDocument) {
  if (!resume.experience.length) {
    return "";
  }

  return `${heading(sectionTitle("experience"))}${resume.experience
    .map(
      (item) => `
        <div class="entry">
          <div class="row"><strong>${escapeHtml(item.role)}, ${escapeHtml(item.company)}</strong><span>${escapeHtml(formatResumeDateRange(item.startDate, item.endDate))}</span></div>
          ${bulletList(item.bullets)}
        </div>
      `,
    )
    .join("")}`;
}

function optionalHtml(resume: ResumeDocument) {
  return resume.optionalSections
    .filter((section) => section.items.some((item) => item.trim()))
    .map((section) => `${heading(section.title)}${bulletList(section.items)}`)
    .join("");
}

function sectionHtml(sectionId: ResumeSectionId, resume: ResumeDocument) {
  if (sectionId === "education") return educationHtml(resume);
  if (sectionId === "skills") return skillsHtml(resume);
  if (sectionId === "projects") return projectsHtml(resume);
  if (sectionId === "experience") return experienceHtml(resume);
  return optionalHtml(resume);
}

export function createPrintableResumeHtml(resume: ResumeDocument) {
  const sections = resume.sectionOrder.map((sectionId) => sectionHtml(sectionId, resume)).join("");
  const summary = resume.summary?.trim()
    ? `${heading("Summary")}<p>${escapeHtml(resume.summary)}</p>`
    : "";

  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>${escapeHtml(resume.personal.fullName || "Resume")}</title>
    <style>
      @page { margin: 0.55in; size: letter; }
      * { box-sizing: border-box; }
      body {
        background: #ffffff;
        color: #111827;
        font-family: Arial, Helvetica, sans-serif;
        font-size: 10.5pt;
        line-height: 1.42;
        margin: 0;
      }
      main { background: #ffffff; }
      header { text-align: center; margin-bottom: 18px; }
      h1 {
        color: #111827;
        font-size: 24pt;
        letter-spacing: 0;
        line-height: 1.1;
        margin: 0;
        text-transform: uppercase;
      }
      .title { color: #334155; font-size: 11pt; font-weight: 700; margin-top: 4px; }
      .contact { color: #475569; font-size: 9.5pt; margin-top: 10px; }
      a { color: #2563eb; text-decoration: none; }
      h2 {
        border-bottom: 1px solid #cbd5e1;
        color: #111827;
        font-size: 10.5pt;
        letter-spacing: 0;
        margin: 15px 0 7px;
        padding-bottom: 2px;
        text-transform: uppercase;
      }
      p { margin: 3px 0; }
      ul { margin: 4px 0 0 17px; padding: 0; }
      li { margin: 2px 0; break-inside: avoid; }
      .entry { break-inside: avoid; margin-bottom: 8px; }
      .row { display: flex; gap: 12px; justify-content: space-between; }
      .row span { color: #475569; text-align: right; }
      .side-link { color: #2563eb; font-size: 9pt; font-style: italic; font-weight: 600; margin-left: 6px; }
    </style>
  </head>
  <body>
    <main>
      <header>
        <h1>${escapeHtml(resume.personal.fullName)}</h1>
        ${resume.personal.title ? `<div class="title">${escapeHtml(resume.personal.title)}</div>` : ""}
        <div class="contact">${contactHtml(resume)}</div>
      </header>
      ${summary}
      ${sections}
    </main>
  </body>
</html>`;
}
