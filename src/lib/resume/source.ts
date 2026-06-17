import type { ResumeDocument } from "@/types/resume";
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

function bullets(items: string[]): string {
  return items.map((item) => `  \\item ${escapeLatex(item)}`).join("\n");
}

export function createLatexStyleSource(resume: ResumeDocument): string {
  const lines = [
    `\\textbf{\\Large ${escapeLatex(resume.personal.fullName)}}`,
    resume.personal.title ? escapeLatex(resume.personal.title) : "",
    [
      resume.personal.email,
      resume.personal.phone,
      resume.personal.location,
      resume.personal.github,
      resume.personal.linkedin,
      resume.personal.portfolio,
    ]
      .filter(Boolean)
      .map((item) => escapeLatex(item ?? ""))
      .join(" $\\cdot$ "),
    "",
  ];

  if (resume.summary) {
    lines.push("\\section*{Summary}", escapeLatex(resume.summary), "");
  }

  for (const sectionId of resume.sectionOrder) {
    if (sectionId === "education" && resume.education.length) {
      lines.push("\\section*{Education}");
      for (const education of resume.education) {
        lines.push(
          `\\textbf{${escapeLatex(education.institute)}} \\hfill ${escapeLatex(
            formatResumeDateRange(education.startDate, education.endDate).replace(" - ", " -- "),
          )}`,
          `${escapeLatex(education.degree)}${education.cgpa ? `, CGPA ${escapeLatex(education.cgpa)}` : ""}`,
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
        lines.push(`\\textbf{${escapeLatex(project.name)}}`);
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
