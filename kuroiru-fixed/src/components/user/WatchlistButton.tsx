"use client";

import { Minus, Plus, Trash2 } from "lucide-react";
import type { AnimeSummary } from "@/lib/types";
import { WATCH_STATUSES, type WatchStatus } from "@/lib/types";
import { useStore } from "@/lib/store";

export default function WatchlistButton({ anime }: { anime: AnimeSummary }) {
  const entry = useStore((s) => (s.hydrated ? s.entries[anime.id] : undefined));
  const hydrated = useStore((s) => s.hydrated);
  const track = useStore((s) => s.track);
  const remove = useStore((s) => s.remove);
  const synced = useStore((s) => !!s.anilistToken);

  const meta = entry ? WATCH_STATUSES.find((s) => s.value === entry.status) : undefined;
  const total = anime.episodes;

  if (!hydrated) return <div className="skeleton h-24 rounded-lg" />;

  return (
    <div className="rounded-lg border border-line bg-panel p-3">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative">
          <select
            aria-label="Watch status"
            value={entry?.status ?? ""}
            onChange={(e) => {
              const v = e.target.value as WatchStatus;
              if (v) track(anime, { status: v });
            }}
            className="h-10 appearance-none rounded-lg border bg-panel2 pl-3 pr-8 text-sm font-medium focus:outline-none"
            style={{ borderColor: meta?.color ?? "#333", color: meta?.color ?? "#fff" }}
          >
            {!entry && <option value="">+ Add to list</option>}
            {WATCH_STATUSES.map((s) => (
              <option key={s.value} value={s.value} className="bg-panel text-white">
                {s.label}
              </option>
            ))}
          </select>
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted">▾</span>
        </div>

        {entry && (
          <>
            <div className="flex h-10 items-center rounded-lg border border-line bg-panel2">
              <button
                aria-label="Decrease episode"
                onClick={() => track(anime, { progress: entry.progress - 1 })}
                className="grid h-full w-9 place-items-center text-muted hover:text-white"
              >
                <Minus size={14} />
              </button>
              <div className="min-w-[64px] text-center text-sm tabular-nums">
                <span className="text-white">{entry.progress}</span>
                <span className="text-dim"> / {total ?? "?"}</span>
              </div>
              <button
                aria-label="Increase episode"
                onClick={() => track(anime, { progress: entry.progress + 1 })}
                className="grid h-full w-9 place-items-center text-muted hover:text-white"
              >
                <Plus size={14} />
              </button>
            </div>

            <select
              aria-label="Score"
              value={entry.score}
              onChange={(e) => track(anime, { score: Number(e.target.value) })}
              className="h-10 rounded-lg border border-line bg-panel2 px-3 text-sm focus:outline-none"
            >
              <option value={0}>Score: –</option>
              {Array.from({ length: 10 }, (_, i) => 10 - i).map((n) => (
                <option key={n} value={n}>
                  {n} / 10
                </option>
              ))}
            </select>

            <button
              onClick={() => remove(anime.id)}
              aria-label="Remove from list"
              title="Remove from list"
              className="ml-auto grid h-10 w-10 place-items-center rounded-lg border border-line text-muted transition hover:border-dropped hover:text-dropped"
            >
              <Trash2 size={15} />
            </button>
          </>
        )}
      </div>
      {entry && total ? (
        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-line">
          <div
            className="h-full rounded-full transition-all"
            style={{ width: `${Math.min(100, (entry.progress / total) * 100)}%`, background: meta?.color }}
          />
        </div>
      ) : null}
      <p className="mt-2 text-[11px] text-dim">
        {synced ? "Saved locally · syncing to AniList" : "Saved locally — connect AniList to sync"}
      </p>
    </div>
  );
}
