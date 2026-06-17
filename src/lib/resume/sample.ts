import type { ResumeDocument } from "@/types/resume";

export const sampleResume: ResumeDocument = {
  personal: {
    fullName: "Amina Khan",
    title: "Software Engineering Student",
    email: "amina@example.com",
    phone: "+92 300 0000000",
    github: "https://github.com/amina",
    linkedin: "https://linkedin.com/in/amina",
    portfolio: "https://amina.dev",
    location: "Lahore, Pakistan",
  },
  summary:
    "Software engineering student focused on full-stack web apps, clean UI systems, and practical AI-assisted tooling.",
  education: [
    {
      id: "edu-1",
      institute: "National University of Computer and Emerging Sciences",
      degree: "BS Software Engineering",
      startDate: "2022",
      endDate: "2026",
      cgpa: "3.72/4.00",
      details: ["Relevant coursework: Data Structures, Databases, Web Engineering"],
    },
  ],
  courses: ["Data Structures", "Database Systems", "Web Engineering"],
  skillGroups: [
    {
      id: "skills-1",
      name: "Programming",
      skills: ["TypeScript", "Python", "Java"],
    },
    {
      id: "skills-2",
      name: "Web",
      skills: ["React", "Next.js", "Tailwind CSS", "Node.js"],
    },
  ],
  projects: [
    {
      id: "project-1",
      name: "ResumeOwl Prototype",
      link: "https://github.com/example/resumeowl",
      techStack: ["Next.js", "TypeScript", "Tailwind CSS"],
      bullets: [
        "Built a resume preview workflow with editable sections and print-focused styling.",
        "Designed privacy-first state handling so resume data stays in the active browser session.",
        "Created reusable validation schemas for resume sections and contact details.",
      ],
    },
  ],
  experience: [
    {
      id: "exp-1",
      role: "Frontend Intern",
      company: "Local Software Studio",
      startDate: "Jun 2025",
      endDate: "Aug 2025",
      bullets: [
        "Implemented reusable React components for internal dashboard screens.",
        "Improved form validation messages and reduced repeated support requests from testers.",
      ],
    },
  ],
  optionalSections: [
    {
      id: "optional-1",
      title: "Achievements",
      items: ["Finalist in university web engineering project showcase."],
    },
  ],
  sectionOrder: ["education", "skills", "projects", "experience", "optional"],
};
