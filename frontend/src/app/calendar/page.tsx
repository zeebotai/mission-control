"use client";

import { useEffect, useState } from "react";
import { getJSON } from "@/lib/api";

type CronJob = {
  id: string;
  name: string;
  enabled: boolean;
  schedule: any;
  state?: any;
};

export default function CalendarPage() {
  const [jobs, setJobs] = useState<CronJob[]>([]);
  const [err, setErr] = useState("");

  async function refresh() {
    setErr("");
    try {
      const json = await getJSON<CronJob[]>("/calendar/cron");
      setJobs(json);
    } catch (e: any) {
      setErr(e?.message || "failed");
    }
  }

  useEffect(() => {
    void refresh();
  }, []);

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold">Calendar</h1>
          <p className="mt-1 text-sm text-zinc-400">
            Scheduled tasks from Clawdbot cron (and soon Mission Control jobs) in one place.
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

      <div className="mt-6 grid gap-3">
        {jobs.map((j) => (
          <div key={j.id} className="rounded-xl border border-zinc-800 bg-zinc-950/30 p-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-sm font-semibold">{j.name}</div>
                <div className="mt-1 text-xs text-zinc-500">id: {j.id}</div>
              </div>
              <div className="text-xs text-zinc-400">
                {j.enabled ? (
                  <span className="rounded bg-emerald-950/40 px-2 py-1 text-emerald-200">enabled</span>
                ) : (
                  <span className="rounded bg-zinc-900/40 px-2 py-1 text-zinc-300">disabled</span>
                )}
              </div>
            </div>

            <div className="mt-3 text-xs text-zinc-300">
              <div className="text-zinc-400">Schedule</div>
              <pre className="mt-1 whitespace-pre-wrap rounded-md border border-zinc-800 bg-black/20 p-2">
                {JSON.stringify(j.schedule, null, 2)}
              </pre>
            </div>

            <div className="mt-3 text-xs text-zinc-300">
              <div className="text-zinc-400">State</div>
              <pre className="mt-1 whitespace-pre-wrap rounded-md border border-zinc-800 bg-black/20 p-2">
                {JSON.stringify(j.state ?? {}, null, 2)}
              </pre>
            </div>
          </div>
        ))}

        {jobs.length === 0 ? (
          <div className="rounded-xl border border-zinc-800 bg-zinc-950/30 p-4 text-sm text-zinc-300">
            No cron jobs found. If you definitely have them, mount ~/.clawdbot/cron into the api container.
          </div>
        ) : null}
      </div>
    </div>
  );
}
