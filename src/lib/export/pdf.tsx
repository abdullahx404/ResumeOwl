import {
  Document,
  Link,
  Page,
  StyleSheet,
  Text,
  View,
  pdf,
} from "@react-pdf/renderer";
import { normalizeExternalUrl } from "@/lib/maker/bullets";
import { formatAcademicScore } from "@/lib/resume/academic-score";
import { resumeContactItems } from "@/lib/resume/contact";
import { formatResumeDateRange } from "@/lib/resume/dates";
import { normalizeSkillList } from "@/lib/resume/skills";
import type { ResumeDocument, ResumeSectionId } from "@/types/resume";

const styles = StyleSheet.create({
  page: {
    paddingHorizontal: 48,
    paddingVertical: 42,
    fontFamily: "Times-Roman",
    fontSize: 10.5,
    color: "#111827",
    lineHeight: 1.42,
    backgroundColor: "#ffffff",
  },
  header: {
    marginBottom: 18,
    textAlign: "center",
  },
  name: {
    fontSize: 24,
    fontFamily: "Times-Bold",
    textTransform: "uppercase",
    letterSpacing: 0,
    marginBottom: 8,
  },
  title: {
    marginTop: 2,
    fontSize: 12,
    fontFamily: "Times-Bold",
    color: "#374151",
  },
  contactRow: {
    marginTop: 9,
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    color: "#4b5563",
  },
  contactLink: {
    color: "#2563eb",
    textDecoration: "none",
  },
  contactText: {
    color: "#4b5563",
    textDecoration: "none",
  },
  section: {
    marginTop: 13,
  },
  heading: {
    marginBottom: 7,
    borderBottomWidth: 1,
    borderBottomColor: "#cbd5e1",
    paddingBottom: 3,
    fontSize: 12,
    fontFamily: "Times-Bold",
    textTransform: "uppercase",
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10,
  },
  itemTitle: {
    fontFamily: "Times-Bold",
  },
  muted: {
    color: "#4b5563",
  },
  paragraph: {
    color: "#374151",
  },
  bulletRow: {
    marginTop: 4,
    flexDirection: "row",
  },
  bulletDot: {
    width: 12,
    paddingTop: 1,
  },
  bulletText: {
    flex: 1,
    color: "#1f2937",
  },
  inlineBold: {
    fontFamily: "Times-Bold",
  },
  projectMeta: {
    maxWidth: 260,
    textAlign: "right",
    color: "#4b5563",
  },
  projectLink: {
    marginLeft: 12,
    color: "#2563eb",
    fontFamily: "Times-Italic",
    textDecoration: "none",
  },
});

const sectionLabels: Record<ResumeSectionId, string> = {
  education: "Education",
  skills: "Skills",
  projects: "Projects",
  experience: "Experience",
  optional: "Optional sections",
};

