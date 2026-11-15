"use client";

import { useEffect, useState } from "react";
import { Play, Star, Trophy } from "lucide-react";
import type { AnimeDetail } from "@/lib/types";
import { countdown, titleCase, formatLabel } from "@/lib/format";
import { mappingLinks } from "@/lib/aniZip";
import { useAniZip } from "@/lib/useAniZip";
import NextEpisodeCard from "./NextEpisodeCard";

const LINK_CLS =
  "rounded border border-line px-2.5 py-1 text-muted transition hover:-translate-y-0.5 hover:border-accent hover:text-white active:scale-95";

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  if (value === null || value === undefined || value === "") return null;
  return (
    <div className="flex justify-between gap-4 border-b border-line/60 py-2 text-sm last:border-0">
      <dt className="text-dim">{label}</dt>
      <dd className="text-right text-soft">{value}</dd>
    </div>
  );
}

export default function TabInfo({ anime }: { anime: AnimeDetail }) {
  const [expanded, setExpanded] = useState(false);
  const [trailer, setTrailer] = useState(false);
  const [now, setNow] = useState(0);
  const { data: zip, loading: zipLoading } = useAniZip(anime.id);

  useEffect(() => {
    const t0 = setTimeout(() => setNow(Date.now()), 0);
    const t = setInterval(() => setNow(Date.now()), 60000);
    return () => {
      clearTimeout(t0);
      clearInterval(t);
    };
  }, []);

  const streaming = anime.externalLinks.filter((l) => l.type === "STREAMING");
  const social = anime.externalLinks
    .filter((l) => l.type !== null && l.type !== "STREAMING")
    .slice(0, 6);
  const extra = mappingLinks(zip).filter(
    (l) => !social.some((s) => s.site.toLowerCase() === l.name.toLowerCase()),
  );
  const desc = anime.description ?? "No synopsis available.";
  const long = desc.length > 420;
  const hasAniZipNext =
    !!zip?.episodes &&
    Object.values(zip.episodes).some(
      (e) => e.airDateUtc && new Date(e.airDateUtc).getTime() > now - 60_000,
    );

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
      <div className="min-w-0 space-y-6">
        <NextEpisodeCard anilistId={anime.id} />
        {!hasAniZipNext && anime.nextAiring && now > 0 && (
          <div className="flex items-center gap-3 rounded-lg border border-watching/40 bg-watching/10 px-4 py-3 text-sm">
            <span className="h-2 w-2 animate-pulse rounded-full bg-[#00ff00]" />
            <span>
              Episode <b>{anime.nextAiring.episode}</b> airs in{" "}
              <b className="text-watching">{countdown(anime.nextAiring.airingAt, now)}</b>
              <span className="ml-2 text-dim">
                {new Date(anime.nextAiring.airingAt * 1000).toLocaleString([], {
                  weekday: "short",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </span>
          </div>
        )}

        <section>
          <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-dim">Synopsis</h2>
          <p className={`whitespace-pre-line text-[15px] leading-relaxed text-soft ${!expanded && long ? "line-clamp-6" : ""}`}>
            {desc}
          </p>
          {long && (
            <button
              onClick={() => setExpanded((v) => !v)}
              className="mt-1 text-sm text-accent transition hover:underline active:scale-95"
            >
              {expanded ? "Show less" : "Read more"}
            </button>
          )}
        </section>

        {anime.genres.length > 0 && (
          <section className="flex flex-wrap gap-2">
            {anime.genres.map((g) => (
              <a
                key={g}
                href={`/search?genre=${encodeURIComponent(g)}`}
                className="rounded-full border border-line bg-panel px-3 py-1 text-xs text-accent transition hover:-translate-y-0.5 hover:border-accent active:scale-95"
              >
                {g}
              </a>
            ))}
          </section>
        )}

        {anime.trailer?.site === "youtube" && (
          <section>
            <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-dim">Trailer</h2>
            {trailer ? (
              <div className="relative aspect-video w-full max-w-lg overflow-hidden rounded-lg border border-line">
                <iframe
                  src={`https://www.youtube-nocookie.com/embed/${anime.trailer.id}?autoplay=1`}
                  title="Trailer"
                  allow="autoplay; encrypted-media; picture-in-picture"
                  allowFullScreen
                  className="absolute inset-0 h-full w-full"
                />
              </div>
            ) : (
              <button
                onClick={() => setTrailer(true)}
                className="group relative block aspect-video w-full max-w-lg overflow-hidden rounded-lg border border-line"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`https://i.ytimg.com/vi/${anime.trailer.id}/hqdefault.jpg`}
                  alt="Trailer thumbnail"
                  className="h-full w-full object-cover transition group-hover:scale-105"
                />
                <span className="absolute inset-0 grid place-items-center bg-black/30">
                  <span className="grid h-14 w-14 place-items-center rounded-full bg-white/90 text-black transition duration-300 group-hover:scale-110 group-active:scale-95">
                    <Play size={22} className="ml-0.5 fill-black" />
                  </span>
                </span>
              </button>
            )}
          </section>
        )}

        {(streaming.length > 0 || anime.streamingEpisodes.length > 0) && (
          <section>
            <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-dim">Where to watch</h2>
            <div className="flex flex-wrap gap-2">
              {streaming.map((l) => (
                <a
                  key={l.url}
                  href={l.url}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="rounded-md px-3 py-1.5 text-xs font-bold text-black transition hover:-translate-y-0.5 hover:brightness-110 active:scale-95"
                  style={{ background: l.color ?? "#bbdbdf" }}
                >
                  {l.site}
                </a>
              ))}
            </div>
            {anime.streamingEpisodes.length > 0 && (
              <ul className="thin-scroll mt-3 grid max-h-72 gap-2 overflow-y-auto pr-1 sm:grid-cols-2">
                {anime.streamingEpisodes.slice(0, 40).map((e) => (
                  <li key={e.url}>
                    <a
                      href={e.url}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="flex items-center gap-3 rounded-lg border border-line bg-panel p-2 transition hover:border-accent active:scale-[0.98]"
                    >
                      {e.thumbnail && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={e.thumbnail} alt="" loading="lazy" className="h-12 w-20 shrink-0 rounded object-cover" />
                      )}
                      <span className="min-w-0">
                        <span className="line-clamp-2 text-xs text-soft">{e.title}</span>
                        <span className="text-[10px] text-dim">{e.site}</span>
                      </span>
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}
      </div>

      <aside className="space-y-5">
        {anime.rankings.length > 0 && (
          <div className="space-y-1.5">
            {anime.rankings.map((r) => (
              <div key={r.context + r.rank} className="flex items-center gap-2 text-sm text-soft">
                {r.context.toLowerCase().includes("rated") ? (
                  <Star size={14} className="text-planned" />
                ) : (
                  <Trophy size={14} className="text-accent" />
                )}
                <span>
                  #{r.rank} <span className="text-muted">{r.context}</span>
                </span>
              </div>
            ))}
          </div>
        )}

        <dl className="rounded-lg border border-line bg-panel px-4 py-1">
          <Row label="Format" value={formatLabel(anime.format)} />
          <Row label="Episodes" value={anime.episodes} />
          <Row label="Duration" value={anime.duration ? `${anime.duration} min` : null} />
          <Row label="Status" value={titleCase(anime.status)} />
          <Row
            label="Aired"
            value={
              anime.startDate
                ? `${anime.startDate}${anime.endDate && anime.endDate !== anime.startDate ? ` → ${anime.endDate}` : ""}`
                : null
            }
          />
          <Row label="Season" value={anime.year ? `${titleCase(anime.season)} ${anime.year}` : null} />
          <Row label="Source" value={titleCase(anime.source)} />
          <Row label="Studio" value={anime.studios.slice(0, 3).join(", ")} />
          <Row label="Score" value={anime.score ? `${anime.score}%` : null} />
          <Row label="Popularity" value={anime.popularity?.toLocaleString("en-US")} />
          <Row label="Favourites" value={anime.favourites?.toLocaleString("en-US")} />
        </dl>

        {anime.tags.length > 0 && (
          <div>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-dim">Tags</h3>
            <div className="flex flex-wrap gap-1.5">
              {anime.tags.map((t) => (
                <span key={t.name} className="rounded bg-panel2 px-2 py-0.5 text-[11px] text-muted">
                  {t.name} <span className="text-dim">{t.rank}%</span>
                </span>
              ))}
            </div>
          </div>
        )}

        {anime.synonyms.length > 0 && (
          <div>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-dim">Synonyms</h3>
            <ul className="space-y-0.5 text-xs text-muted">
              {anime.synonyms.slice(0, 5).map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ul>
          </div>
        )}

        <div className="flex flex-wrap gap-2 text-xs">
          {anime.siteUrl && (
            <a href={anime.siteUrl} target="_blank" rel="noreferrer noopener" className={LINK_CLS}>
              AniList ↗
            </a>
          )}
          {social.map((l) => (
            <a key={l.url} href={l.url} target="_blank" rel="noreferrer noopener" className={LINK_CLS}>
              {l.site} ↗
            </a>
          ))}
          {extra.map((l) => (
            <a key={l.name} href={l.url} target="_blank" rel="noreferrer noopener" className={`anim-fade ${LINK_CLS}`}>
              {l.name} ↗
            </a>
          ))}
          {zipLoading && [0, 1, 2].map((n) => <span key={n} className="skeleton h-6 w-16 rounded" />)}
        </div>
      </aside>
    </div>
  );
}
