import { describe, expect, it } from "vitest";
import { extractJsonObject } from "./json";

describe("extractJsonObject", () => {
  it("parses raw JSON", () => {
    expect(extractJsonObject('{"ok":true}')).toEqual({ ok: true });
  });

  it("parses fenced JSON", () => {
    expect(extractJsonObject('```json\n{"ok":true}\n```')).toEqual({ ok: true });
  });

  it("parses JSON embedded in surrounding text", () => {
    expect(extractJsonObject('Here is the result {"ok":true} done')).toEqual({
      ok: true,
    });
  });
});
