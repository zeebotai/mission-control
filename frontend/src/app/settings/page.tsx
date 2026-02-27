"use client";

import { useEffect, useState } from "react";

type BaserowStatus = {
  configured: boolean;
  mcp_url?: string;
  table_url?: string | null;
  status?: string;
  note?: string;
};

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8020";

export default function SettingsPage() {
  const [mcpUrl, setMcpUrl] = useState("");
  const [tableUrl, setTableUrl] = useState("");
  const [status, setStatus] = useState<BaserowStatus | null>(null);
  const [msg, setMsg] = useState<string>("");

  async function refresh() {
    setMsg("");
    const res = await fetch(`${API_BASE}/integrations/baserow`, { cache: "no-store" });
    const json = (await res.json()) as BaserowStatus;
    setStatus(json);
  }

  async function save() {
    setMsg("");
    const res = await fetch(`${API_BASE}/integrations/baserow`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mcp_url: mcpUrl, table_url: tableUrl || null }),
    });
    if (!res.ok) {
      setMsg(`Save failed: ${res.status}`);
      return;
    }
    setMsg("Saved.");
    await refresh();
  }

  useEffect(() => {
    void refresh();
  }, []);

  return (
    <div>
      <h1 className="text-xl font-semibold">Settings</h1>
      <p className="mt-1 text-sm text-zinc-400">
        Integrations and system configuration.
      </p>

      <div className="mt-6 rounded-xl border border-zinc-800 bg-zinc-950/30 p-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-sm font-semibold">Baserow (MCP)</div>
            <div className="text-xs text-zinc-400">
              Store your MCP URL here. It will be redacted in reads.
            </div>
          </div>
          <button
            className="rounded-md border border-zinc-700 bg-zinc-950/40 px-3 py-2 text-sm text-zinc-200 hover:bg-zinc-800"
            onClick={() => void refresh()}
          >
            Refresh
          </button>
        </div>

        <div className="mt-4 grid gap-3">
          <label className="grid gap-1">
            <span className="text-xs text-zinc-400">Baserow MCP URL</span>
            <input
              className="rounded-md border border-zinc-800 bg-zinc-950/50 px-3 py-2 text-sm text-zinc-100"
              placeholder="https://api.baserow.io/mcp/.../sse"
              value={mcpUrl}
              onChange={(e) => setMcpUrl(e.target.value)}
            />
          </label>

          <label className="grid gap-1">
            <span className="text-xs text-zinc-400">Target table URL (optional)</span>
            <input
              className="rounded-md border border-zinc-800 bg-zinc-950/50 px-3 py-2 text-sm text-zinc-100"
              placeholder="https://baserow.io/database/..."
              value={tableUrl}
              onChange={(e) => setTableUrl(e.target.value)}
            />
          </label>

          <div className="flex items-center gap-2">
            <button
              className="rounded-md border border-emerald-800 bg-emerald-950/40 px-3 py-2 text-sm text-emerald-200 hover:bg-emerald-900/40"
              onClick={() => void save()}
            >
              Save
            </button>
            <div className="text-sm text-zinc-400">{msg}</div>
          </div>

          <div className="mt-3 rounded-md border border-zinc-800 bg-zinc-950/40 p-3 text-sm">
            <div className="text-xs text-zinc-400">Status</div>
            <pre className="mt-2 whitespace-pre-wrap text-xs text-zinc-200">
              {status ? JSON.stringify(status, null, 2) : "Loading…"}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}
