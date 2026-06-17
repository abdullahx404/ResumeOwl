export const commonCourses = [
  "Accounting",
  "Advanced Algorithms",
  "Aerodynamics",
  "AI Ethics",
  "Algorithms",
  "Analog Electronics",
  "Applied Linear Algebra",
  "Artificial Intelligence",
  "Automata Theory",
  "Big Data Analytics",
  "Calculus I",
  "Calculus II",
  "Chemical Process Control",
  "Circuit Analysis",
  "Civil Engineering Materials",
  "Cloud Computing",
  "Compiler Construction",
  "Computer Architecture",
  "Computer Graphics",
  "Computer Networks",
  "Control Systems",
  "Data Mining",
  "Data Science",
  "Data Structures",
  "Database Systems",
  "Deep Learning",
  "Design and Analysis of Algorithms",
  "Differential Equations",
  "Digital Logic Design",
  "Digital Signal Processing",
  "Discrete Mathematics",
  "Distributed Systems",
  "Electric Machines",
  "Embedded Systems",
  "Engineering Economics",
  "Fluid Mechanics",
  "Heat Transfer",
  "Human Computer Interaction",
  "Information Security",
  "Linear Algebra",
  "Machine Learning",
  "Manufacturing Processes",
  "Materials Science",
  "Mechanics of Materials",
  "Microcontrollers",
  "Natural Language Processing",
  "Numerical Methods",
  "Object Oriented Programming",
  "Operating Systems",
  "Power Systems",
  "Probability and Statistics",
  "Project Management",
  "Reinforced Concrete Design",
  "Software Architecture",
  "Software Engineering",
  "Software Project Management",
  "Software Quality Assurance",
  "Structural Analysis",
  "Thermodynamics",
  "Transportation Engineering",
  "Web Engineering",
];

export const commonSkills = [
  "AWS",
  "Azure",
  "C",
  "C#",
  "C++",
  "CSS",
  "Django",
  "Docker",
  "Express.js",
  "FastAPI",
  "Figma",
  "Firebase",
  "Flask",
  "Git",
  "GitHub Actions",
  "Go",
  "GraphQL",
  "HTML",
  "Java",
  "JavaScript",
  "Jest",
  "Keras",
  "Kubernetes",
  "LangChain",
  "Linux",
  "MATLAB",
  "MongoDB",
  "MySQL",
  "Next.js",
  "Node.js",
  "NumPy",
  "OpenCV",
  "Pandas",
  "Playwright",
  "PostgreSQL",
  "Power BI",
  "Python",
  "PyTorch",
  "React",
  "Redis",
  "REST APIs",
  "Rust",
  "Scikit-learn",
  "SQL",
  "Supabase",
  "Tailwind CSS",
  "TensorFlow",
  "TypeScript",
  "Vercel",
  "Vue.js",
];

const skillGroups: Record<string, string[]> = {
  "Programming Languages": ["c", "c#", "c++", "go", "java", "javascript", "python", "rust", "typescript"],
  Frontend: ["css", "figma", "html", "next.js", "react", "tailwind css", "vue.js"],
  Backend: ["django", "express.js", "fastapi", "flask", "graphql", "node.js", "rest apis"],
  Databases: ["firebase", "mongodb", "mysql", "postgresql", "redis", "sql", "supabase"],
  "AI/ML": ["keras", "langchain", "machine learning", "numpy", "opencv", "pandas", "pytorch", "scikit-learn", "tensorflow"],
  "Cloud/DevOps": ["aws", "azure", "docker", "github actions", "kubernetes", "linux", "vercel"],
  "Data/Analytics": ["matlab", "power bi"],
  Testing: ["jest", "playwright"],
};

export function filterOptions(options: string[], query: string): string[] {
  const normalized = query.trim().toLowerCase();

  if (!normalized) {
    return options.slice(0, 12);
  }

  return options
    .filter((option) => option.toLowerCase().includes(normalized))
    .slice(0, 12);
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

export function autoGroupSkills(skills: string[]) {
  const grouped = Object.entries(skillGroups)
    .map(([name, groupSkills]) => ({
      id: `skills-${name.toLowerCase().replaceAll(/[^a-z0-9]+/g, "-")}`,
      name,
      skills: skills.filter((skill) => groupSkills.includes(skill.toLowerCase())),
    }))
    .filter((group) => group.skills.length > 0);
  const used = new Set(grouped.flatMap((group) => group.skills.map((skill) => skill.toLowerCase())));
  const other = skills.filter((skill) => !used.has(skill.toLowerCase()));

  return other.length ? [...grouped, { id: "skills-other", name: "Other", skills: other }] : grouped;
}
