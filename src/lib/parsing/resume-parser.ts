import type { ParsedResumeFile } from "@/types/resume";
import { getFileExtension, validateResumeFiles } from "./file-validation";

async function extractPdfText(file: File): Promise<string> {
  const pdfjs = await import("pdfjs-dist");
  pdfjs.GlobalWorkerOptions.workerSrc = new URL(
    "pdfjs-dist/build/pdf.worker.min.mjs",
    import.meta.url,
  ).toString();

  const data = await file.arrayBuffer();
  const pdf = await pdfjs.getDocument({ data }).promise;
  const pages: string[] = [];

  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
    const page = await pdf.getPage(pageNumber);
    const content = await page.getTextContent();
    const pageText = content.items
      .map((item) => ("str" in item ? item.str : ""))
      .join(" ");
    pages.push(pageText);
  }

  return pages.join("\n\n").trim();
}

async function extractDocxText(file: File): Promise<string> {
  const mammoth = await import("mammoth/mammoth.browser");
  const arrayBuffer = await file.arrayBuffer();
  const result = await mammoth.extractRawText({ arrayBuffer });

  return result.value.trim();
}

async function extractTextFile(file: File): Promise<string> {
  return (await file.text()).trim();
}

export async function parseResumeFile(file: File): Promise<ParsedResumeFile> {
  const extension = getFileExtension(file.name);

  if (extension === ".pdf") {
    return {
      name: file.name,
      type: "pdf",
      text: await extractPdfText(file),
    };
  }

  if (extension === ".docx") {
    return {
      name: file.name,
      type: "docx",
      text: await extractDocxText(file),
    };
  }

  return {
    name: file.name,
    type: "text",
    text: await extractTextFile(file),
  };
}

export async function parseResumeFiles(files: File[]): Promise<ParsedResumeFile[]> {
  const validation = validateResumeFiles(files);

  if (!validation.valid) {
    throw new Error(validation.message ?? "Resume files could not be parsed.");
  }

  const parsed = await Promise.all(files.map((file) => parseResumeFile(file)));

  return parsed.filter((file) => file.text.length > 0);
}
