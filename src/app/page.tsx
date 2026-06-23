import Link from "next/link";
import { ClipboardEdit, FileText, PencilLine, SearchCheck } from "lucide-react";

const tools = [
  {
    href: "/preview",
    title: "Resume Preview",
    description: "Edit a clean resume preview, reorder sections, copy source, and export.",
    icon: FileText,
  },
  {
    href: "/editor",
    title: "Resume Editor",
    description: "Paste an existing resume and reshape it into ResumeOwl's editable format.",
    icon: ClipboardEdit,
  },
  {
    href: "/analyzer",
    title: "Resume Analyzer",
    description: "Check skill coverage, ATS issues, weak bullets, and fit for a target role.",
    icon: SearchCheck,
  },
  {
    href: "/maker",
    title: "Resume Maker",
    description: "Build a resume from structured inputs with editable bullets and live preview.",
    icon: PencilLine,
  },
];

export default function HomePage() {
  return (
    <main id="main-content" className="app-page subtle-grid min-h-screen px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <header className="motion-surface border-b border-slate-200 pb-8">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-owl-700">
              ResumeOwl
            </p>
            <h1 className="mt-2 max-w-3xl text-4xl font-semibold tracking-normal text-ink">
              Build, review, and export a focused resume in your browser.
            </h1>
          </div>
        </header>

        <section className="grid gap-4 py-8 md:grid-cols-2 xl:grid-cols-4">
          {tools.map((tool, index) => {
            const Icon = tool.icon;

            return (
              <Link
                key={tool.href}
                href={tool.href}
                className="interactive-surface motion-surface touch-feedback surface-card rounded-lg p-5 shadow-soft hover:border-owl-100"
                style={{ animationDelay: `${index * 45}ms` }}
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
