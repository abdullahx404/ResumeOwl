const stopWords = new Set([
  "a",
  "an",
  "and",
  "are",
  "as",
  "at",
  "be",
  "by",
  "for",
  "from",
  "in",
  "is",
  "it",
  "of",
  "on",
  "or",
  "that",
  "the",
  "to",
  "with",
  "you",
  "your",
  "our",
  "we",
  "will",
  "this",
]);

const protectedTerms = new Map<string, string>([
  ["react.js", "react"],
  ["node.js", "node.js"],
  ["next.js", "next.js"],
  ["typescript", "typescript"],
  ["javascript", "javascript"],
  ["machine learning", "machine learning"],
  ["data structures", "data structures"],
  ["rest api", "rest api"],
  ["apis", "api"],
]);

export function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}.+#\s-]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function tokenize(text: string): string[] {
  return normalizeText(text)
    .split(" ")
    .map((token) => token.replace(/^[.-]+|[.-]+$/g, ""))
    .map((token) => protectedTerms.get(token) ?? token)
    .filter((token) => token.length > 2 && !stopWords.has(token));
}

export function extractKeywords(text: string, limit = 25): string[] {
  const normalized = normalizeText(text);
  const phrases = Array.from(protectedTerms.keys()).filter((term) =>
    normalized.includes(term),
  );
  const counts = new Map<string, number>();

  for (const token of tokenize(text)) {
    counts.set(token, (counts.get(token) ?? 0) + 1);
  }

  const ranked = [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([keyword]) => keyword);

  return [...new Set([...ranked, ...phrases.map((term) => protectedTerms.get(term) ?? term)])].slice(
    0,
    limit,
  );
}

export function hasTerm(text: string, term: string): boolean {
  return normalizeText(text).includes(normalizeText(term));
}

export function splitLines(text: string): string[] {
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}
