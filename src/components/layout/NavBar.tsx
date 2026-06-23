"use client";

import Link from "next/link";
import { FileText } from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import NavHeader from "@/components/ui/nav-header";
import { getStoredProfile } from "@/lib/resume/persistence";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "./ThemeToggle";

const links = [
  { href: "/", label: "Home" },
  { href: "/preview", label: "Preview" },
  { href: "/analyzer", label: "Analyze" },
  { href: "/maker", label: "Make" },
];

export function NavBar() {
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState("Guest");

  useEffect(() => {
    setLoading(false);
  }, [pathname]);

  useEffect(() => {
    setName(getStoredProfile()?.fullName || "Guest");
  }, []);

  function beginNavigation() {
    setLoading(true);
    startTransition(() => undefined);
  }

  const activeHref =
    links.find((link) => (link.href === "/" ? pathname === "/" : pathname.startsWith(link.href)))
      ?.href ?? "/";

  return (
    <header className="no-print sticky top-0 z-40 bg-white/72 px-4 py-3 shadow-[0_10px_30px_rgba(15,23,42,0.08)] backdrop-blur-2xl sm:px-6 lg:px-8">
      <div
        className={cn(
          "absolute inset-x-0 top-0 h-0.5 origin-left bg-owl-600 transition-transform duration-300",
          loading || isPending ? "scale-x-100" : "scale-x-0",
        )}
      />
      <nav className="relative mx-auto flex min-h-12 max-w-7xl items-center justify-between gap-4">
        <Link href="/" className="group touch-feedback flex items-center gap-2 rounded-full font-semibold text-ink" onClick={beginNavigation}>
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-owl-700 text-white shadow-soft transition-transform duration-150 group-hover:scale-105">
            <FileText className="h-5 w-5" aria-hidden="true" />
          </span>
          <span className="text-base tracking-normal">ResumeOwl</span>
        </Link>

        <div className="pointer-events-none absolute left-1/2 hidden -translate-x-1/2 justify-center lg:flex">
          <div className="pointer-events-auto">
            <NavHeader activeHref={activeHref} items={links} onNavigate={beginNavigation} />
          </div>
        </div>

        <div className="flex min-w-0 items-center gap-2 overflow-x-auto lg:hidden">
          <NavHeader activeHref={activeHref} items={links} onNavigate={beginNavigation} />
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <span className="ml-2 hidden max-w-40 truncate rounded-full bg-slate-100 px-3 py-1.5 text-sm font-semibold text-slate-700 sm:inline">
            {name}
          </span>
          <ThemeToggle />
        </div>
      </nav>
    </header>
  );
}
