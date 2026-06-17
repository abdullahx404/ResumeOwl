import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ResumeOwl",
  description:
    "A free, no-login, privacy-focused resume app for ATS analysis, refactoring, and resume creation.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
