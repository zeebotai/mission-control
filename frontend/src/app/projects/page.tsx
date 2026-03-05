"use client";

import { useEffect, useMemo, useState } from "react";
import { getJSON, postJSON } from "@/lib/api";

type Project = {
  id: number;
  slug: string;
  name: string;
  repo_url: string;
  status: string;
  notes: string;
};

type Task = {
  id: number;
  title: string;
  status: string;
  priority: number;
  project_slug: string;
  assigned_to: string;
};

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [err, setErr] = useState("");

  const [slug, setSlug] = useState("stax");
  const [name, setName] = useState("Stax");
  const [repoUrl, setRepoUrl] = useState("");
  const [mission, setMission] = useState("");

  async function refresh() {
    setErr("");
    try {
      const [p, t] = await Promise.all([
        getJSON<Project[]>("/projects"),
        getJSON<Task[]>("/tasks"),
      ]);
      setProjects(p);
      setTasks(t);
    } catch (e: any) {
      setErr(e?.message || "failed");
    }
  }

  async function create() {
    setErr("");
    try {
      await postJSON("/projects", {
        slug: slug.trim(),
        name: name.trim() || slug.trim(),
        mission_alignment: mission.trim(),
        repo_url: repoUrl.trim(),
      });
      await refresh();
    } catch (e: any) {
      setErr(e?.message || "create failed");
    }
  }

  useEffect(() => {
    void refresh();
  }, []);

  const tasksByProject = useMemo(() => {
    const map: Record<string, Task[]> = {};
    for (const t of tasks) {
      const key = t.project_slug || "(unassigned)";
      map[key] = map[key] || [];
      map[key].push(t);
    }
    return map;
  }, [tasks]);

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold">Projects</h1>
          <p className="mt-1 text-sm text-zinc-400">
            Manual projects + auto grouping via task.project_slug.
          </p>
        </div>
        <button
          className="rounded-md border border-zinc-700 bg-zinc-950/40 px-3 py-2 text-sm text-zinc-200 hover:bg-zinc-800"
          onClick={() => void refresh()}
        >
          Refresh
        </button>
      </div>

      {err ? (
        <div className="mt-4 rounded-md border border-red-900/40 bg-red-950/20 p-3 text-sm text-red-200">
          {err}
        </div>
      ) : null}

      <div className="mt-6 rounded-xl border border-zinc-800 bg-zinc-950/30 p-4">
        <div className="text-sm font-semibold">Create project</div>
        <div className="mt-3 grid gap-3 md:grid-cols-3">
          <input
            className="rounded-md border border-zinc-800 bg-zinc-950/50 px-3 py-2 text-sm"
            placeholder="slug (e.g. stax)"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
          />
          <input
            className="rounded-md border border-zinc-800 bg-zinc-950/50 px-3 py-2 text-sm"
            placeholder="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <input
            className="rounded-md border border-zinc-800 bg-zinc-950/50 px-3 py-2 text-sm"
            placeholder="repo url (optional)"
            value={repoUrl}
            onChange={(e) => setRepoUrl(e.target.value)}
          />

          <textarea
            className="md:col-span-3 min-h-[80px] rounded-md border border-zinc-800 bg-zinc-950/50 px-3 py-2 text-sm"
            placeholder="How does this project move us toward the mission? (required)"
            value={mission}
            onChange={(e) => setMission(e.target.value)}
          />
        </div>
        <div className="mt-3">
          <button
            className="rounded-md border border-emerald-800 bg-emerald-950/40 px-3 py-2 text-sm text-emerald-200 hover:bg-emerald-900/40 disabled:opacity-60"
            onClick={() => void create()}
            disabled={!slug.trim() || !mission.trim()}
          >
            Create
          </button>
        </div>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {projects.map((p) => {
          const bucket = tasksByProject[p.slug] || [];
          const open = bucket.filter((t) => t.status !== "done");
          return (
            <div key={p.id} className="rounded-xl border border-zinc-800 bg-zinc-950/30 p-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-sm font-semibold">{p.name}</div>
                  <div className="mt-1 text-xs text-zinc-500">{p.slug}</div>
                </div>
                <div className="text-xs text-zinc-400">Open tasks: {open.length}</div>
              </div>
              {p.repo_url ? (
                <a className="mt-2 block text-xs text-sky-300 hover:underline" href={p.repo_url} target="_blank" rel="noreferrer">
                  {p.repo_url}
                </a>
              ) : null}

              <div className="mt-3 grid gap-2">
                {open.slice(0, 5).map((t) => (
                  <div key={t.id} className="rounded-lg border border-zinc-800 bg-black/20 p-2 text-xs">
                    <div className="font-semibold">{t.title}</div>
                    <div className="text-zinc-500">{t.status} · P{t.priority} · {t.assigned_to || "unassigned"}</div>
                  </div>
                ))}
                {open.length === 0 ? (
                  <div className="text-xs text-zinc-500">No open tasks.</div>
                ) : null}
              </div>
            </div>
          );
        })}

        {/* Auto bucket for tasks with no project */}
        {tasksByProject["(unassigned)"]?.length ? (
          <div className="rounded-xl border border-zinc-800 bg-zinc-950/30 p-4">
            <div className="text-sm font-semibold">Unassigned tasks</div>
            <div className="mt-3 grid gap-2">
              {tasksByProject["(unassigned)"].slice(0, 10).map((t) => (
                <div key={t.id} className="rounded-lg border border-zinc-800 bg-black/20 p-2 text-xs">
                  <div className="font-semibold">{t.title}</div>
                  <div className="text-zinc-500">{t.status} · P{t.priority}</div>
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
