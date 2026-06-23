"use client";

import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";
import { getStoredTheme, saveStoredTheme, type StoredTheme } from "@/lib/resume/persistence";

export function ThemeToggle() {
  const [theme, setTheme] = useState<StoredTheme>("light");

  useEffect(() => {
    const initial = getStoredTheme();
    setTheme(initial);
    document.documentElement.dataset.theme = initial;
  }, []);

  function toggleTheme() {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    document.documentElement.dataset.theme = next;
    saveStoredTheme(next);
  }

  return (
    <button
      type="button"
      className="touch-feedback inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-slate-300 bg-white text-slate-700 transition hover:bg-owl-50 hover:text-owl-900"
      aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
      onClick={toggleTheme}
    >
      {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </button>
  );
}
