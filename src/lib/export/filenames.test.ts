import { describe, expect, it, vi } from "vitest";
import { downloadBlob, safeFileName } from "./filenames";

describe("safeFileName", () => {
  it("creates a filesystem-safe lowercase slug", () => {
    expect(safeFileName("Ali Raza / Resume 2026")).toBe("ali-raza-resume-2026");
  });

  it("uses fallback for empty names", () => {
    expect(safeFileName("   ")).toBe("resumeowl-resume");
  });
});

describe("downloadBlob", () => {
  it("creates and revokes an object URL", () => {
    const createObjectURL = vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:test");
    const revokeObjectURL = vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => undefined);
    const click = vi.fn();
    const append = vi.spyOn(document.body, "append");
    const createElement = vi.spyOn(document, "createElement");

    createElement.mockReturnValue({
      click,
      remove: vi.fn(),
      set href(value: string) {
        expect(value).toBe("blob:test");
      },
      set download(value: string) {
        expect(value).toBe("resume.docx");
      },
    } as unknown as HTMLAnchorElement);

    downloadBlob(new Blob(["x"]), "resume.docx");

    expect(createObjectURL).toHaveBeenCalled();
    expect(append).toHaveBeenCalled();
    expect(click).toHaveBeenCalled();
    expect(revokeObjectURL).toHaveBeenCalledWith("blob:test");

    createObjectURL.mockRestore();
    revokeObjectURL.mockRestore();
    append.mockRestore();
    createElement.mockRestore();
  });
});
