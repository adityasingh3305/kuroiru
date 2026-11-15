"use client";

import { useEffect, useState } from "react";
import { Loader2, Clock, Star } from "lucide-react";
import { getAniZip, splitEpisodes, type AniZipEpisode } from "@/lib/aniZip";

export default function TabEpisodes({
  anilistId,
  progress = 0,
}: {
  anilistId: number;
  progress?: number;
}) {
  const [eps, setEps] = useState<AniZipEpisode[] | null>(null);
  const [specials, setSpecials] = useState<AniZipEpisode[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    getAniZip(anilistId).then((d) => {
      if (!alive) return;
      if (d && d.episodes) {
        const { main, specials } = splitEpisodes(d);
        setEps(main);
        setSpecials(specials);
      } else {
        setEps(null);
      }
      setLoading(false);
    });
    return () => {
      alive = false;
    };
  }, [anilistId]);

  if (loading) {
    return (
      <div className="grid place-items-center py-10 text-muted">
        <Loader2 className="animate-spin" />
      </div>
    );
  }

  if (!eps?.length) {
    return <p className="py-10 text-center text-sm text-dim">No episode data available.</p>;
  }

  const Row = ({ ep }: { ep: AniZipEpisode }) => {
    const isNum = /^\d+$/.test(ep.episode);
    const watched = isNum && Number(ep.episode) <= progress;
    const isOpen = open === ep.episode;
    const rawTitle = ep.title?.en ?? ep.title?.["x-jat"] ?? `Episode ${ep.episode}`;
    const cleanTitle = rawTitle.replace(/`/g, "'");
    const rawText = ep.summary ?? ep.overview;
    const text = rawText ? rawText.replace(/`/g, "'").split(/\nSource:/i)[0].trim() : null;

    return (
      <button
        type="button"
        onClick={() => setOpen(isOpen ? null : ep.episode)}
        className={`flex w-full gap-3 rounded-lg border border-line bg-panel p-2 text-left transition hover:border-accent active:scale-[0.98] ${
          watched ? "opacity-60" : ""
        }`}
      >
        {ep.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={ep.image}
            alt=""
            loading="lazy"
            className="h-[72px] w-32 shrink-0 rounded object-cover"
          />
        ) : (
          <div className="grid h-[72px] w-32 shrink-0 place-items-center rounded bg-panel2 text-dim font-medium">
            {ep.episode}
          </div>
        )}

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 text-sm text-soft">
            <span className="font-semibold text-accent">{ep.episode}.</span>
            <span className="truncate">{cleanTitle}</span>
          </div>
          <div className="mt-0.5 flex flex-wrap items-center gap-3 text-xs text-dim">
            {ep.airdate && <span>{ep.airdate}</span>}
            {(ep.runtime ?? ep.length) ? (
              <span className="inline-flex items-center gap-1">
                <Clock size={11} /> {ep.runtime ?? ep.length}m
              </span>
            ) : null}
            {ep.rating && (
              <span className="inline-flex items-center gap-1 text-planned">
                <Star size={11} className="fill-planned" /> {ep.rating}
              </span>
            )}
            {watched && <span className="text-[11px] text-watching">Watched</span>}
          </div>
          {text && (
            <p className={`mt-1 text-xs text-muted ${isOpen ? "" : "line-clamp-2"}`}>
              {text}
            </p>
          )}
        </div>
      </button>
    );
  };

  return (
    <div className="space-y-2 anim-fade">
      {eps.map((e) => (
        <Row key={e.episode} ep={e} />
      ))}
      {specials.length > 0 && (
        <>
          <h4 className="pt-3 text-xs uppercase tracking-wide text-dim">Specials</h4>
          {specials.map((e) => (
            <Row key={e.episode} ep={e} />
          ))}
        </>
      )}
    </div>
  );
}
