export const commonCourses = [
  "Algorithms",
  "Artificial Intelligence",
  "Calculus",
  "Computer Architecture",
  "Computer Networks",
  "Data Structures",
  "Database Systems",
  "Deep Learning",
  "Discrete Mathematics",
  "Machine Learning",
  "Object Oriented Programming",
  "Operating Systems",
  "Probability and Statistics",
  "Software Engineering",
  "Web Engineering",
];

export const commonSkills = [
  "AWS",
  "C++",
  "Docker",
  "Express.js",
  "FastAPI",
  "Firebase",
  "Git",
  "Java",
  "JavaScript",
  "MongoDB",
  "Next.js",
  "Node.js",
  "PostgreSQL",
  "Python",
  "React",
  "SQL",
  "Tailwind CSS",
  "TypeScript",
];

export function filterOptions(options: string[], query: string): string[] {
  const normalized = query.trim().toLowerCase();

  if (!normalized) {
    return options.slice(0, 8);
  }

  return options
    .filter((option) => option.toLowerCase().includes(normalized))
    .slice(0, 8);
}

export function addUniqueValue(values: string[], value: string): string[] {
  const trimmed = value.trim();

  if (!trimmed) {
    return values;
  }

  if (values.some((item) => item.toLowerCase() === trimmed.toLowerCase())) {
    return values;
  }

  return [...values, trimmed];
}
