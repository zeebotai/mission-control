"use client";

import { useEffect, useState } from "react";
import { getJSON } from "@/lib/api";

type DailyFile = { date: string };

type DailyResp = { date: string; content: string };

type Tab = "daily" | "longterm";

export default function MemoryPage() {
  const [tab, setTab] = useState<Tab>("daily");
  const [days, setDays] = useState<DailyFile[]>([]);
  const [selected, setSelected] = useState<string>("");
  const [content, setContent] = useState<string>("");
  const [err, setErr] = useState<string>("");

  async function loadDays() {
    setErr("");
    const list = await getJSON<DailyFile[]>("/memory/daily");
    setDays(list);
    if (!selected && list.length) setSelected(list[0].date);
  }

  async function loadDaily(date: string) {
    setErr("");
    const json = await getJSON<DailyResp>(`/memory/daily/${date}`);
    setContent(json.content);
  }

  async function loadLongterm() {
    setErr("");
    const json = await getJSON<{ content: string }>("/memory/longterm");
    setContent(json.content);
  }

  useEffect(() => {
    void loadDays();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (tab === "daily" && selected) void loadDaily(selected);
    if (tab === "longterm") void loadLongterm();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, selected]);

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold">Memory</h1>
          <p className="mt-1 text-sm text-zinc-400">Daily memory by day + long-term memory.</p>
        </div>
      </div>

      <div className="mt-6 flex items-center gap-2">
        <button
          className={`rounded-md border px-3 py-2 text-sm ${
            tab === "daily"
              ? "border-emerald-800 bg-emerald-950/40 text-emerald-200"
              : "border-zinc-800 bg-zinc-950/30 text-zinc-200 hover:bg-zinc-900/40"
          }`}
          onClick={() => setTab("daily")}
        >
          Daily
        </button>
        <button
          className={`rounded-md border px-3 py-2 text-sm ${
            tab === "longterm"
              ? "border-emerald-800 bg-emerald-950/40 text-emerald-200"
              : "border-zinc-800 bg-zinc-950/30 text-zinc-200 hover:bg-zinc-900/40"
          }`}
          onClick={() => setTab("longterm")}
        >
          Long-term
        </button>
        <div className="ml-auto">
          <button
            className="rounded-md border border-zinc-700 bg-zinc-950/40 px-3 py-2 text-sm text-zinc-200 hover:bg-zinc-800"
            onClick={() => {
              if (tab === "daily") void loadDays();
              if (tab === "longterm") void loadLongterm();
            }}
          >
            Refresh
          </button>
        </div>
      </div>

      {err ? (
        <div className="mt-4 rounded-md border border-red-900/40 bg-red-950/20 p-3 text-sm text-red-200">
          {err}
        </div>
      ) : null}

      <div className="mt-6 grid gap-4 lg:grid-cols-[240px_1fr]">
        {tab === "daily" ? (
          <div className="rounded-xl border border-zinc-800 bg-zinc-950/30 p-3">
            <div className="text-sm font-semibold">Days</div>
            <div className="mt-3 grid gap-1">
              {days.map((d) => (
                <button
                  key={d.date}
                  className={`w-full rounded-md px-3 py-2 text-left text-sm hover:bg-zinc-900/40 ${
                    selected === d.date ? "bg-zinc-900/50" : ""
                  }`}
                  onClick={() => setSelected(d.date)}
                >
                  {d.date}
                </button>
              ))}
              {days.length === 0 ? (
                <div className="text-xs text-zinc-500">No daily memory files found.</div>
              ) : null}
            </div>
          </div>
        ) : (
          <div className="rounded-xl border border-zinc-800 bg-zinc-950/30 p-3 text-sm text-zinc-400">
            Long-term memory
            <div className="mt-2 text-xs text-zinc-500">Source: MEMORY.md</div>
          </div>
        )}

        <div className="rounded-xl border border-zinc-800 bg-zinc-950/30 p-3">
          <div className="text-sm font-semibold">
            {tab === "daily" ? selected || "(select a day)" : "Long-term"}
          </div>
          <pre className="mt-3 whitespace-pre-wrap text-xs text-zinc-200">{content || ""}</pre>
        </div>
      </div>
    </div>
  );
}
