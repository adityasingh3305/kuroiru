"use client";

import { useEffect, useRef, useState } from "react";
import { Music2, Play, Video, Headphones } from "lucide-react";
import type { AnimeTheme } from "@/lib/types";

export type ThemesLoad =
  | { status: "loading" }
  | { status: "error" }
  | { status: "empty" }
  | { status: "ready"; themes: AnimeTheme[] };

export type PlayerState =
  | { status: "idle" }
  | { status: "playing"; theme: AnimeTheme; audioOnly: boolean }
  | { status: "error"; theme: AnimeTheme; audioOnly: boolean };

export default function TabMusic({ animeId }: { animeId: number }) {
  const [load, setLoad] = useState<ThemesLoad>({ status: "loading" });
  const [player, setPlayer] = useState<PlayerState>({ status: "idle" });
  const mediaRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const ctrl = new AbortController();
    fetch(`/api/themes/${animeId}`, { signal: ctrl.signal })
      .then(async (r) => {
        const d = await r.json().catch(() => ({}));
        if (!r.ok) throw new Error("AnimeThemes unavailable");
        if (Array.isArray(d.themes) && d.themes.length > 0) {
          setLoad({ status: "ready", themes: d.themes });
        } else {
          setLoad({ status: "empty" });
        }
      })
      .catch(() => {
        if (!ctrl.signal.aborted) {
          setLoad({ status: "error" });
        }
      });
    return () => ctrl.abort();
  }, [animeId]);

  const playingTheme = player.status !== "idle" ? player.theme : null;
  const isAudioOnly = player.status !== "idle" && player.audioOnly;

  const video = playingTheme
    ? [...playingTheme.videos].sort(
        (a, b) =>
          Number(a.tags.includes("Lyrics")) - Number(b.tags.includes("Lyrics")) ||
          (b.resolution ?? 0) - (a.resolution ?? 0),
      )[0]
    : undefined;
  const isAudio = isAudioOnly && !!video?.audio;
  const src = video ? (isAudio ? video.audio : video.link) : null;

  useEffect(() => {
    if (mediaRef.current) {
      mediaRef.current.load();
    }
  }, [src]);

  if (load.status === "loading") {
    return (
      <div className="space-y-2">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="skeleton h-14 rounded-lg" />
        ))}
      </div>
    );
  }

  if (load.status === "error") {
    return (
      <div className="rounded-lg border border-line bg-panel p-8 text-center text-sm text-muted">
        <Music2 className="mx-auto mb-2 text-dim" />
        Couldn&apos;t reach AnimeThemes right now. Try again later.
      </div>
    );
  }

  if (load.status === "empty") {
    return (
      <div className="rounded-lg border border-line bg-panel p-8 text-center text-sm text-muted">
        <Music2 className="mx-auto mb-2 text-dim" />
        No openings or endings found on AnimeThemes for this title.
      </div>
    );
  }

  const themes = load.themes;
  const ops = themes.filter((t) => t.type === "OP");
  const eds = themes.filter((t) => t.type === "ED");
  const other = themes.filter((t) => t.type !== "OP" && t.type !== "ED");

  const play = (t: AnimeTheme) => {
    setPlayer({ status: "playing", theme: t, audioOnly: false });
  };

  const renderList = (title: string, items: AnimeTheme[]) =>
    items.length === 0 ? null : (
      <section>
        <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-dim">{title}</h3>
        <ul className="space-y-2">
          {items.map((t) => {
            const active = playingTheme?.id === t.id;
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
      {playingTheme && src && (
        <div className="overflow-hidden rounded-lg border border-line bg-black">
          <video
            key={src}
            ref={mediaRef}
            src={src}
            controls
            autoPlay
            playsInline
            onError={() => {
              setPlayer((prev) =>
                prev.status !== "idle"
                  ? { status: "error", theme: prev.theme, audioOnly: prev.audioOnly }
                  : prev,
              );
            }}
            className={isAudio ? "h-14 w-full" : "aspect-video w-full"}
          />
          <div className="flex items-center justify-between gap-3 bg-panel px-3 py-2 text-xs">
            <span className="min-w-0 truncate text-soft">
              {playingTheme.slug} — {playingTheme.title}
            </span>
            {video?.audio && (
              <button
                onClick={() => {
                  setPlayer((prev) =>
                    prev.status !== "idle"
                      ? { ...prev, audioOnly: !prev.audioOnly }
                      : prev,
                  );
                }}
                className="flex shrink-0 items-center gap-1.5 rounded border border-line px-2 py-1 text-muted hover:text-white"
              >
                {isAudio ? <Video size={12} /> : <Headphones size={12} />}
                {isAudio ? "Show video" : "Audio only"}
              </button>
            )}
          </div>
          {player.status === "error" && (
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
