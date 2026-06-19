import type { PersonalInfo } from "@/types/resume";

export type ResumeContactItem = {
  key: keyof PersonalInfo;
  label: string;
  text: string;
  href?: string;
};

function externalUrl(value: string) {
  const trimmed = value.trim();

  if (!trimmed) {
    return "";
  }

  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }

  return `https://${trimmed}`;
}

function profileUrl(service: "github" | "linkedin", value: string) {
  const trimmed = value.trim().replace(/^@/, "");

  if (!trimmed) {
    return "";
  }

  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }

  if (service === "github") {
    return trimmed.includes(".") ? externalUrl(trimmed) : `https://github.com/${trimmed}`;
  }

  return trimmed.includes(".") ? externalUrl(trimmed) : `https://linkedin.com/in/${trimmed}`;
}

export function resumeContactItems(personal: PersonalInfo): ResumeContactItem[] {
  return [
    personal.email
      ? {
          key: "email",
          label: personal.email,
          text: personal.email,
          href: `mailto:${personal.email}`,
        }
      : null,
    personal.phone
      ? {
          key: "phone",
          label: personal.phone,
          text: personal.phone,
          href: `tel:${personal.phone.replace(/[^\d+]/g, "")}`,
        }
      : null,
    personal.location
      ? {
          key: "location",
          label: personal.location,
          text: personal.location,
        }
      : null,
    personal.github
      ? {
          key: "github",
          label: "GitHub",
          text: "GitHub",
          href: profileUrl("github", personal.github),
        }
      : null,
    personal.linkedin
      ? {
          key: "linkedin",
          label: "LinkedIn",
          text: "LinkedIn",
          href: profileUrl("linkedin", personal.linkedin),
        }
      : null,
    personal.portfolio
      ? {
          key: "portfolio",
          label: "Portfolio",
          text: "Portfolio",
          href: externalUrl(personal.portfolio),
        }
      : null,
  ].filter((item): item is ResumeContactItem => Boolean(item));
}
