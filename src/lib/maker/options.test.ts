import { describe, expect, it } from "vitest";
import { addUniqueValue, commonCourses, filterOptions } from "./options";

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
});
