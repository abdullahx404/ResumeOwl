import Link from "next/link";

export default function RefactorPage() {
  return (
    <main className="min-h-screen px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl rounded-lg border border-slate-200 bg-white p-6 shadow-soft">
        <p className="text-sm font-semibold uppercase tracking-wide text-owl-700">
          Phase 5
        </p>
        <h1 className="mt-2 text-3xl font-semibold text-ink">Resume Refactor</h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          The refactor workflow will use the parser, ATS engine, and shared preview foundation.
        </p>
        <Link
          href="/preview"
          className="mt-5 inline-flex rounded-md bg-owl-700 px-4 py-2 text-sm font-semibold text-white hover:bg-owl-900"
        >
          Open current preview
        </Link>
      </div>
    </main>
  );
}
