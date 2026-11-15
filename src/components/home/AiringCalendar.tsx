"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { ScheduleItem } from "@/lib/types";
import { useStore } from "@/lib/store";
import { AnimeLink } from "../anime/useOpenAnime";

const dayKey = (d: Date) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;

export type CalendarHydration = "pending" | "ready";
export type CalendarFilter = { day: number; onlyMine: boolean };

export function useCalendar(schedule: ScheduleItem[]) {
  const [hydration, setHydration] = useState<CalendarHydration>("pending");
  const [filter, setFilter] = useState<CalendarFilter>({ day: 0, onlyMine: false });
  const [now, setNow] = useState<number>(0);
  const entries = useStore((s) => s.entries);
  const hydrated = useStore((s) => s.hydrated);

  useEffect(() => {
    setNow(Date.now());
    setHydration("ready");
    const iv = setInterval(() => setNow(Date.now()), 60000);
    return () => clearInterval(iv);
  }, []);

  const days = useMemo(() => {
    if (hydration === "pending" || now === 0) return [];
    const base = new Date(now);
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(base.getFullYear(), base.getMonth(), base.getDate() + i);
      return { key: dayKey(d), date: d };
    });
  }, [hydration, now]);

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

  const visibleItems = useMemo(() => {
    let items = days[filter.day] ? (byDay.get(days[filter.day].key) ?? []) : [];
    if (filter.onlyMine && hydrated) items = items.filter((s) => entries[s.anime.id]);
    return items;
  }, [days, filter.day, filter.onlyMine, byDay, hydrated, entries]);

  const setDay = useCallback((day: number) => {
    setFilter((f) => ({ ...f, day }));
  }, []);

  const setOnlyMine = useCallback((onlyMine: boolean) => {
    setFilter((f) => ({ ...f, onlyMine }));
  }, []);

  return {
    hydration,
    filter,
    setDay,
    setOnlyMine,
    days,
    byDay,
    visibleItems,
    now,
    hydrated,
    entries,
  };
}

export default function AiringCalendar({ schedule }: { schedule: ScheduleItem[] }) {
  const {
    hydration,
    filter,
    setDay,
    setOnlyMine,
    days,
    byDay,
    visibleItems,
    now,
    hydrated,
    entries,
  } = useCalendar(schedule);

  const onTabKeyDown = (e: React.KeyboardEvent, idx: number) => {
    if (days.length === 0) return;
    let next = idx;
    if (e.key === "ArrowRight") next = (idx + 1) % days.length;
    else if (e.key === "ArrowLeft") next = (idx - 1 + days.length) % days.length;
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = days.length - 1;
    else return;
    e.preventDefault();
    setDay(next);
    document.getElementById(`schedule-tab-${next}`)?.focus();
  };

  return (
    <section className="mt-10">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg font-bold sm:text-xl">Airing schedule</h2>
        <label className="flex cursor-pointer items-center gap-2 text-sm text-muted">
          <input
            type="checkbox"
            checked={filter.onlyMine}
            onChange={(e) => setOnlyMine(e.target.checked)}
          />
          Only my list
        </label>
      </div>

      <div role="tablist" aria-label="Schedule days" className="no-scrollbar mb-4 flex gap-2 overflow-x-auto">
        {hydration === "pending"
          ? Array.from({ length: 7 }, (_, i) => <div key={i} className="skeleton h-14 w-16 shrink-0 rounded-lg" />)
          : days.map((d, i) => {
              const count = byDay.get(d.key)?.length ?? 0;
              const isSelected = filter.day === i;
              return (
                <button
                  key={d.key}
                  id={`schedule-tab-${i}`}
                  role="tab"
                  tabIndex={isSelected ? 0 : -1}
                  aria-selected={isSelected}
                  aria-controls="schedule-tabpanel"
                  onClick={() => setDay(i)}
                  onKeyDown={(e) => onTabKeyDown(e, i)}
                  className={`flex h-14 min-w-[68px] shrink-0 flex-col items-center justify-center rounded-lg border px-3 text-sm transition active:scale-95 hover:-translate-y-0.5 ${
                    isSelected
                      ? "border-accent bg-accent text-black"
                      : "border-line bg-panel text-soft hover:border-muted"
                  }`}
                >
                  <span className="text-[11px] font-bold uppercase">
                    {i === 0 ? "Today" : d.date.toLocaleDateString([], { weekday: "short" })}
                  </span>
                  <span className={`text-xs ${isSelected ? "text-black/70" : "text-dim"}`}>
                    {d.date.toLocaleDateString([], { month: "short", day: "numeric" })} · {count}
                  </span>
                </button>
              );
            })}
      </div>

      <div id="schedule-tabpanel" role="tabpanel" aria-labelledby={`schedule-tab-${filter.day}`}>
        {schedule.length === 0 ? (
          <p className="rounded-lg border border-line bg-panel p-6 text-center text-sm text-muted">
            The airing schedule is unavailable right now.
          </p>
        ) : visibleItems.length === 0 ? (
          <p className="rounded-lg border border-line bg-panel p-6 text-center text-sm text-muted">
            {filter.onlyMine ? "Nothing from your list airs this day." : "Nothing scheduled for this day."}
          </p>
        ) : (
          <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 min-[1500px]:grid-cols-4">
            {visibleItems.map((s) => {
              const mine = hydrated ? entries[s.anime.id] : undefined;
              const aired = hydration === "ready" && now > 0 && s.airingAt * 1000 < now;
              return (
                <li key={`${s.anime.id}-${s.episode}`}>
                  <AnimeLink
                    id={s.anime.id}
                    className={`flex items-center gap-3 rounded-lg border bg-panel p-2 transition hover:border-accent ${
                      mine ? "border-watching/50" : "border-line"
                    } ${aired ? "opacity-60" : ""}`}
                  >
                    {s.anime.cover ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={s.anime.cover} alt="" loading="lazy" className="h-16 w-11 shrink-0 rounded object-cover" />
                    ) : (
                      <div className="h-16 w-11 shrink-0 rounded bg-panel2" />
                    )}
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
      </div>
    </section>
  );
}
