"use client";

import Link from "next/link";
import { FileText } from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { getStoredProfile } from "@/lib/resume/persistence";
import { cn } from "@/lib/utils";

const links = [
  { href: "/", label: "Home" },
  { href: "/preview", label: "Preview" },
  { href: "/editor", label: "Edit" },
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

  return (
    <header className="no-print sticky top-0 z-40 border-b border-slate-200/80 bg-white/86 backdrop-blur-xl">
      <div
        className={cn(
          "absolute inset-x-0 top-0 h-0.5 origin-left bg-owl-700 transition-transform duration-300",
          loading || isPending ? "scale-x-100" : "scale-x-0",
        )}
      />
      <nav className="mx-auto flex min-h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2 font-semibold text-ink" onClick={beginNavigation}>
          <span className="grid h-9 w-9 place-items-center rounded-md bg-owl-700 text-white shadow-soft">
            <FileText className="h-5 w-5" aria-hidden="true" />
          </span>
          <span className="text-base tracking-normal">ResumeOwl</span>
        </Link>

        <div className="flex items-center gap-1 overflow-x-auto">
          {links.map((link) => {
            const active = link.href === "/" ? pathname === "/" : pathname.startsWith(link.href);

            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={beginNavigation}
                className={cn(
                  "relative rounded-md px-3 py-2 text-sm font-semibold text-slate-600 transition hover:bg-owl-50 hover:text-owl-900",
                  active && "text-owl-900 after:absolute after:inset-x-3 after:bottom-1 after:h-0.5 after:rounded-full after:bg-owl-700",
                )}
              >
                {link.label}
              </Link>
            );
          })}
          <span className="ml-2 hidden max-w-40 truncate rounded-full bg-slate-100 px-3 py-1.5 text-sm font-semibold text-slate-700 sm:inline">
            {name}
          </span>
        </div>
      </nav>
    </header>
  );
}
