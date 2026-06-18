import {
  Document,
  ExternalHyperlink,
  HeadingLevel,
  Packer,
  Paragraph,
  TextRun,
} from "docx";
import { normalizeExternalUrl } from "@/lib/maker/bullets";
import { formatResumeDateRange } from "@/lib/resume/dates";
import type { ResumeDocument, ResumeSectionId } from "@/types/resume";

function heading(text: string) {
  return new Paragraph({
    text,
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 180, after: 80 },
  });
}

function inlineTextRuns(text: string) {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part) =>
    part.startsWith("**") && part.endsWith("**")
      ? new TextRun({ text: part.slice(2, -2), bold: true })
      : new TextRun(part),
  );
}

function bullet(text: string) {
  return new Paragraph({
    children: inlineTextRuns(text),
    bullet: { level: 0 },
    spacing: { after: 60 },
  });
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

export function buildDocxDocument(resume: ResumeDocument): Document {
  const children: Paragraph[] = [
    new Paragraph({
      alignment: "center",
      children: [
        new TextRun({
          text: resume.personal.fullName,
          bold: true,
          size: 28,
        }),
      ],
    }),
    new Paragraph({
      alignment: "center",
      text: resume.personal.title ?? "",
    }),
    new Paragraph({
      alignment: "center",
      text: [
        resume.personal.email,
        resume.personal.phone,
        resume.personal.location,
        resume.personal.github,
        resume.personal.linkedin,
        resume.personal.portfolio,
      ]
        .filter(Boolean)
        .join(" | "),
    }),
  ];

  if (resume.summary) {
    children.push(heading("Summary"), new Paragraph(resume.summary));
  }

  for (const sectionId of resume.sectionOrder) {
    if (sectionId === "education" && (resume.education.length || resume.courses.length)) {
      children.push(heading(sectionTitle(sectionId)));
      for (const item of resume.education) {
        children.push(
          new Paragraph({
            children: [
              new TextRun({ text: item.institute, bold: true }),
              new TextRun({
                text: ` ${formatResumeDateRange(item.startDate, item.endDate)}`,
              }),
            ],
          }),
          new Paragraph(`${item.degree}${item.cgpa ? `, CGPA ${item.cgpa}` : ""}`),
        );
        item.details?.forEach((detail) => children.push(bullet(detail)));
      }
      if (resume.courses.length) {
        children.push(new Paragraph(`Relevant Courses: ${resume.courses.join(", ")}`));
      }
    }

    if (sectionId === "skills" && resume.skillGroups.length) {
      children.push(heading(sectionTitle(sectionId)));
      resume.skillGroups.forEach((group) => {
        children.push(new Paragraph(`${group.name}: ${group.skills.join(", ")}`));
      });
    }

    if (sectionId === "projects" && resume.projects.length) {
      children.push(heading(sectionTitle(sectionId)));
      resume.projects.forEach((project) => {
        children.push(new Paragraph({
          children: [
            new TextRun({ text: project.name, bold: true }),
            ...(project.link
              ? [
                  new TextRun({ text: " " }),
                  new ExternalHyperlink({
                    link: normalizeExternalUrl(project.link),
                    children: [
                      new TextRun({
                        text: project.linkLabel || "Link",
                        style: "Hyperlink",
                      }),
                    ],
                  }),
                ]
              : []),
          ],
        }));
        if (project.techStack?.length) {
          children.push(new Paragraph(project.techStack.join(", ")));
        }
        project.bullets.forEach((item) => children.push(bullet(item)));
      });
    }

    if (sectionId === "experience" && resume.experience.length) {
      children.push(heading(sectionTitle(sectionId)));
      resume.experience.forEach((item) => {
        children.push(
          new Paragraph({
            children: [
              new TextRun({ text: `${item.role}, ${item.company}`, bold: true }),
              new TextRun({
                text: ` ${formatResumeDateRange(item.startDate, item.endDate)}`,
              }),
            ],
          }),
        );
        item.bullets.forEach((bulletText) => children.push(bullet(bulletText)));
      });
    }

    if (sectionId === "optional" && resume.optionalSections.length) {
      resume.optionalSections.forEach((section) => {
        children.push(heading(section.title));
        section.items.forEach((item) => children.push(bullet(item)));
      });
    }
  }

  return new Document({
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: 720,
              right: 720,
              bottom: 720,
              left: 720,
            },
          },
        },
        children,
      },
    ],
  });
}

export async function createDocxBlob(resume: ResumeDocument): Promise<Blob> {
  return Packer.toBlob(buildDocxDocument(resume));
}
