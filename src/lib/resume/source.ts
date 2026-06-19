import type { ResumeDocument } from "@/types/resume";
import { normalizeExternalUrl } from "@/lib/maker/bullets";
import { formatAcademicScore } from "./academic-score";
import { resumeContactItems } from "./contact";
import { formatResumeDateRange } from "./dates";

function escapeLatex(value: string): string {
  return value
    .replaceAll("\\", "\\textbackslash{}")
    .replaceAll("&", "\\&")
    .replaceAll("%", "\\%")
    .replaceAll("$", "\\$")
    .replaceAll("#", "\\#")
    .replaceAll("_", "\\_")
    .replaceAll("{", "\\{")
    .replaceAll("}", "\\}");
}

function escapeLatexUrl(value: string): string {
  return value.replaceAll("\\", "%5C").replaceAll("{", "%7B").replaceAll("}", "%7D");
}

function bullets(items: string[]): string {
  return items.map((item) => `  \\item ${escapeLatexWithBold(item)}`).join("\n");
}

function escapeLatexWithBold(value: string): string {
  return value
    .split(/(\*\*[^*]+\*\*)/g)
    .map((part) =>
      part.startsWith("**") && part.endsWith("**")
        ? `\\textbf{${escapeLatex(part.slice(2, -2))}}`
        : escapeLatex(part),
    )
    .join("");
}

export function createLatexStyleSource(resume: ResumeDocument): string {
  const contactLine = resumeContactItems(resume.personal)
    .map((item) =>
      item.href
        ? `\\href{${escapeLatexUrl(item.href)}}{${escapeLatex(item.label)}}`
        : escapeLatex(item.label),
    )
    .join(" $\\cdot$ ");
  const lines = [
    `\\textbf{\\Large ${escapeLatex(resume.personal.fullName)}}`,
    resume.personal.title ? escapeLatex(resume.personal.title) : "",
    contactLine,
    "",
  ];

  if (resume.summary) {
    lines.push("\\section*{Summary}", escapeLatex(resume.summary), "");
  }

  for (const sectionId of resume.sectionOrder) {
    if (sectionId === "education" && (resume.education.length || resume.courses.length)) {
      lines.push("\\section*{Education}");
      for (const education of resume.education) {
        lines.push(
          `\\textbf{${escapeLatex(education.institute)}} \\hfill ${escapeLatex(
            formatResumeDateRange(education.startDate, education.endDate).replace(" - ", " -- "),
          )}`,
          `${escapeLatex(education.degree)}${education.cgpa ? `, ${escapeLatex(formatAcademicScore(education.cgpa))}` : ""}`,
        );
        if (education.details?.length) {
          lines.push("\\begin{itemize}", bullets(education.details), "\\end{itemize}");
        }
      }
      if (resume.courses.length) {
        lines.push(`\\textbf{Relevant Courses}: ${escapeLatex(resume.courses.join(", "))}`);
      }
      lines.push("");
    }

    if (sectionId === "skills" && resume.skillGroups.length) {
      lines.push("\\section*{Skills}");
      for (const group of resume.skillGroups) {
        lines.push(`\\textbf{${escapeLatex(group.name)}}: ${escapeLatex(group.skills.join(", "))}`);
      }
      lines.push("");
    }

    if (sectionId === "projects" && resume.projects.length) {
      lines.push("\\section*{Projects}");
      for (const project of resume.projects) {
        const projectTitle = project.link
          ? `\\textbf{${escapeLatex(project.name)}} \\hfill \\href{${escapeLatexUrl(normalizeExternalUrl(project.link))}}{${escapeLatex(project.linkLabel || "Link")}}`
          : `\\textbf{${escapeLatex(project.name)}}`;
        lines.push(projectTitle);
        if (project.techStack?.length) {
          lines.push(`\\emph{${escapeLatex(project.techStack.join(", "))}}`);
        }
        lines.push("\\begin{itemize}", bullets(project.bullets), "\\end{itemize}");
      }
      lines.push("");
    }

    if (sectionId === "experience" && resume.experience.length) {
      lines.push("\\section*{Experience}");
      for (const experience of resume.experience) {
        lines.push(
          `\\textbf{${escapeLatex(experience.role)}} -- ${escapeLatex(experience.company)} \\hfill ${escapeLatex(
            formatResumeDateRange(experience.startDate, experience.endDate).replace(" - ", " -- "),
          )}`,
          "\\begin{itemize}",
          bullets(experience.bullets),
          "\\end{itemize}",
        );
      }
      lines.push("");
    }

    if (sectionId === "optional" && resume.optionalSections.length) {
      for (const section of resume.optionalSections) {
        lines.push(`\\section*{${escapeLatex(section.title)}}`, "\\begin{itemize}", bullets(section.items), "\\end{itemize}", "");
      }
    }
  }

  return lines.filter((line, index, list) => line !== "" || list[index - 1] !== "").join("\n");
}
