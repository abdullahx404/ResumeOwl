export function normalizeSkillList(skills: string[]): string[] {
  const cleaned = skills.map((skill) => skill.trim()).filter(Boolean);
  const hasSpecificCssVariant = cleaned.some(
    (skill) => /\bcss\b/i.test(skill) && skill.toLowerCase() !== "css",
  );
  const seen = new Set<string>();

  return cleaned.filter((skill) => {
    const normalized = skill.toLowerCase();

    if (normalized === "css" && hasSpecificCssVariant) {
      return false;
    }

    if (seen.has(normalized)) {
      return false;
    }

    seen.add(normalized);
    return true;
  });
}
