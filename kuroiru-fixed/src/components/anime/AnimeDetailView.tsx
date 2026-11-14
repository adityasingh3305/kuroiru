"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ExternalLink } from "lucide-react";
import type { AnimeDetail } from "@/lib/types";
import { airStatusColor, formatLabel, titleCase } from "@/lib/format";
import WatchlistButton from "../user/WatchlistButton";
import TabInfo from "./tabs/TabInfo";
import TabEpisodes from "./tabs/TabEpisodes";
import TabRelations from "./tabs/TabRelations";
import TabStaff from "./tabs/TabStaff";
import TabMusic from "./tabs/TabMusic";
import TabCommunity from "./tabs/TabCommunity";
import { useStore } from "@/lib/store";
import { pickImage } from "@/lib/aniZip";
import { useAniZip } from "@/lib/useAniZip";

const TABS = ["Info", "Episodes", "Relations", "Staff", "Music", "Community"] as const;
type Tab = (typeof TABS)[number];

export default function AnimeDetailView({
  id,
  initial,
  inModal = false,
}: {
  id: number;
  initial?: AnimeDetail | null;
  inModal?: boolean;
}) {
  const [anime, setAnime] = useState<AnimeDetail | null>(initial ?? null);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("Info");
  const { data: zip } = useAniZip(id);
  const progress = useStore((s) => (anime && s.hydrated ? (s.entries[anime.id]?.progress ?? 0) : 0));
  const entry = useStore((s) => (s.hydrated ? s.entries[id] : undefined));

  useEffect(() => {
    if (initial) return;
    const ctrl = new AbortController();
    fetch(`/api/anime/${id}`, { signal: ctrl.signal })
      .then(async (r) => {
        if (!r.ok) throw new Error(r.status === 404 ? "Anime not found" : "Failed to load");
        return r.json();
      })
      .then((d) => setAnime(d.anime))
      .catch((e) => {
        if (!ctrl.signal.aborted) setError(e.message);
      });
    return () => ctrl.abort();
  }, [id, initial]);

  if (error) {
    return (
      <div className="grid min-h-[40vh] place-items-center p-10 text-center">
        <div>
          <p className="text-lg text-soft">{error}</p>
          <button onClick={() => location.reload()} className="mt-4 rounded-lg border border-line px-4 py-2 text-sm hover:border-accent">
            Try again
          </button>
        </div>
      </div>
    );
  }

  if (!anime) {
    return (
      <div aria-busy="true">
        <div className="skeleton h-48 sm:h-60" />
        <div className="space-y-3 p-5">
          <div className="skeleton h-7 w-2/3 rounded" />
          <div className="skeleton h-4 w-1/3 rounded" />
          <div className="skeleton h-24 rounded" />
          <div className="skeleton h-40 rounded" />
        </div>
      </div>
    );
  }

  const statusColor = airStatusColor(anime.status);
  const alt = [anime.native, anime.romaji !== anime.title ? anime.romaji : null].filter(Boolean);
  const bannerSrc = anime.banner || pickImage(zip, "Fanart") || anime.cover;

  const onTabKeyDown = (e: React.KeyboardEvent, idx: number) => {
    let nextIdx = idx;
    if (e.key === "ArrowRight") nextIdx = (idx + 1) % TABS.length;
    else if (e.key === "ArrowLeft") nextIdx = (idx - 1 + TABS.length) % TABS.length;
    else if (e.key === "Home") nextIdx = 0;
    else if (e.key === "End") nextIdx = TABS.length - 1;
    else return;
    e.preventDefault();
    const nextTab = TABS[nextIdx];
    setTab(nextTab);
    document.getElementById(`anime-tab-${nextTab}`)?.focus();
  };

  return (
    <article>
      <div
        className="relative h-44 overflow-hidden sm:h-60 sm:rounded-t-xl"
        style={{ background: anime.color ?? "#222" }}
      >
        {bannerSrc && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={bannerSrc}
            alt=""
            className={`h-full w-full object-cover ${anime.banner ? "" : "scale-110 blur-xl"}`}
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-bg via-bg/40 to-transparent" />
      </div>

      <div className="relative px-4 pb-6 sm:px-6">
        <div className="-mt-20 flex gap-4 sm:-mt-24 sm:gap-6">
          {anime.cover ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={anime.cover}
              alt={anime.title}
              className="relative z-10 h-40 w-28 shrink-0 rounded-lg border border-line object-cover shadow-xl sm:h-60 sm:w-40"
            />
          ) : (
            <div className="relative z-10 h-40 w-28 shrink-0 rounded-lg border border-line bg-panel2 shadow-xl sm:h-60 sm:w-40" />
          )}
          <div className="relative z-10 min-w-0 flex-1 self-end">
            <h1 className="text-xl font-bold leading-tight sm:text-3xl">{anime.title}</h1>
            {alt.length > 0 && (
              <p className="mt-1 line-clamp-2 text-xs text-muted sm:text-sm">{alt.join(" · ")}</p>
            )}
            <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-soft sm:text-sm">
              {anime.status && (
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full" style={{ background: statusColor }} />
                  {titleCase(anime.status)}
                </span>
              )}
              {anime.format && <span>{formatLabel(anime.format)}</span>}
              {anime.year && <span>{[titleCase(anime.season), anime.year].filter(Boolean).join(" ")}</span>}
              {anime.episodes && <span>{anime.episodes} eps</span>}
              {anime.score ? <span className="text-planned">★ {(anime.score / 10).toFixed(1)}</span> : null}
            </div>
          </div>
        </div>

        <div className="mt-5">
          <WatchlistButton anime={anime} />
        </div>

        <div
          role="tablist"
          aria-label="Anime sections"
          className={`no-scrollbar sticky ${
            inModal ? "top-0 z-20" : "top-14 z-30"
          } -mx-4 mt-5 flex gap-1 overflow-x-auto border-b border-line bg-bg/95 px-4 backdrop-blur sm:-mx-6 sm:px-6`}
        >
          {TABS.map((t, idx) => (
            <button
              key={t}
              id={`anime-tab-${t}`}
              role="tab"
              tabIndex={tab === t ? 0 : -1}
              aria-selected={tab === t}
              aria-controls={`anime-tabpanel-${t}`}
              onClick={() => setTab(t)}
              onKeyDown={(e) => onTabKeyDown(e, idx)}
              className={`relative shrink-0 px-3 py-2 text-sm font-medium transition-colors active:scale-95 after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:origin-left after:bg-accent after:transition-transform ${
                tab === t ? "text-soft after:scale-x-100" : "text-muted hover:text-soft after:scale-x-0"
              }`}
            >
              {t}
            </button>
          ))}
          {inModal && (
            <Link
              href={`/anime/${anime.id}`}
              className="ml-auto hidden shrink-0 items-center gap-1 self-center px-2 text-xs text-dim hover:text-accent sm:flex"
            >
              Open page <ExternalLink size={12} />
            </Link>
          )}
        </div>

        <div
          id={`anime-tabpanel-${tab}`}
          role="tabpanel"
          aria-labelledby={`anime-tab-${tab}`}
          className="pt-5"
        >
          {tab === "Info" && <TabInfo anime={anime} />}
          {tab === "Episodes" && <TabEpisodes anilistId={anime.id} progress={progress} />}
          {tab === "Relations" && <TabRelations anime={anime} />}
          {tab === "Staff" && <TabStaff anime={anime} />}
          {tab === "Music" && <TabMusic animeId={anime.id} />}
          {tab === "Community" && <TabCommunity animeId={anime.id} />}
        </div>
      </div>
    </article>
  );
}