function hasSectionContent(sectionId: ResumeSectionId, resume: ResumeDocument) {
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

function cleanStrongMarkers(text: string) {
  return text.replace(/\*\*/g, "");
}

function InlineStrong({ text }: { text: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);

  return (
    <Text>
      {parts.map((part, index) =>
        part.startsWith("**") && part.endsWith("**") ? (
          <Text key={`${part}-${index}`} style={styles.inlineBold}>
            {part.slice(2, -2)}
          </Text>
        ) : (
          <Text key={`${part}-${index}`}>{part}</Text>
        ),
      )}
    </Text>
  );
}

function BulletList({ items }: { items: string[] }) {
  return (
    <View>
      {items.filter(Boolean).map((item, index) => (
        <View key={`${item}-${index}`} style={styles.bulletRow} wrap={false}>
          <Text style={styles.bulletDot}>•</Text>
          <Text style={styles.bulletText}>
            <InlineStrong text={item} />
          </Text>
        </View>
      ))}
    </View>
  );
}

function ContactLine({ resume }: { resume: ResumeDocument }) {
  const contactItems = resumeContactItems(resume.personal);

  return (
    <View style={styles.contactRow}>
      {contactItems.map((item, index) => (
        <Text key={item.key}>
          <Text style={styles.contactText}>{index > 0 ? " | " : ""}</Text>
          {item.href && item.key !== "phone" ? (
            <Link style={styles.contactLink} src={item.href}>
              {item.label}
            </Link>
          ) : (
            <Text style={styles.contactText}>{item.label}</Text>
          )}
        </Text>
      ))}
    </View>
  );
}

function EducationSection({ resume }: { resume: ResumeDocument }) {
  return (
    <View style={styles.section} wrap={false}>
      <Text style={styles.heading}>{sectionLabels.education}</Text>
      {resume.education.map((item) => (
        <View key={item.id} style={{ marginBottom: 8 }}>
          <View style={styles.row}>
            <Text style={styles.itemTitle}>{item.institute}</Text>
            <Text style={styles.muted}>{formatResumeDateRange(item.startDate, item.endDate)}</Text>
          </View>
          <Text style={styles.paragraph}>
            {item.degree}
            {item.cgpa ? `, ${formatAcademicScore(item.cgpa)}` : ""}
          </Text>
          {item.details?.length ? <BulletList items={item.details} /> : null}
        </View>
      ))}
      {resume.courses.length ? (
        <Text style={styles.paragraph}>
          <Text style={styles.inlineBold}>Relevant Courses: </Text>
          {resume.courses.join(", ")}
        </Text>
      ) : null}
    </View>
  );
}

function SkillsSection({ resume }: { resume: ResumeDocument }) {
  return (
    <View style={styles.section} wrap={false}>
      <Text style={styles.heading}>{sectionLabels.skills}</Text>
      {resume.skillGroups
        .filter((group) => group.skills.length)
        .map((group) => (
          <Text key={group.id} style={styles.paragraph}>
            <Text style={styles.inlineBold}>{group.name}: </Text>
            {normalizeSkillList(group.skills).join(", ")}
          </Text>
        ))}
    </View>
  );
}

function ProjectsSection({ resume }: { resume: ResumeDocument }) {
  return (
    <View style={styles.section}>
      <Text style={styles.heading}>{sectionLabels.projects}</Text>
      {resume.projects.map((project) => (
        <View key={project.id} style={{ marginBottom: 10 }} wrap={false}>
          <View style={styles.row}>
            <Text>
              <Text style={styles.itemTitle}>{project.name}</Text>
              {project.link ? (
                <Link style={styles.projectLink} src={normalizeExternalUrl(project.link)}>
                  {project.linkLabel || "Link"}
                </Link>
              ) : null}
            </Text>
            {project.techStack?.length ? (
              <Text style={styles.projectMeta}>{normalizeSkillList(project.techStack).join(", ")}</Text>
            ) : null}
          </View>
          <BulletList items={project.bullets.map(cleanStrongMarkers)} />
        </View>
      ))}
    </View>
  );
}

function ExperienceSection({ resume }: { resume: ResumeDocument }) {
  return (
    <View style={styles.section}>
      <Text style={styles.heading}>{sectionLabels.experience}</Text>
      {resume.experience.map((item) => (
        <View key={item.id} style={{ marginBottom: 10 }} wrap={false}>
          <View style={styles.row}>
            <Text style={styles.itemTitle}>
              {item.role}, {item.company}
            </Text>
            <Text style={styles.muted}>{formatResumeDateRange(item.startDate, item.endDate)}</Text>
          </View>
          <BulletList items={item.bullets.map(cleanStrongMarkers)} />
        </View>
      ))}
    </View>
  );
}

function OptionalSections({ resume }: { resume: ResumeDocument }) {
  return (
    <>
      {resume.optionalSections
        .filter((section) => section.items.some((item) => item.trim()))
        .map((section) => (
          <View key={section.id} style={styles.section} wrap={false}>
            <Text style={styles.heading}>{section.title}</Text>
            <BulletList items={section.items.map(cleanStrongMarkers)} />
          </View>
        ))}
    </>
  );
}

function ResumePdfDocument({ resume }: { resume: ResumeDocument }) {
  const visibleSectionOrder = resume.sectionOrder.filter((sectionId) =>
    hasSectionContent(sectionId, resume),
  );

  return (
    <Document title={`${resume.personal.fullName || "Resume"} - ResumeOwl`}>
      <Page size="A4" style={styles.page}>
        <View style={styles.header} wrap={false}>
          <Text style={styles.name}>{resume.personal.fullName}</Text>
          {resume.personal.title ? <Text style={styles.title}>{resume.personal.title}</Text> : null}
          <ContactLine resume={resume} />
        </View>

        {resume.summary?.trim() ? (
          <View style={styles.section} wrap={false}>
            <Text style={styles.heading}>Summary</Text>
            <Text style={styles.paragraph}>{resume.summary}</Text>
          </View>
        ) : null}

        {visibleSectionOrder.map((sectionId) => {
          if (sectionId === "education") {
            return <EducationSection key={sectionId} resume={resume} />;
          }

          if (sectionId === "skills") {
            return <SkillsSection key={sectionId} resume={resume} />;
          }

          if (sectionId === "projects") {
            return <ProjectsSection key={sectionId} resume={resume} />;
          }

          if (sectionId === "experience") {
            return <ExperienceSection key={sectionId} resume={resume} />;
          }

          return <OptionalSections key={sectionId} resume={resume} />;
        })}
      </Page>
    </Document>
  );
}

export async function createPdfBlob(resume: ResumeDocument) {
  return pdf(<ResumePdfDocument resume={resume} />).toBlob();
}
