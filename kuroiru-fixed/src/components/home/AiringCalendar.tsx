"use client";

import { useEffect, useMemo, useState } from "react";
import type { ScheduleItem } from "@/lib/types";
import { useStore } from "@/lib/store";
import { AnimeLink } from "../anime/useOpenAnime";

const dayKey = (d: Date) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;

export default function AiringCalendar({ schedule }: { schedule: ScheduleItem[] }) {
  const [now, setNow] = useState<number | null>(null);
  const [sel, setSel] = useState(0);
  const [onlyMine, setOnlyMine] = useState(false);
  const entries = useStore((s) => s.entries);
  const hydrated = useStore((s) => s.hydrated);

  useEffect(() => {
    const t = setTimeout(() => setNow(Date.now()), 0);
    return () => clearTimeout(t);
  }, []);

  const days = useMemo(() => {
    if (now === null) return [];
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(now + i * 86400000);
      return { key: dayKey(d), date: d };
    });
  }, [now]);

  const byDay = useMemo(() => {
    const m = new Map<string, ScheduleItem[]>();
    for (const s of schedule) {
      const k = dayKey(new Date(s.airingAt * 1000));
      const arr = m.get(k) ?? [];
      arr.push(s);
      m.set(k, arr);
    }
    return m;
  }, [schedule]);

  let items = days[sel] ? (byDay.get(days[sel].key) ?? []) : [];
  if (onlyMine && hydrated) items = items.filter((s) => entries[s.anime.id]);

  return (
    <section className="mt-10">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg font-bold sm:text-xl">Airing schedule</h2>
        <label className="flex cursor-pointer items-center gap-2 text-sm text-muted">
          <input type="checkbox" checked={onlyMine} onChange={(e) => setOnlyMine(e.target.checked)} />
          Only my list
        </label>
      </div>

      <div role="tablist" className="no-scrollbar mb-4 flex gap-2 overflow-x-auto">
        {now === null
          ? Array.from({ length: 7 }, (_, i) => <div key={i} className="skeleton h-14 w-16 shrink-0 rounded-lg" />)
          : days.map((d, i) => {
              const count = byDay.get(d.key)?.length ?? 0;
              return (
                <button
                  key={d.key}
                  role="tab"
                  aria-selected={sel === i}
                  onClick={() => setSel(i)}
                  className={`flex h-14 min-w-[68px] shrink-0 flex-col items-center justify-center rounded-lg border px-3 text-sm transition ${
                    sel === i ? "border-accent bg-accent text-black" : "border-line bg-panel text-soft hover:border-muted"
                  }`}
                >
                  <span className="text-[11px] font-bold uppercase">
                    {i === 0 ? "Today" : d.date.toLocaleDateString([], { weekday: "short" })}
                  </span>
                  <span className={`text-xs ${sel === i ? "text-black/70" : "text-dim"}`}>
                    {d.date.toLocaleDateString([], { month: "short", day: "numeric" })} · {count}
                  </span>
                </button>
              );
            })}
      </div>

      {schedule.length === 0 ? (
        <p className="rounded-lg border border-line bg-panel p-6 text-center text-sm text-muted">
          The airing schedule is unavailable right now.
        </p>
      ) : items.length === 0 ? (
        <p className="rounded-lg border border-line bg-panel p-6 text-center text-sm text-muted">
          {onlyMine ? "Nothing from your list airs this day." : "Nothing scheduled for this day."}
        </p>
      ) : (
        <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 min-[1500px]:grid-cols-4">
          {items.map((s) => {
            const mine = hydrated ? entries[s.anime.id] : undefined;
            const aired = now !== null && s.airingAt * 1000 < now;
            return (
              <li key={`${s.anime.id}-${s.episode}`}>
                <AnimeLink
                  id={s.anime.id}
                  className={`flex items-center gap-3 rounded-lg border bg-panel p-2 transition hover:border-accent ${
                    mine ? "border-watching/50" : "border-line"
                  } ${aired ? "opacity-60" : ""}`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={s.anime.cover} alt="" loading="lazy" className="h-16 w-11 shrink-0 rounded object-cover" />
                  <span className="min-w-0 flex-1">
                    <span className="line-clamp-2 text-sm leading-snug text-soft">{s.anime.title}</span>
                    <span className="mt-0.5 block text-xs text-dim">Episode {s.episode}</span>
                  </span>
                  <span className="shrink-0 text-right">
                    <span className="block text-sm font-medium tabular-nums text-accent">
                      {new Date(s.airingAt * 1000).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                    {mine && <span className="text-[10px] text-watching">In list</span>}
                  </span>
                </AnimeLink>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
