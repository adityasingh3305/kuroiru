"use client";

import { Check, Clock, Play, Star } from "lucide-react";
import type { AnimeSummary, WatchStatus } from "@/lib/types";
import { WATCH_STATUSES } from "@/lib/types";
import { formatLabel } from "@/lib/format";
import { useStore } from "@/lib/store";
import { AnimeLink } from "./useOpenAnime";

export default function AnimeCard({
  anime,
  className = "",
  priority = false,
}: {
  anime: AnimeSummary;
  className?: string;
  priority?: boolean;
}) {
  const entry = useStore((s) => (s.hydrated ? s.entries[anime.id] : undefined));
  const track = useStore((s) => s.track);
  const statusMeta = entry ? WATCH_STATUSES.find((s) => s.value === entry.status) : undefined;

  const quick = (status: WatchStatus) => (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    track(anime, { status });
  };

  const meta = [formatLabel(anime.format), anime.year, anime.episodes ? `${anime.episodes} ep` : null]
    .filter(Boolean)
    .join(" · ");

  return (
    <div className={`group relative min-w-0 transition hover:-translate-y-1 ${className}`}>
      <AnimeLink id={anime.id} className="block" title={anime.title}>
        <div
          className="relative aspect-[2/3] overflow-hidden rounded-lg border border-line bg-panel transition group-hover:border-accent/60"
          style={{ backgroundColor: anime.color ?? undefined }}
        >
          {anime.cover ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={anime.cover}
              alt={anime.title}
              loading={priority ? "eager" : "lazy"}
              className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="h-full w-full bg-panel2" />
          )}
          <div className="absolute inset-x-0 top-0 flex items-start justify-between p-1.5">
            {anime.score ? (
              <span className="flex items-center gap-0.5 rounded bg-black/70 px-1.5 py-0.5 text-[11px] font-medium text-soft backdrop-blur">
                <Star size={10} className="fill-planned text-planned" />
                {(anime.score / 10).toFixed(1)}
              </span>
            ) : (
              <span />
            )}
            {statusMeta && (
              <span
                className="rounded px-1.5 py-0.5 text-[10px] font-bold uppercase text-black"
                style={{ background: statusMeta.color }}
              >
                {entry && entry.status === "CURRENT" && entry.progress > 0
                  ? `Ep ${entry.progress}`
                  : statusMeta.label}
              </span>
            )}
          </div>
          {anime.nextAiring && (
            <span className="absolute bottom-1.5 left-1.5 rounded bg-black/75 px-1.5 py-0.5 text-[10px] text-watching">
              EP {anime.nextAiring.episode} soon
            </span>
          )}
        </div>
        <div className="mt-2 line-clamp-2 text-[13px] font-medium leading-snug text-soft group-hover:text-white">
          {anime.title}
        </div>
        <div className="mt-0.5 truncate text-[11px] text-dim">{meta}</div>
      </AnimeLink>

      {/* quick status — visible on hover (pointer devices) */}
      <div className="pointer-events-none absolute inset-x-0 top-0 hidden aspect-[2/3] items-end justify-center gap-1 p-1.5 opacity-0 transition group-hover:opacity-100 group-focus-within:opacity-100 focus-within:opacity-100 [@media(hover:hover)]:flex">
        <div className="pointer-events-auto mb-0 flex gap-1 rounded-md bg-black/80 p-1 backdrop-blur">
          <QuickBtn label="Plan to watch" active={entry?.status === "PLANNING"} onClick={quick("PLANNING")}>
            <Clock size={14} />
          </QuickBtn>
          <QuickBtn label="Watching" active={entry?.status === "CURRENT"} onClick={quick("CURRENT")}>
            <Play size={14} />
          </QuickBtn>
          <QuickBtn label="Completed" active={entry?.status === "COMPLETED"} onClick={quick("COMPLETED")}>
            <Check size={14} />
          </QuickBtn>
        </div>
      </div>
    </div>
  );
}

function QuickBtn({
  children,
  label,
  active,
  onClick,
}: {
  children: React.ReactNode;
  label: string;
  active: boolean;
  onClick: (e: React.MouseEvent) => void;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className={`btn grid h-7 w-7 place-items-center rounded transition hover:scale-110 active:scale-90 ${
        active ? "bg-accent text-black" : "text-soft hover:bg-white/15"
      }`}
    >
      <span key={String(active)} className={active ? "icon-pop" : ""}>
        {children}
      </span>
    </button>
  );
}

export function CardSkeleton() {
  return (
    <div>
      <div className="skeleton aspect-[2/3] rounded-lg" />
      <div className="skeleton mt-2 h-3 w-4/5 rounded" />
      <div className="skeleton mt-1.5 h-2.5 w-1/2 rounded" />
    </div>
  );
}

export function CardGrid({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-3 gap-x-2 gap-y-5 sm:grid-cols-4 sm:gap-x-3 md:grid-cols-5 lg:grid-cols-6 min-[1500px]:grid-cols-7">
      {children}
    </div>
  );
}
