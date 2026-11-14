"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Minus, Plus, Trash2 } from "lucide-react";
import { useStore } from "@/lib/store";
import { WATCH_STATUSES, type WatchStatus } from "@/lib/types";
import { formatLabel } from "@/lib/format";
import { AnimeLink } from "../anime/useOpenAnime";

const ALL_TABS = [{ value: "ALL" as const, label: "All", color: "#ffffff" }, ...WATCH_STATUSES];

export default function ListView() {
  const hydrated = useStore((s) => s.hydrated);
  const entries = useStore((s) => s.entries);
  const track = useStore((s) => s.track);
  const remove = useStore((s) => s.remove);
  const [tab, setTab] = useState<WatchStatus | "ALL">("ALL");

  const all = useMemo(
    () => Object.values(entries).sort((a, b) => a.animeId - b.animeId),
    [entries],
  );
  const counts = useCallback(
    (s: WatchStatus) => all.filter((e) => e.status === s).length,
    [all],
  );
  const visibleTabs = useMemo(
    () => ALL_TABS.filter((s) => s.value === "ALL" || !hydrated || counts(s.value) > 0),
    [counts, hydrated],
  );
  const shown = tab === "ALL" ? all : all.filter((e) => e.status === tab);

  useEffect(() => {
    if (hydrated && tab !== "ALL" && counts(tab) === 0) {
      setTab("ALL");
    }
  }, [hydrated, tab, counts]);

  const onTabKeyDown = (e: React.KeyboardEvent, idx: number) => {
    let next = idx;
    if (e.key === "ArrowRight") next = (idx + 1) % visibleTabs.length;
    else if (e.key === "ArrowLeft") next = (idx - 1 + visibleTabs.length) % visibleTabs.length;
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = visibleTabs.length - 1;
    else return;
    e.preventDefault();
    const nextVal = visibleTabs[next].value;
    setTab(nextVal);
    document.getElementById(`list-tab-${nextVal}`)?.focus();
  };

  return (
    <div>
      <h1 className="mb-4 text-2xl font-bold">My list</h1>
      <div className="no-scrollbar mb-5 flex gap-2 overflow-x-auto" role="tablist" aria-label="Watchlist status filter">
        {visibleTabs.map((s, idx) => (
          <button
            key={s.value}
            id={`list-tab-${s.value}`}
            role="tab"
            tabIndex={tab === s.value ? 0 : -1}
            aria-selected={tab === s.value}
            aria-controls="list-tabpanel"
            onClick={() => setTab(s.value)}
            onKeyDown={(e) => onTabKeyDown(e, idx)}
            className={`shrink-0 rounded-full border px-4 py-1.5 text-sm transition active:scale-95 hover:-translate-y-0.5 ${
              tab === s.value
                ? "border-transparent text-black"
                : "border-line bg-panel text-muted hover:border-current hover:text-[var(--tw-ring-color)]"
            }`}
            style={
              tab === s.value
                ? { background: s.color }
                : ({ "--tw-ring-color": s.color } as React.CSSProperties)
            }
          >
            {s.label}{" "}
            <span className={tab === s.value ? "opacity-60" : "text-dim"}>
              {hydrated ? (s.value === "ALL" ? all.length : counts(s.value)) : 0}
            </span>
          </button>
        ))}
      </div>

      <div id="list-tabpanel" role="tabpanel" aria-labelledby={`list-tab-${tab}`}>
        {!hydrated ? (
          <div className="space-y-2">
            {[0, 1, 2].map((i) => (
              <div key={i} className="skeleton h-24 rounded-lg" />
            ))}
          </div>
        ) : shown.length === 0 ? (
          <div className="rounded-lg border border-dashed border-line bg-panel p-16 text-center">
            <p className="mb-1 text-2xl">📺</p>
            <p className="text-muted">Nothing here yet.</p>
            <Link href="/search" className="btn btn-lift btn-shine mt-3 inline-block rounded-lg bg-accent px-4 py-2 text-sm font-medium text-black transition hover:-translate-y-0.5 active:scale-95">
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
                    {e.cover ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={e.cover} alt="" loading="lazy" className="h-24 w-16 rounded object-cover" />
                    ) : (
                      <div className="h-24 w-16 rounded bg-panel2" />
                    )}
                  </AnimeLink>
                  <div className="flex min-w-0 flex-1 flex-col">
                    <AnimeLink id={e.animeId} className="line-clamp-2 text-sm font-medium text-white hover:text-accent">
                      {e.title}
                    </AnimeLink>
                    <div className="mt-0.5 text-xs text-dim">
                      <span style={{ color: meta.color }}>{meta.label}</span>
                      {e.format && ` · ${formatLabel(e.format)}`}
                      {e.score > 0 && <span className="text-yellow-400"> · ★ {e.score}</span>}
                    </div>
                    <div className="mt-auto flex items-center gap-2 pt-2">
                      <button
                        aria-label="Decrease episode"
                        disabled={e.progress <= 0}
                        onClick={() => {
                          if (e.progress <= 0) return;
                          track(anime, { progress: e.progress - 1 });
                        }}
                        className="grid h-7 w-7 place-items-center rounded border border-line text-muted transition hover:bg-white/10 hover:text-white active:scale-75 disabled:cursor-not-allowed disabled:opacity-30"
                      >
                        <Minus size={12} />
                      </button>
                      <span className="min-w-[56px] text-center text-xs tabular-nums">
                        <span key={e.progress} className="icon-pop text-white">{e.progress}</span> / {e.episodes ?? "?"}
                      </span>
                      <button
                        aria-label="Increase episode"
                        disabled={!!e.episodes && e.progress >= e.episodes}
                        onClick={() => {
                          if (e.episodes && e.progress >= e.episodes) return;
                          const next = e.progress + 1;
                          track(anime, { progress: next });
                          // Auto-suggest completion
                          if (e.episodes && next >= e.episodes && e.status !== "COMPLETED") {
                            if (window.confirm(`Finished ${e.title}? Mark as Completed?`)) {
                              track(anime, { progress: next, status: "COMPLETED" });
                            }
                          }
                        }}
                        className="grid h-7 w-7 place-items-center rounded border border-line text-muted transition hover:bg-white/10 hover:text-white active:scale-75 disabled:cursor-not-allowed disabled:opacity-30"
                      >
                        <Plus size={12} />
                      </button>
                      <button
                        aria-label="Remove"
                        onClick={() => {
                          if (window.confirm(`Remove "${e.title}" from your list?`)) {
                            remove(e.animeId);
                          }
                        }}
                        className="btn icon-wiggle ml-auto grid h-7 w-7 place-items-center rounded text-dim transition hover:-rotate-12 hover:text-dropped active:scale-90"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                    {e.episodes ? (
                      <div className="mt-2 h-1 overflow-hidden rounded-full bg-line">
                        <div
                          className="h-full rounded-full transition-all duration-300"
                          style={{
                            width: `${Math.min(100, (e.progress / e.episodes) * 100)}%`,
                            background: meta.color,
                          }}
                        />
                      </div>
                    ) : null}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
