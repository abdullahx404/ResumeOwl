import { AnalyzerWorkspace } from "@/components/analyzer/AnalyzerWorkspace";

export default function AnalyzerPage() {
  return (
    <main id="main-content" className="min-h-screen px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <AnalyzerWorkspace />
      </div>
    </main>
  );
}
