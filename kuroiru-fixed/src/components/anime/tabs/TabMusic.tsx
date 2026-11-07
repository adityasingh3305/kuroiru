"use client";

import { useEffect, useRef, useState } from "react";
import { Music2, Play, Video, Headphones } from "lucide-react";
import type { AnimeTheme } from "@/lib/types";

export default function TabMusic({ animeId }: { animeId: number }) {
  const [themes, setThemes] = useState<AnimeTheme[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [playing, setPlaying] = useState<AnimeTheme | null>(null);
  const [audioOnly, setAudioOnly] = useState(false);
  const [playError, setPlayError] = useState(false);
  const mediaRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const ctrl = new AbortController();
    fetch(`/api/themes/${animeId}`, { signal: ctrl.signal })
      .then(async (r) => {
        const d = await r.json().catch(() => ({}));
        if (!r.ok) throw new Error("AnimeThemes unavailable");
        setFailed(false);
        setThemes(d.themes ?? []);
      })
      .catch(() => {
        if (!ctrl.signal.aborted) {
          setThemes([]);
          setFailed(true);
        }
      });
    return () => ctrl.abort();
  }, [animeId]);

  if (themes === null) {
    return (
      <div className="space-y-2">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="skeleton h-14 rounded-lg" />
        ))}
      </div>
    );
  }

  if (themes.length === 0) {
    return (
      <div className="rounded-lg border border-line bg-panel p-8 text-center text-sm text-muted">
        <Music2 className="mx-auto mb-2 text-dim" />
        {failed
          ? "Couldn't reach AnimeThemes right now. Try again later."
          : "No openings or endings found on AnimeThemes for this title."}
      </div>
    );
  }

  const video = playing?.videos.find((v) => !v.tags.includes("Lyrics")) ?? playing?.videos[0];
  const isAudio = audioOnly && !!video?.audio;
  const src = video ? (isAudio ? video.audio : video.link) : null;
  const ops = themes.filter((t) => t.type === "OP");
  const eds = themes.filter((t) => t.type === "ED");
  const other = themes.filter((t) => t.type !== "OP" && t.type !== "ED");

  const play = (t: AnimeTheme) => {
    setPlayError(false);
    setPlaying(t);
  };

  const renderList = (title: string, items: AnimeTheme[]) =>
    items.length === 0 ? null : (
      <section>
        <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-dim">{title}</h3>
        <ul className="space-y-2">
          {items.map((t) => {
            const active = playing?.id === t.id;
            return (
              <li key={t.id}>
                <button
                  onClick={() => play(t)}
                  disabled={t.videos.length === 0}
                  className={`flex w-full items-center gap-3 rounded-lg border p-3 text-left transition disabled:opacity-40 ${
                    active ? "border-accent bg-accent/10" : "border-line bg-panel hover:border-line hover:bg-panel2"
                  }`}
                >
                  <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-full ${active ? "bg-accent text-black" : "bg-panel2 text-soft"}`}>
                    <Play size={14} className="ml-0.5" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm text-white">{t.title}</span>
                    <span className="block truncate text-xs text-dim">
                      {t.artists.length ? t.artists.join(", ") : "Unknown artist"}
                      {t.episodes ? ` · eps ${t.episodes}` : ""}
                    </span>
                  </span>
                  <span className="shrink-0 rounded bg-panel2 px-2 py-0.5 text-xs font-bold text-accent">{t.slug}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </section>
    );

  return (
    <div className="space-y-5">
      {playing && src && (
        <div className="overflow-hidden rounded-lg border border-line bg-black">
          <video
            key={src}
            ref={mediaRef}
            src={src}
            controls
            autoPlay
            playsInline
            onError={() => setPlayError(true)}
            className={isAudio ? "h-14 w-full" : "aspect-video w-full"}
          />
          <div className="flex items-center justify-between gap-3 bg-panel px-3 py-2 text-xs">
            <span className="min-w-0 truncate text-soft">
              {playing.slug} — {playing.title}
            </span>
            {video?.audio && (
              <button
                onClick={() => setAudioOnly((v) => !v)}
                className="flex shrink-0 items-center gap-1.5 rounded border border-line px-2 py-1 text-muted hover:text-white"
              >
                {isAudio ? <Video size={12} /> : <Headphones size={12} />}
                {isAudio ? "Show video" : "Audio only"}
              </button>
            )}
          </div>
          {playError && (
            <div className="bg-dropped/15 px-3 py-2 text-xs text-dropped">
              This file couldn&apos;t be played. Try another theme or toggle audio-only.
            </div>
          )}
        </div>
      )}
      {renderList("Openings", ops)}
      {renderList("Endings", eds)}
      {renderList("Other", other)}
      <p className="text-[11px] text-dim">Media provided by AnimeThemes.moe</p>
    </div>
  );
}
