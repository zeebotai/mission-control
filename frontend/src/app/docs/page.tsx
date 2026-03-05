"use client";

import { useEffect, useState } from "react";
import { deleteJSON, getJSON, patchJSON, postJSON } from "@/lib/api";

type Doc = {
  id: number;
  created_at: string;
  updated_at: string;
  title: string;
  content: string;
  project_slug: string;
  tags: string;
  category: string;
  mission_alignment: string;
};

export default function DocsPage() {
  const [q, setQ] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [docs, setDocs] = useState<Doc[]>([]);
  const [selected, setSelected] = useState<Doc | null>(null);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  const [newTitle, setNewTitle] = useState("");
  const [newCategory, setNewCategory] = useState("general");
  const [newProject, setNewProject] = useState("");
  const [newTags, setNewTags] = useState("");
  const [newMission, setNewMission] = useState("");
  const [newContent, setNewContent] = useState("");

  async function refresh() {
    setErr("");
    try {
      const params = new URLSearchParams();
      if (q.trim()) params.set("q", q.trim());
      if (categoryFilter !== "all") params.set("category", categoryFilter);
      const path = params.toString() ? `/docstore?${params.toString()}` : "/docstore";
      const list = await getJSON<Doc[]>(path);
      setDocs(list);
      if (!selected && list.length) setSelected(list[0]);
    } catch (e: any) {
      setErr(e?.message || "failed");
    }
  }

  async function openDoc(id: number) {
    setErr("");
    try {
      const d = await getJSON<Doc>(`/docstore/${id}`);
      setSelected(d);
    } catch (e: any) {
      setErr(e?.message || "failed");
    }
  }

  async function create() {
    if (!newTitle.trim()) return;
    setBusy(true);
    setErr("");
    try {
      const res = await postJSON<{ ok: boolean; doc: Doc }>("/docstore", {
        title: newTitle.trim(),
        content: newContent,
        mission_alignment: newMission.trim(),
        category: newCategory,
        project_slug: newProject.trim(),
        tags: newTags.trim(),
      });
      setNewTitle("");
      setNewCategory("general");
      setNewProject("");
      setNewTags("");
      setNewMission("");
      setNewContent("");
      setSelected(res.doc);
      await refresh();
    } catch (e: any) {
      setErr(e?.message || "create failed");
    } finally {
      setBusy(false);
    }
  }

  async function save() {
    if (!selected) return;
    setBusy(true);
    setErr("");
    try {
      const res = await patchJSON<{ ok: boolean; doc: Doc }>(`/docstore/${selected.id}`,
        {
          title: selected.title,
          content: selected.content,
          mission_alignment: selected.mission_alignment,
          category: selected.category,
          project_slug: selected.project_slug,
          tags: selected.tags,
        }
      );
      setSelected(res.doc);
      await refresh();
    } catch (e: any) {
      setErr(e?.message || "save failed");
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (!selected) return;
    if (!confirm("Delete this doc?")) return;
    setBusy(true);
    setErr("");
    try {
      await deleteJSON(`/docstore/${selected.id}`);
      setSelected(null);
      await refresh();
    } catch (e: any) {
      setErr(e?.message || "delete failed");
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    void refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categoryFilter]);

  const counts = {
    all: docs.length,
    general: docs.filter((d) => d.category === "general").length,
    stax: docs.filter((d) => d.category === "stax").length,
    "mission-control": docs.filter((d) => d.category === "mission-control").length,
  };

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold">Docs</h1>
          <p className="mt-1 text-sm text-zinc-400">
            Any doc we create goes here. Searchable by title + content.
          </p>
          <div className="mt-2 flex flex-wrap gap-2 text-xs text-zinc-400">
            <span>Counts:</span>
            <span>all={counts.all}</span>
            <span>general={counts.general}</span>
            <span>stax={counts.stax}</span>
            <span>mission-control={counts["mission-control"]}</span>
          </div>
        </div>
        <button
          className="rounded-md border border-zinc-700 bg-zinc-950/40 px-3 py-2 text-sm text-zinc-200 hover:bg-zinc-800"
          onClick={() => void refresh()}
        >
          Refresh
        </button>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <select
          className="rounded-md border border-zinc-800 bg-zinc-950/50 px-3 py-2 text-sm text-zinc-100"
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
        >
          <option value="all">all</option>
          <option value="general">general</option>
          <option value="stax">stax</option>
          <option value="mission-control">mission-control</option>
        </select>
        <input
          className="w-full max-w-xl rounded-md border border-zinc-800 bg-zinc-950/50 px-3 py-2 text-sm"
          placeholder="Search docs…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") void refresh();
          }}
        />
        <button
          className="rounded-md border border-sky-800 bg-sky-950/40 px-3 py-2 text-sm text-sky-200 hover:bg-sky-900/40"
          onClick={() => void refresh()}
        >
          Search
        </button>
      </div>

      {err ? (
        <div className="mt-4 rounded-md border border-red-900/40 bg-red-950/20 p-3 text-sm text-red-200">
          {err}
        </div>
      ) : null}

      <div className="mt-6 grid gap-4 lg:grid-cols-[280px_1fr]">
        <div className="rounded-xl border border-zinc-800 bg-zinc-950/30 p-3">
          <div className="text-sm font-semibold">Documents</div>
          <div className="mt-3 grid gap-1">
            {docs.map((d) => (
              <button
                key={d.id}
                className={`w-full rounded-md px-3 py-2 text-left text-sm hover:bg-zinc-900/40 ${
                  selected?.id === d.id ? "bg-zinc-900/50" : ""
                }`}
                onClick={() => void openDoc(d.id)}
              >
                <div className="font-semibold">{d.title}</div>
                <div className="mt-1 text-xs text-zinc-500">{d.project_slug || "(no project)"}</div>
              </button>
            ))}
            {docs.length === 0 ? (
              <div className="text-xs text-zinc-500">No docs yet.</div>
            ) : null}
          </div>

          <div className="mt-4 border-t border-zinc-800 pt-4">
            <div className="text-sm font-semibold">New doc</div>
            <div className="mt-2 grid gap-2">
              <input
                className="rounded-md border border-zinc-800 bg-zinc-950/50 px-3 py-2 text-sm"
                placeholder="Title"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
              />
              <select
                className="rounded-md border border-zinc-800 bg-zinc-950/50 px-3 py-2 text-sm"
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
              >
                <option value="general">general</option>
                <option value="stax">stax</option>
                <option value="mission-control">mission-control</option>
              </select>
              <input
                className="rounded-md border border-zinc-800 bg-zinc-950/50 px-3 py-2 text-sm"
                placeholder="Project slug (optional)"
                value={newProject}
                onChange={(e) => setNewProject(e.target.value)}
              />
              <input
                className="rounded-md border border-zinc-800 bg-zinc-950/50 px-3 py-2 text-sm"
                placeholder="Tags (comma-separated)"
                value={newTags}
                onChange={(e) => setNewTags(e.target.value)}
              />
              <textarea
                className="min-h-[80px] rounded-md border border-zinc-800 bg-zinc-950/50 px-3 py-2 text-sm"
                placeholder="How does this doc move us toward the mission? (required)"
                value={newMission}
                onChange={(e) => setNewMission(e.target.value)}
              />
              <textarea
                className="min-h-[120px] rounded-md border border-zinc-800 bg-zinc-950/50 px-3 py-2 text-sm"
                placeholder="Content"
                value={newContent}
                onChange={(e) => setNewContent(e.target.value)}
              />
              <button
                className="rounded-md border border-emerald-800 bg-emerald-950/40 px-3 py-2 text-sm text-emerald-200 hover:bg-emerald-900/40 disabled:opacity-60"
                onClick={() => void create()}
                disabled={busy || !newTitle.trim() || !newMission.trim()}
              >
                Create
              </button>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-zinc-800 bg-zinc-950/30 p-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="text-sm font-semibold">Editor</div>
            <div className="flex items-center gap-2">
              <button
                className="rounded-md border border-zinc-800 bg-zinc-950/40 px-3 py-2 text-sm text-zinc-200 hover:bg-zinc-900/40 disabled:opacity-60"
                onClick={() => void save()}
                disabled={busy || !selected}
              >
                Save
              </button>
              <button
                className="rounded-md border border-red-900/60 bg-red-950/20 px-3 py-2 text-sm text-red-200 hover:bg-red-950/30 disabled:opacity-60"
                onClick={() => void remove()}
                disabled={busy || !selected}
              >
                Delete
              </button>
            </div>
          </div>

          {!selected ? (
            <div className="mt-3 text-sm text-zinc-500">Select a doc.</div>
          ) : (
            <div className="mt-3 grid gap-2">
              <input
                className="rounded-md border border-zinc-800 bg-zinc-950/50 px-3 py-2 text-sm"
                value={selected.title}
                onChange={(e) => setSelected({ ...selected, title: e.target.value })}
              />
              <div className="grid gap-2 md:grid-cols-3">
                <select
                  className="rounded-md border border-zinc-800 bg-zinc-950/50 px-3 py-2 text-sm"
                  value={selected.category}
                  onChange={(e) => setSelected({ ...selected, category: e.target.value })}
                >
                  <option value="general">general</option>
                  <option value="stax">stax</option>
                  <option value="mission-control">mission-control</option>
                </select>
                <input
                  className="rounded-md border border-zinc-800 bg-zinc-950/50 px-3 py-2 text-sm"
                  placeholder="project_slug"
                  value={selected.project_slug}
                  onChange={(e) => setSelected({ ...selected, project_slug: e.target.value })}
                />
                <input
                  className="rounded-md border border-zinc-800 bg-zinc-950/50 px-3 py-2 text-sm"
                  placeholder="tags"
                  value={selected.tags}
                  onChange={(e) => setSelected({ ...selected, tags: e.target.value })}
                />
              </div>
              <textarea
                className="min-h-[80px] rounded-md border border-zinc-800 bg-zinc-950/50 px-3 py-2 text-sm"
                placeholder="Mission alignment (required for new docs)"
                value={selected.mission_alignment}
                onChange={(e) => setSelected({ ...selected, mission_alignment: e.target.value })}
              />
              <textarea
                className="min-h-[420px] rounded-md border border-zinc-800 bg-zinc-950/50 px-3 py-2 font-mono text-xs"
                value={selected.content}
                onChange={(e) => setSelected({ ...selected, content: e.target.value })}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
