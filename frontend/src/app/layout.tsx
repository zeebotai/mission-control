import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "Mission Control",
  description: "Shared ops cockpit for AI + human operator",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="dark">
      <body className="antialiased">
        <div className="min-h-screen bg-black text-zinc-100">
          <header className="sticky top-0 z-50 border-b border-zinc-900 bg-black/80 backdrop-blur">
            <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
              <Link href="/" className="text-sm font-semibold tracking-tight hover:opacity-80">
                Mission Control
              </Link>
              <nav className="flex items-center gap-2">
                <Link
                  href="/"
                  className="rounded-md border border-zinc-800 bg-zinc-950/40 px-3 py-1.5 text-sm text-zinc-200 hover:bg-zinc-900/40"
                >
                  Dashboard
                </Link>
                <Link
                  href="/tasks"
                  className="rounded-md border border-zinc-800 bg-zinc-950/40 px-3 py-1.5 text-sm text-zinc-200 hover:bg-zinc-900/40"
                >
                  Tasks
                </Link>
                <Link
                  href="/calendar"
                  className="rounded-md border border-zinc-800 bg-zinc-950/40 px-3 py-1.5 text-sm text-zinc-200 hover:bg-zinc-900/40"
                >
                  Calendar
                </Link>
                <Link
                  href="/projects"
                  className="rounded-md border border-zinc-800 bg-zinc-950/40 px-3 py-1.5 text-sm text-zinc-200 hover:bg-zinc-900/40"
                >
                  Projects
                </Link>
                <Link
                  href="/docs"
                  className="rounded-md border border-zinc-800 bg-zinc-950/40 px-3 py-1.5 text-sm text-zinc-200 hover:bg-zinc-900/40"
                >
                  Docs
                </Link>
              </nav>
            </div>
          </header>

          <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
        </div>
      </body>
    </html>
  );
}
