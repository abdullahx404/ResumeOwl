import type { ResumeDocument, ResumeSectionId } from "@/types/resume";

export function moveSection(
  resume: ResumeDocument,
  sectionId: ResumeSectionId,
  direction: "up" | "down",
): ResumeDocument {
  const currentIndex = resume.sectionOrder.indexOf(sectionId);

  if (currentIndex === -1) {
    return resume;
  }

  const targetIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;

  if (targetIndex < 0 || targetIndex >= resume.sectionOrder.length) {
    return resume;
  }

  const nextOrder = [...resume.sectionOrder];
  [nextOrder[currentIndex], nextOrder[targetIndex]] = [
    nextOrder[targetIndex],
    nextOrder[currentIndex],
  ];

  return {
    ...resume,
    sectionOrder: nextOrder,
  };
}

export function removeSection(
  resume: ResumeDocument,
  sectionId: ResumeSectionId,
): ResumeDocument {
  return {
    ...resume,
    sectionOrder: resume.sectionOrder.filter((id) => id !== sectionId),
  };
}

export function addSection(
  resume: ResumeDocument,
  sectionId: ResumeSectionId,
): ResumeDocument {
  if (resume.sectionOrder.includes(sectionId)) {
    return resume;
  }

  return {
    ...resume,
    sectionOrder: [...resume.sectionOrder, sectionId],
  };
}
