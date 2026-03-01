"use client";

import { useEffect, useState } from "react";
import { getJSON } from "@/lib/api";

type DueResp = {
  today: string;
  count: number;
  followups: Array<{
    business_name: string;
    phone_number: string;
    follow_up_date: string;
    status?: any;
    row_id?: number;
  }>;
};

export default function Page() {
  const [data, setData] = useState<DueResp | null>(null);
  const [err, setErr] = useState<string>("");

  async function refresh() {
    setErr("");
    try {
      const json = await getJSON<DueResp>("/cronobuilds/followups/due?limit=10");
      setData(json);
    } catch (e: any) {
      setErr(e?.message || "failed");
    }
  }

  useEffect(() => {
    void refresh();
  }, []);

  return (
    <div>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold">Cronobuilds · Follow-ups</h1>
          <p className="mt-1 text-sm text-zinc-400">
            Pulled live from Baserow. If this page is empty, you have no due follow-ups.
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
        {data ? (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="text-sm text-zinc-400">
              Today: <span className="text-zinc-200">{data.today}</span> · Due:
              <span className="text-zinc-200"> {data.count}</span>
            </div>
            <a
              className="rounded-md border border-sky-800 bg-sky-950/40 px-3 py-2 text-sm text-sky-200 hover:bg-sky-900/40"
              href="/api/cronobuilds/followups/priority?limit=10"
              target="_blank"
              rel="noreferrer"
            >
              Priority list (text)
            </a>
          </div>
        ) : (
          <div className="text-sm text-zinc-400">Loading…</div>
        )}

        {data?.followups?.length ? (
          <div className="grid gap-2">
            {data.followups.map((f) => (
              <div
                key={`${f.row_id ?? "x"}-${f.business_name}`}
                className="rounded-lg border border-zinc-800 bg-zinc-950/30 p-3"
              >
                <div className="text-sm font-semibold">{f.business_name}</div>
                <div className="mt-1 text-xs text-zinc-400">
                  {f.phone_number ? `Phone: ${f.phone_number} · ` : ""}
                  Follow-up: {f.follow_up_date}
                </div>
              </div>
            ))}
          </div>
        ) : data ? (
          <div className="rounded-lg border border-zinc-800 bg-zinc-950/30 p-4 text-sm text-zinc-300">
            No due follow-ups.
          </div>
        ) : null}
      </div>
    </div>
  );
}
