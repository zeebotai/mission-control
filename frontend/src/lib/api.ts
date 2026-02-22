export type SystemStats = {
  workspace_files_count: number;
  active_jobs: number;
  active_sessions: number;
  estimated_cost_7d: number;
  system_health: "ok" | "warn" | "error";
  active_agents: number;
};

export type Agent = {
  id: number;
  name: string;
  role: string;
  status: "idle" | "running" | "paused" | "error";
  current_task: string;
  last_active: string;
};

export type Job = {
  id: number;
  name: string;
  schedule: string;
  status: "idle" | "running" | "paused" | "error";
  last_run: string | null;
  next_run: string | null;
  owner_agent: string;
};

export type ActivityLog = {
  id: number;
  timestamp: string;
  source: "agent" | "system" | "human";
  event_type: string;
  human_summary: string;
  raw_data: string;
};

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8000";

export async function getJSON<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, { cache: "no-store" });
  if (!res.ok) throw new Error(`API ${path} failed: ${res.status}`);
  return (await res.json()) as T;
}

export async function postJSON<T>(path: string, body?: unknown): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw new Error(`API ${path} failed: ${res.status}`);
  return (await res.json()) as T;
}
