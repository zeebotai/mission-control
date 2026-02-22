"use client";

import { useState } from "react";
import { postJSON } from "@/lib/api";

function Btn({
  label,
  onClick,
  tone = "default",
}: {
  label: string;
  onClick: () => Promise<void>;
  tone?: "default" | "danger";
}) {
  const base =
    "rounded-md border px-3 py-2 text-sm font-medium transition-colors";
  const styles =
    tone === "danger"
      ? "border-red-800 bg-red-950/40 text-red-200 hover:bg-red-900/40"
      : "border-zinc-700 bg-zinc-950/40 text-zinc-200 hover:bg-zinc-800";

  return (
    <button className={`${base} ${styles}`} onClick={() => void onClick()}>
      {label}
    </button>
  );
}

export function QuickActions() {
  const [busy, setBusy] = useState<string | null>(null);
  const [last, setLast] = useState<string>("");

  async function run(label: string, fn: () => Promise<unknown>) {
    setBusy(label);
    setLast("");
    try {
      await fn();
      setLast(`${label}: ok`);
    } catch {
      setLast(`${label}: error`);
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-950/30 p-4">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <div className="text-sm font-semibold">Quick Actions</div>
          <div className="text-xs text-zinc-400">
            Human controls (stubs for now)
          </div>
        </div>
        <div className="text-xs text-zinc-500">{busy ? `Running: ${busy}` : last}</div>
      </div>

      <div className="flex flex-wrap gap-2">
        <Btn
          label="Spawn sub-agent"
          onClick={() => run("Spawn sub-agent", () => postJSON("/system/actions/spawn-subagent", { reason: "manual" }))}
        />
        <Btn
          label="Pause all agents"
          onClick={() => run("Pause all agents", () => postJSON("/system/actions/pause-all"))}
        />
        <Btn
          label="Resume agents"
          onClick={() => run("Resume agents", () => postJSON("/system/actions/resume-all"))}
        />
        <Btn
          label="Run job now"
          onClick={() => run("Run job now", () => postJSON("/system/actions/run-job?job_id=1"))}
        />
        <Btn
          tone="danger"
          label="Stop current task"
          onClick={() => run("Stop current task", () => postJSON("/system/actions/stop-task?agent_id=1"))}
        />
        <Btn
          label="Create memory entry"
          onClick={() => run("Create memory entry", () => postJSON("/system/actions/create-memory", { type: "note", content: "(stub)" }))}
        />
        <Btn
          label="Trigger health check"
          onClick={() => run("Trigger health check", () => postJSON("/system/actions/health-check"))}
        />
      </div>
    </div>
  );
}
