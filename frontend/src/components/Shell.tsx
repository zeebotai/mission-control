import Link from "next/link";

const NAV = [
  { href: "/", label: "Dashboard" },
  { href: "/sessions", label: "Chat Sessions" },
  { href: "/memory", label: "Memory" },
  { href: "/skills", label: "Skills" },
  { href: "/cron", label: "Cron Jobs" },
  { href: "/schedule", label: "Schedule" },
  { href: "/files", label: "Workspace Files" },
  { href: "/subagents", label: "Sub-agents" },
  { href: "/analytics", label: "Analytics" },
  { href: "/settings", label: "Settings" },
];

export function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="mx-auto grid max-w-7xl grid-cols-[260px_1fr] gap-4 p-4">
        <aside className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
          <div className="mb-4">
            <div className="text-sm font-semibold tracking-wide text-zinc-200">
              Mission Control
            </div>
            <div className="text-xs text-zinc-400">Cronobuilds ops cockpit</div>
          </div>
          <nav className="flex flex-col gap-1">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-md px-3 py-2 text-sm text-zinc-200 hover:bg-zinc-800"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </aside>

        <main className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4">
          {children}
        </main>
      </div>
    </div>
  );
}
