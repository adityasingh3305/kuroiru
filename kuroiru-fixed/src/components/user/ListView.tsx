"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Minus, Plus, Trash2 } from "lucide-react";
import { useStore } from "@/lib/store";
import { WATCH_STATUSES, type WatchStatus } from "@/lib/types";
import { formatLabel } from "@/lib/format";
import { AnimeLink } from "../anime/useOpenAnime";

export default function ListView() {
  const hydrated = useStore((s) => s.hydrated);
  const entries = useStore((s) => s.entries);
  const track = useStore((s) => s.track);
  const remove = useStore((s) => s.remove);
  const [tab, setTab] = useState<WatchStatus | "ALL">("CURRENT");

  const all = useMemo(
    () => Object.values(entries).sort((a, b) => b.updatedAt - a.updatedAt),
    [entries],
  );
  const counts = (s: WatchStatus) => all.filter((e) => e.status === s).length;
  const shown = tab === "ALL" ? all : all.filter((e) => e.status === tab);

  return (
    <div>
      <h1 className="mb-4 text-2xl font-bold">My list</h1>
      <div className="no-scrollbar mb-5 flex gap-2 overflow-x-auto" role="tablist">
        {[{ value: "ALL" as const, label: "All", color: "#ffffff" }, ...WATCH_STATUSES].map((s) => (
          <button
            key={s.value}
            role="tab"
            aria-selected={tab === s.value}
            onClick={() => setTab(s.value)}
            className={`shrink-0 rounded-full border px-4 py-1.5 text-sm transition ${
              tab === s.value ? "border-transparent text-black" : "border-line text-muted hover:text-white"
            }`}
            style={tab === s.value ? { background: s.color } : undefined}
          >
            {s.label}{" "}
            <span className="opacity-70">{hydrated ? (s.value === "ALL" ? all.length : counts(s.value)) : 0}</span>
          </button>
        ))}
      </div>

      {!hydrated ? (
        <div className="space-y-2">
          {[0, 1, 2].map((i) => (
            <div key={i} className="skeleton h-24 rounded-lg" />
          ))}
        </div>
      ) : shown.length === 0 ? (
        <div className="rounded-lg border border-line bg-panel p-10 text-center">
          <p className="text-muted">Nothing here yet.</p>
          <Link href="/search" className="mt-3 inline-block rounded-lg bg-accent px-4 py-2 text-sm font-medium text-black">
            Browse anime
          </Link>
        </div>
      ) : (
        <ul className="grid gap-3 lg:grid-cols-2 min-[1500px]:grid-cols-3">
          {shown.map((e) => {
            const meta = WATCH_STATUSES.find((s) => s.value === e.status) ?? WATCH_STATUSES[0];
            const anime = { id: e.animeId, title: e.title, cover: e.cover, format: e.format, episodes: e.episodes };
            return (
              <li key={e.animeId} className="flex gap-3 rounded-lg border border-line bg-panel p-3">
                <AnimeLink id={e.animeId} className="shrink-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={e.cover} alt="" className="h-24 w-16 rounded object-cover" />
                </AnimeLink>
                <div className="flex min-w-0 flex-1 flex-col">
                  <AnimeLink id={e.animeId} className="line-clamp-2 text-sm font-medium text-white hover:text-accent">
                    {e.title}
                  </AnimeLink>
                  <div className="mt-0.5 text-xs text-dim">
                    <span style={{ color: meta.color }}>{meta.label}</span>
                    {e.format && ` · ${formatLabel(e.format)}`}
                    {e.score > 0 && <span className="text-planned"> · ★ {e.score}</span>}
                  </div>
                  <div className="mt-auto flex items-center gap-2 pt-2">
                    <button aria-label="Decrease episode" onClick={() => track(anime, { progress: e.progress - 1 })} className="grid h-7 w-7 place-items-center rounded border border-line text-muted hover:text-white">
                      <Minus size={12} />
                    </button>
                    <span className="min-w-[56px] text-center text-xs tabular-nums">
                      {e.progress} / {e.episodes ?? "?"}
                    </span>
                    <button aria-label="Increase episode" onClick={() => track(anime, { progress: e.progress + 1 })} className="grid h-7 w-7 place-items-center rounded border border-line text-muted hover:text-white">
                      <Plus size={12} />
                    </button>
                    <button aria-label="Remove" onClick={() => remove(e.animeId)} className="ml-auto grid h-7 w-7 place-items-center rounded text-dim hover:text-dropped">
                      <Trash2 size={14} />
                    </button>
                  </div>
                  {e.episodes ? (
                    <div className="mt-2 h-1 overflow-hidden rounded-full bg-line">
                      <div className="h-full rounded-full" style={{ width: `${Math.min(100, (e.progress / e.episodes) * 100)}%`, background: meta.color }} />
                    </div>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
