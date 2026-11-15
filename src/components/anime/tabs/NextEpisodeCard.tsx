"use client";

import { useEffect, useState } from "react";
import { CalendarClock } from "lucide-react";
import { useAniZip } from "@/lib/useAniZip";
import { splitEpisodes } from "@/lib/aniZip";

function countdown(ms: number) {
  if (ms <= 0) return "Airing now";
  const total = Math.floor(ms / 60000);
  const d = Math.floor(total / 1440);
  const h = Math.floor((total % 1440) / 60);
  const m = total % 60;
  if (d > 0) return `${d}d ${h}h ${m}m`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

export default function NextEpisodeCard({ anilistId }: { anilistId: number }) {
  const { data } = useAniZip(anilistId);
  const [now, setNow] = useState(() => Date.now());

  // tick once a minute so the countdown stays fresh
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(t);
  }, []);

  if (!data) return null;

  const { main } = splitEpisodes(data);
  const next = main.find(
    (e) => e.airDateUtc && new Date(e.airDateUtc).getTime() > now - 60_000
  );
  if (!next || !next.airDateUtc) return null;

  const airAt = new Date(next.airDateUtc);
  const title = next.title?.en?.replace(/`/g, "'");
  const summary = next.summary
    ?.replace(/\n?Source:.*$/i, "")
    .replace(/`/g, "'")
    .trim();

  return (
    <div className="mb-4 flex gap-3 overflow-hidden rounded-lg border border-line bg-panel p-3 transition hover:border-accent">
      {next.image && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={next.image}
          alt=""
          loading="lazy"
          className="hidden h-20 w-36 shrink-0 rounded object-cover sm:block"
        />
      )}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5 text-xs font-medium text-accent">
          <CalendarClock size={14} />
          Next episode · Ep {next.episode}
        </div>
        {title && (
          <p className="mt-0.5 truncate text-sm font-semibold text-soft">{title}</p>
        )}
        {summary && (
          <p className="mt-1 line-clamp-2 text-xs text-muted">{summary}</p>
        )}
        <p className="mt-1.5 text-xs text-dim">
          <span className="font-semibold text-soft">
            {countdown(airAt.getTime() - now)}
          </span>
          {" · "}
          {airAt.toLocaleString(undefined, {
            weekday: "short",
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </p>
      </div>
    </div>
  );
}
