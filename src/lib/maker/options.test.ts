import { describe, expect, it } from "vitest";
import { addUniqueValue, autoGroupSkills, commonCourses, filterOptions } from "./options";

describe("maker options", () => {
  it("filters options by query", () => {
    expect(filterOptions(commonCourses, "data")).toEqual(
      expect.arrayContaining(["Data Structures", "Database Systems"]),
    );
  });

  it("adds custom values once", () => {
    expect(addUniqueValue(["React"], "react")).toEqual(["React"]);
    expect(addUniqueValue(["React"], "Next.js")).toEqual(["React", "Next.js"]);
  });

  it("auto-groups skills by category", () => {
    const groups = autoGroupSkills(["React", "FastAPI", "PostgreSQL", "PyTorch", "CustomTool"]);

    expect(groups.find((group) => group.name === "Frontend")?.skills).toContain("React");
    expect(groups.find((group) => group.name === "Backend")?.skills).toContain("FastAPI");
    expect(groups.find((group) => group.name === "Databases")?.skills).toContain("PostgreSQL");
    expect(groups.find((group) => group.name === "AI/ML")?.skills).toContain("PyTorch");
    expect(groups.find((group) => group.name === "Other")?.skills).toContain("CustomTool");
  });
});
