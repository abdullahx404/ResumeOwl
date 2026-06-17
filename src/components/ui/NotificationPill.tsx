import { AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

type NotificationPillProps = {
  message?: string;
  tone?: "info" | "warning" | "error";
};

export function NotificationPill({
  message,
  tone = "warning",
}: NotificationPillProps) {
  if (!message) {
    return null;
  }

  return (
    <div
      className={cn(
        "fixed right-4 top-4 z-50 flex max-w-[calc(100vw-2rem)] items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium shadow-soft",
        tone === "info" && "border-blue-200 bg-blue-50 text-blue-900",
        tone === "warning" && "border-amber-200 bg-amber-50 text-amber-950",
        tone === "error" && "border-red-200 bg-red-50 text-red-950",
      )}
      role="status"
      aria-live="polite"
    >
      <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
      <span>{message}</span>
    </div>
  );
}
