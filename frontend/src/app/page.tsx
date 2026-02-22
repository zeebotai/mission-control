import { Shell } from "@/components/Shell";
import { QuickActions } from "@/components/QuickActions";
import { StatCard } from "@/components/StatCard";
import { getJSON, type ActivityLog, type Agent, type Job, type SystemStats } from "@/lib/api";

function Badge({ status }: { status: string }) {
  const map: Record<string, string> = {
    idle: "bg-zinc-800 text-zinc-200",
    running: "bg-emerald-900/40 text-emerald-200 border-emerald-800",
    paused: "bg-yellow-900/40 text-yellow-200 border-yellow-800",
    error: "bg-red-900/40 text-red-200 border-red-800",
    ok: "bg-emerald-900/40 text-emerald-200 border-emerald-800",
    warn: "bg-yellow-900/40 text-yellow-200 border-yellow-800",
  };
  const cls = map[status] || "bg-zinc-800 text-zinc-200";
  return (
    <span className={`inline-flex items-center rounded-md border border-zinc-700 px-2 py-0.5 text-xs ${cls}`}>
      {status}
    </span>
  );
}

export default async function Dashboard() {
  const [stats, now, activity] = await Promise.all([
    getJSON<SystemStats>("/system/stats"),
    getJSON<{ agents: Agent[]; jobs: Job[]; timestamp: string }>("/system/now"),
    getJSON<ActivityLog[]>("/system/activity?limit=20"),
  ]);

  const agents = now.agents;

  return (
    <Shell>
      <div className="mb-4 flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold">Dashboard</h1>
          <p className="text-sm text-zinc-400">
            What’s happening now, why, what’s next, and what you can do.
          </p>
        </div>
        <div className="text-xs text-zinc-500">Last updated: {now.timestamp}</div>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        <StatCard label="Workspace files" value={String(stats.workspace_files_count)} />
        <StatCard label="Active jobs" value={String(stats.active_jobs)} />
        <StatCard label="Active sessions" value={String(stats.active_sessions)} />
        <StatCard label="Cost (7d)" value={`$${stats.estimated_cost_7d}`} />
        <StatCard label="System health" value={stats.system_health.toUpperCase()} hint="Backend self-report" />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <section className="rounded-xl border border-zinc-800 bg-zinc-950/30 p-4 lg:col-span-2">
          <div className="mb-2 flex items-center justify-between">
            <div>
              <div className="text-sm font-semibold">What’s Running Now</div>
              <div className="text-xs text-zinc-400">
                Active agents and their current tasks
              </div>
            </div>
            <Badge status={stats.system_health} />
          </div>

          <div className="divide-y divide-zinc-800">
            {agents.map((a) => (
              <div key={a.id} className="flex items-start justify-between py-3">
                <div>
                  <div className="text-sm font-medium">{a.name}</div>
                  <div className="text-xs text-zinc-400">{a.role || "(no role)"}</div>
                  <div className="mt-1 text-sm text-zinc-200">
                    {a.current_task || "—"}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <Badge status={a.status} />
                  <div className="text-xs text-zinc-500">last active: {a.last_active}</div>
                </div>
              </div>
            ))}
            {agents.length === 0 ? (
              <div className="py-6 text-sm text-zinc-400">No agents yet.</div>
            ) : null}
          </div>
        </section>

        <QuickActions />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <section className="rounded-xl border border-zinc-800 bg-zinc-950/30 p-4 lg:col-span-2">
          <div className="mb-2">
            <div className="text-sm font-semibold">Recent Activity</div>
            <div className="text-xs text-zinc-400">
              Plain-English event feed (auto-refresh later)
            </div>
          </div>

          <div className="divide-y divide-zinc-800">
            {activity.map((e) => (
              <div key={e.id} className="py-3">
                <div className="flex items-center justify-between">
                  <div className="text-xs text-zinc-500">
                    {e.timestamp} • {e.source}
                  </div>
                  <div className="text-xs text-zinc-500">{e.event_type}</div>
                </div>
                <div className="mt-1 text-sm text-zinc-100">{e.human_summary}</div>
              </div>
            ))}
            {activity.length === 0 ? (
              <div className="py-6 text-sm text-zinc-400">No activity yet.</div>
            ) : null}
          </div>
        </section>

        <section className="rounded-xl border border-zinc-800 bg-zinc-950/30 p-4">
          <div className="mb-2">
            <div className="text-sm font-semibold">Workspace Files</div>
            <div className="text-xs text-zinc-400">Stub (wire scanner next)</div>
          </div>
          <div className="text-sm text-zinc-300">No data yet.</div>
        </section>
      </div>
    </Shell>
  );
}
