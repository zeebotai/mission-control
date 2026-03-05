"use client";

import { useEffect, useMemo, useState } from "react";
import { deleteJSON, getJSON, patchJSON, postJSON } from "@/lib/api";

type Task = {
  id: number;
  created_at: string;
  updated_at: string;
  title: string;
  description: string;
  status: "todo" | "doing" | "blocked" | "done";
  priority: number;
  owner: string;
  assigned_to: string;
  source: string;
  source_ref: string;
};

type TaskCreateResp = { ok: boolean; task: Task };

type Column = Task["status"];

const COLUMNS: Array<{ key: Column; title: string }> = [
  { key: "todo", title: "To do" },
  { key: "doing", title: "Doing" },
  { key: "blocked", title: "Blocked" },
  { key: "done", title: "Done" },
];

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  const [title, setTitle] = useState("");
  const [mission, setMission] = useState("");
  const [assignedTo, setAssignedTo] = useState("openclaw");
  const [priority, setPriority] = useState("2");

  async function refresh() {
    setErr("");
    try {
      const json = await getJSON<Task[]>("/tasks");
      setTasks(json);
    } catch (e: any) {
      setErr(e?.message || "failed");
    }
  }

  async function create() {
    if (!title.trim()) return;
    setBusy(true);
    setErr("");
    try {
      await postJSON<TaskCreateResp>("/tasks", {
        title: title.trim(),
        mission_alignment: mission.trim(),
        status: "todo",
        priority: Number(priority || 2),
        owner: assignedTo.trim() ? "openclaw" : "human",
        assigned_to: assignedTo.trim(),
        source: "manual",
      });
      setTitle("");
      setMission("");
      await refresh();
    } catch (e: any) {
      setErr(e?.message || "create failed");
    } finally {
      setBusy(false);
    }
  }

  async function move(id: number, status: Column) {
    setBusy(true);
    setErr("");
    try {
      await patchJSON(`/tasks/${id}`, { status });
      await refresh();
    } catch (e: any) {
      setErr(e?.message || "update failed");
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: number) {
    if (!confirm("Delete task?")) return;
    setBusy(true);
    setErr("");
    try {
      await deleteJSON(`/tasks/${id}`);
      await refresh();
    } catch (e: any) {
      setErr(e?.message || "delete failed");
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    void refresh();
  }, []);

  const byStatus = useMemo(() => {
    const map: Record<string, Task[]> = { todo: [], doing: [], blocked: [], done: [] };
    for (const t of tasks) map[t.status]?.push(t);
    for (const k of Object.keys(map)) {
      map[k].sort((a, b) => a.priority - b.priority || b.id - a.id);
    }
    return map as Record<Column, Task[]>;
  }, [tasks]);

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold">Task Board</h1>
          <p className="mt-1 text-sm text-zinc-400">
            Track what OpenClaw (and you) are doing. Drag/drop can come next; this is the working MVP.
          </p>
        </div>
        <button
          className="rounded-md border border-zinc-700 bg-zinc-950/40 px-3 py-2 text-sm text-zinc-200 hover:bg-zinc-800 disabled:opacity-60"
          onClick={() => void refresh()}
          disabled={busy}
        >
          Refresh
        </button>
      </div>

      <div className="mt-6 rounded-xl border border-zinc-800 bg-zinc-950/30 p-4">
        <div className="grid gap-3 md:grid-cols-3">
          <label className="grid gap-1 md:col-span-2">
            <span className="text-xs text-zinc-400">New task</span>
            <input
              className="rounded-md border border-zinc-800 bg-zinc-950/50 px-3 py-2 text-sm text-zinc-100"
              placeholder="What should OpenClaw do?"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </label>

          <label className="grid gap-1 md:col-span-3">
            <span className="text-xs text-zinc-400">How does this move us toward the mission?</span>
            <input
              className="rounded-md border border-zinc-800 bg-zinc-950/50 px-3 py-2 text-sm text-zinc-100"
              placeholder="Short reason (required)…"
              value={mission}
              onChange={(e) => setMission(e.target.value)}
            />
          </label>

          <div className="grid gap-3 md:grid-cols-2">
            <label className="grid gap-1">
              <span className="text-xs text-zinc-400">Assigned to</span>
              <input
                className="rounded-md border border-zinc-800 bg-zinc-950/50 px-3 py-2 text-sm text-zinc-100"
                value={assignedTo}
                onChange={(e) => setAssignedTo(e.target.value)}
              />
            </label>

            <label className="grid gap-1">
              <span className="text-xs text-zinc-400">Priority</span>
              <select
                className="rounded-md border border-zinc-800 bg-zinc-950/50 px-3 py-2 text-sm text-zinc-100"
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
              >
                <option value="1">P1</option>
                <option value="2">P2</option>
                <option value="3">P3</option>
              </select>
            </label>
          </div>
        </div>

        <div className="mt-3 flex items-center gap-2">
          <button
            className="rounded-md border border-emerald-800 bg-emerald-950/40 px-3 py-2 text-sm text-emerald-200 hover:bg-emerald-900/40 disabled:opacity-60"
            onClick={() => void create()}
            disabled={busy || !title.trim() || !mission.trim()}
          >
            Add task
          </button>
          {err ? <div className="text-sm text-red-300">{err}</div> : null}
        </div>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-4">
        {COLUMNS.map((col) => (
          <div key={col.key} className="rounded-xl border border-zinc-800 bg-zinc-950/30 p-3">
            <div className="flex items-center justify-between">
              <div className="text-sm font-semibold">{col.title}</div>
              <div className="text-xs text-zinc-500">{byStatus[col.key].length}</div>
            </div>
            <div className="mt-3 grid gap-2">
              {byStatus[col.key].map((t) => (
                <div key={t.id} className="rounded-lg border border-zinc-800 bg-black/20 p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="text-sm font-semibold">{t.title}</div>
                      <div className="mt-1 text-xs text-zinc-500">
                        P{t.priority} · {t.owner}{t.assigned_to ? `:${t.assigned_to}` : ""}
                      </div>
                    </div>
                    <button
                      className="text-xs text-zinc-400 hover:text-red-300"
                      onClick={() => void remove(t.id)}
                      disabled={busy}
                    >
                      Delete
                    </button>
                  </div>

                  {t.description ? (
                    <div className="mt-2 text-xs text-zinc-300 whitespace-pre-wrap">{t.description}</div>
                  ) : null}

                  <div className="mt-3 flex flex-wrap gap-2">
                    {COLUMNS.filter((c) => c.key !== t.status).map((c) => (
                      <button
                        key={c.key}
                        className="rounded-md border border-zinc-800 bg-zinc-950/40 px-2 py-1 text-xs text-zinc-200 hover:bg-zinc-900/40 disabled:opacity-60"
                        onClick={() => void move(t.id, c.key)}
                        disabled={busy}
                      >
                        Move → {c.title}
                      </button>
                    ))}
                  </div>
                </div>
              ))}

              {byStatus[col.key].length === 0 ? (
                <div className="rounded-lg border border-dashed border-zinc-800 p-3 text-xs text-zinc-500">
                  Empty
                </div>
              ) : null}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
