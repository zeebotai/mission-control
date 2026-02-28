"use client";

import { useState } from "react";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "/api";

type Lead = {
  business_name: string;
  phone_number?: string | null;
  industry?: string | null;
  rating?: number | null;
  reviews?: number | null;
  website: string;
  status: string;
  contact_method: string;
  date_contacted?: string | null;
  follow_up_date?: string | null;
  notes: string;
};

type ParseResp = { leads: Lead[]; skipped: Array<{ reason: string; raw: string }> };

export default function Page() {
  const [raw, setRaw] = useState("");
  const [busy, setBusy] = useState(false);
  const [data, setData] = useState<ParseResp | null>(null);
  const [err, setErr] = useState<string>("");

  async function parse() {
    setBusy(true);
    setErr("");
    setData(null);
    try {
      const res = await fetch(`${API_BASE}/cronobuilds/parse`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ raw }),
      });
      if (!res.ok) throw new Error(`API error ${res.status}`);
      const json = (await res.json()) as ParseResp;
      setData(json);
    } catch (e: any) {
      setErr(e?.message || "failed");
    } finally {
      setBusy(false);
    }
  }

  async function addToBaserow() {
    if (!raw.trim()) return;
    setBusy(true);
    setErr("");
    try {
      const res = await fetch(`${API_BASE}/cronobuilds/baserow/import`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ raw }),
      });
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(`Import failed: ${res.status} ${txt}`);
      }
      const json = (await res.json()) as { created: number; duplicates: any[] };
      if (json.duplicates?.length) {
        setErr(`Duplicates detected (${json.duplicates.length}). No rows written.`);
      } else {
        setErr("");
      }
      // Refresh parsed view so user sees what was acted on.
      await parse();
      alert(`Imported: ${json.created}`);
    } catch (e: any) {
      setErr(e?.message || "import failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <h1 className="text-xl font-semibold">Cronobuilds · Lead Inbox</h1>
      <p className="mt-1 text-sm text-zinc-400">
        Paste your Google Maps copied text blob. We’ll parse into lead candidates (no Baserow writes yet).
      </p>

      <div className="mt-4 grid gap-2">
        <textarea
          className="h-56 w-full rounded-md border border-zinc-800 bg-zinc-950/50 p-3 text-sm text-zinc-100"
          placeholder="Paste the copied Maps text here…"
          value={raw}
          onChange={(e) => setRaw(e.target.value)}
        />
        <div className="flex flex-wrap items-center gap-2">
          <button
            className="rounded-md border border-emerald-800 bg-emerald-950/40 px-3 py-2 text-sm text-emerald-200 hover:bg-emerald-900/40 disabled:opacity-60"
            disabled={busy || raw.trim().length === 0}
            onClick={() => void parse()}
          >
            {busy ? "Working…" : "Process batch"}
          </button>
          <button
            className="rounded-md border border-sky-800 bg-sky-950/40 px-3 py-2 text-sm text-sky-200 hover:bg-sky-900/40 disabled:opacity-60"
            disabled={busy || raw.trim().length === 0}
            onClick={() => void addToBaserow()}
          >
            {busy ? "Working…" : "Add to Baserow"}
          </button>
          {err ? <div className="text-sm text-red-300">{err}</div> : null}
        </div>
      </div>

      {data ? (
        <div className="mt-6 grid gap-4">
          <div className="rounded-xl border border-zinc-800 bg-zinc-950/30 p-4">
            <div className="text-sm font-semibold">Parsed leads ({data.leads.length})</div>
            <div className="mt-3 overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="text-left text-xs text-zinc-400">
                  <tr>
                    <th className="py-2 pr-4">Business</th>
                    <th className="py-2 pr-4">Phone</th>
                    <th className="py-2 pr-4">Industry</th>
                    <th className="py-2 pr-4">Reviews</th>
                    <th className="py-2 pr-4">Rating</th>
                    <th className="py-2 pr-4">Status</th>
                    <th className="py-2 pr-4">Follow-up</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800">
                  {data.leads.map((l, idx) => (
                    <tr key={idx}>
                      <td className="py-2 pr-4 font-medium text-zinc-100">{l.business_name}</td>
                      <td className="py-2 pr-4 text-zinc-200">{l.phone_number || "—"}</td>
                      <td className="py-2 pr-4 text-zinc-200">{l.industry || "—"}</td>
                      <td className="py-2 pr-4 text-zinc-200">{l.reviews ?? "—"}</td>
                      <td className="py-2 pr-4 text-zinc-200">{l.rating ?? "—"}</td>
                      <td className="py-2 pr-4 text-zinc-200">{l.status}</td>
                      <td className="py-2 pr-4 text-zinc-200">{l.follow_up_date || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {data.skipped.length ? (
            <div className="rounded-xl border border-zinc-800 bg-zinc-950/30 p-4">
              <div className="text-sm font-semibold">Skipped ({data.skipped.length})</div>
              <ul className="mt-2 list-disc pl-5 text-sm text-zinc-300">
                {data.skipped.map((s, i) => (
                  <li key={i}>
                    {s.reason}: <span className="text-zinc-400">{s.raw}</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
