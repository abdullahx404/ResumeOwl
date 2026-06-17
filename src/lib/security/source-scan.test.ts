import { describe, expect, it } from "vitest";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const forbiddenPatterns = [
  "dangerouslySetInnerHTML",
  "localStorage",
  "sessionStorage",
  "console.log",
  "console.error",
];

function sourceFiles(directory: string): string[] {
  return readdirSync(directory).flatMap((entry) => {
    const path = join(directory, entry);
    const stat = statSync(path);

    if (stat.isDirectory()) {
      return sourceFiles(path);
    }

    return /\.(ts|tsx)$/.test(path) ? [path] : [];
  });
}

describe("source privacy and XSS guardrails", () => {
  it("does not introduce raw HTML rendering, browser persistence, or console logging", () => {
    const matches = sourceFiles(join(process.cwd(), "src"))
      .filter((file) => !file.endsWith("source-scan.test.ts"))
      .flatMap((file) => {
        const content = readFileSync(file, "utf8");
        return forbiddenPatterns
          .filter((pattern) => content.includes(pattern))
          .map((pattern) => `${file}: ${pattern}`);
      });

    expect(matches).toEqual([]);
  });
});
