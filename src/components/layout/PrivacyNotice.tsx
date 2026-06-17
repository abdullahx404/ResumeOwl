import { ShieldCheck } from "lucide-react";

export function PrivacyNotice() {
  return (
    <div className="mb-5 rounded-lg border border-owl-100 bg-owl-50 px-4 py-3 text-sm text-owl-950">
      <div className="flex gap-3">
        <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-owl-700" aria-hidden="true" />
        <p className="leading-6">
          No login, no database, and no saved resume history. Current drafts stay in memory for this browser session unless you download or copy them.
        </p>
      </div>
    </div>
  );
}
