import { ResumePreview } from "@/components/resume/ResumePreview";
import { PrivacyNotice } from "@/components/layout/PrivacyNotice";

export default function PreviewPage() {
  return (
    <main id="main-content" className="min-h-screen px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <PrivacyNotice />
        <ResumePreview />
      </div>
    </main>
  );
}
