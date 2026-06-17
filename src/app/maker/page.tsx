import { MakerWorkspace } from "@/components/maker/MakerWorkspace";
import { PrivacyNotice } from "@/components/layout/PrivacyNotice";

export default function MakerPage() {
  return (
    <main id="main-content" className="min-h-screen px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <PrivacyNotice />
        <MakerWorkspace />
      </div>
    </main>
  );
}
