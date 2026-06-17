import Link from "next/link";
import { FileText, PencilLine, SearchCheck } from "lucide-react";

const tools = [
  {
    href: "/preview",
    title: "Resume Preview",
    description: "Edit a LaTeX-style resume, reorder sections, copy source, and print to PDF.",
    icon: FileText,
  },
  {
    href: "/analyzer",
    title: "Resume Analyzer",
    description: "Coming next: match score, missing skills, ATS issues, and recruiter feedback.",
    icon: SearchCheck,
  },
  {
    href: "/maker",
    title: "Resume Maker",
    description: "Coming soon: guided resume creation with editable generated bullets.",
    icon: PencilLine,
  },
];

export default function HomePage() {
  return (
    <main id="main-content" className="min-h-screen px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <header className="flex flex-col gap-4 border-b border-slate-200 pb-8 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-owl-700">
              ResumeOwl
            </p>
            <h1 className="mt-2 max-w-3xl text-4xl font-semibold tracking-normal text-ink">
              Private resume tooling without accounts or database storage.
            </h1>
          </div>
          <p className="max-w-sm rounded-full border border-owl-100 bg-owl-50 px-4 py-2 text-sm font-medium text-owl-900">
            Data stays saved only in this browser unless you clear site data.
          </p>
        </header>

        <section className="grid gap-4 py-8 md:grid-cols-3">
          {tools.map((tool) => {
            const Icon = tool.icon;

            return (
              <Link
                key={tool.href}
                href={tool.href}
                className="rounded-lg border border-slate-200 bg-white p-5 shadow-soft transition hover:-translate-y-0.5 hover:border-owl-100"
              >
                <Icon className="h-6 w-6 text-owl-700" aria-hidden="true" />
                <h2 className="mt-4 text-lg font-semibold text-ink">{tool.title}</h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">{tool.description}</p>
              </Link>
            );
          })}
        </section>
      </div>
    </main>
  );
}
