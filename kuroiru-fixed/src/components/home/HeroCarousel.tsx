"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Info, Plus, Check } from "lucide-react";
import type { AnimeSummary } from "@/lib/types";
import { formatLabel, titleCase } from "@/lib/format";
import { useStore } from "@/lib/store";
import { pickImage } from "@/lib/aniZip";
import { useAniZip } from "@/lib/useAniZip";
import { AnimeLink } from "../anime/useOpenAnime";

const USE_FANART = true; // prefer TVDB fanart over the AniList banner
const USE_LOGO = true; // show TVDB clearlogo instead of the title text
const BLEND_LOGO = true; // hides the black JPG background; set false if logos look washed out

function HeroSlide({
  a,
  idx,
  active,
  near,
  tracked,
  onPlan,
}: {
  a: AnimeSummary;
  idx: number;
  active: boolean;
  near: boolean;
  tracked: boolean;
  onPlan: () => void;
}) {
  // fetch ani.zip once the slide is active or adjacent, and keep it afterwards
  const [wanted, setWanted] = useState(near);
  if (near && !wanted) setWanted(true);

  const { data } = useAniZip(wanted ? a.id : null);
  const [badFanart, setBadFanart] = useState<string | null>(null);
  const [badLogo, setBadLogo] = useState<string | null>(null);

  const fanartRaw = USE_FANART ? pickImage(data, "Fanart") : undefined;
  const logoRaw = USE_LOGO ? pickImage(data, "Clearlogo") : undefined;
  const fanart = fanartRaw && fanartRaw !== badFanart ? fanartRaw : undefined;
  const logo = logoRaw && logoRaw !== badLogo ? logoRaw : undefined;

  const bg = fanart ?? a.banner ?? a.cover;
  const blur = !fanart && !a.banner;

  return (
    <div
      aria-hidden={!active}
      inert={!active}
      className={`absolute inset-0 transition-opacity duration-700 ${
        active ? "opacity-100" : "pointer-events-none opacity-0"
      }`}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        key={bg}
        src={bg}
        alt=""
        loading={idx === 0 ? "eager" : "lazy"}
        onError={() => fanart && setBadFanart(fanart)}
        className={`anim-fade h-full w-full object-cover ${blur ? "scale-110 blur-2xl" : ""}`}
      />
      <div className="absolute inset-0 bg-gradient-to-r from-bg via-bg/70 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-t from-bg via-transparent to-transparent" />
      <div className="absolute inset-0 flex items-end p-5 sm:p-10">
        <div className="flex w-full items-end gap-6">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={a.cover}
            alt=""
            className="hidden h-60 w-40 shrink-0 rounded-lg border border-line object-cover shadow-2xl md:block lg:h-72 lg:w-48"
          />
          <div className="max-w-2xl">
            <div className="mb-2 flex flex-wrap items-center gap-2 text-xs text-soft">
              <span className="rounded bg-accent px-2 py-0.5 font-bold text-black">#{idx + 1} Trending</span>
              {a.score ? <span className="text-planned">★ {(a.score / 10).toFixed(1)}</span> : null}
              <span>{formatLabel(a.format)}</span>
              {a.year && <span>{[titleCase(a.season), a.year].filter(Boolean).join(" ")}</span>}
            </div>

            {logo ? (
              <>
                <h2 className="sr-only">{a.title}</h2>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={logo}
                  alt=""
                  onError={() => setBadLogo(logo)}
                  className={`anim-fade max-h-20 w-auto max-w-full object-contain object-left drop-shadow-[0_2px_12px_rgba(0,0,0,.6)] sm:max-h-28 ${
                    BLEND_LOGO ? "mix-blend-screen" : ""
                  }`}
                />
              </>
            ) : (
              <h2 className="line-clamp-2 text-2xl font-bold leading-tight sm:text-4xl">{a.title}</h2>
            )}

            <div className="mt-2 flex flex-wrap gap-1.5">
              {a.genres.slice(0, 4).map((g) => (
                <Link
                  key={g}
                  href={`/search?genre=${encodeURIComponent(g)}`}
                  className="rounded-full border border-accent/40 bg-accent/10 px-2.5 py-0.5 text-xs font-medium text-accent backdrop-blur-sm transition hover:bg-accent hover:text-black"
                >
                  {g}
                </Link>
              ))}
            </div>
            {a.description && (
              <p className="mt-3 line-clamp-2 text-sm text-soft sm:line-clamp-3">{a.description}</p>
            )}
            <div className="mt-4 flex gap-2">
              <AnimeLink
                id={a.id}
                className="flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-medium text-black transition hover:-translate-y-0.5 hover:bg-accent active:scale-95"
              >
                <Info size={15} /> Details
              </AnimeLink>
              <button
                onClick={onPlan}
                className="flex items-center gap-2 rounded-lg border border-white/30 bg-black/40 px-4 py-2 text-sm text-white backdrop-blur transition hover:-translate-y-0.5 hover:border-accent active:scale-95"
              >
                {tracked ? <Check size={15} /> : <Plus size={15} />}
                {tracked ? "In your list" : "Plan to watch"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export type CarouselState =
  | { phase: "empty" }
  | { phase: "playing"; index: number }
  | { phase: "paused"; index: number };

export function useCarousel(items: AnimeSummary[]) {
  const [state, setState] = useState<CarouselState>(() =>
    items.length === 0 ? { phase: "empty" } : { phase: "playing", index: 0 },
  );

  useEffect(() => {
    if (items.length === 0) {
      setState({ phase: "empty" });
    } else {
      setState((prev) => {
        if (prev.phase === "empty") {
          return { phase: "playing", index: 0 };
        }
        return { ...prev, index: Math.min(prev.index, items.length - 1) };
      });
    }
  }, [items.length]);

  useEffect(() => {
    if (state.phase !== "playing" || items.length < 2) return;
    const t = setInterval(() => {
      setState((prev) =>
        prev.phase === "playing"
          ? { phase: "playing", index: (prev.index + 1) % items.length }
          : prev,
      );
    }, 7000);
    return () => clearInterval(t);
  }, [state.phase, items.length]);

  const go = useCallback(
    (d: number) => {
      setState((prev) => {
        if (prev.phase === "empty" || items.length === 0) return prev;
        const nextIndex = (prev.index + d + items.length) % items.length;
        return { ...prev, index: nextIndex };
      });
    },
    [items.length],
  );

  const setIndex = useCallback(
    (idx: number) => {
      setState((prev) => {
        if (prev.phase === "empty") return prev;
        return { ...prev, index: Math.max(0, Math.min(idx, items.length - 1)) };
      });
    },
    [items.length],
  );

  const pause = useCallback(() => {
    setState((prev) => (prev.phase === "playing" ? { phase: "paused", index: prev.index } : prev));
  }, []);

  const resume = useCallback(() => {
    setState((prev) => (prev.phase === "paused" ? { phase: "playing", index: prev.index } : prev));
  }, []);

  return { state, go, setIndex, pause, resume };
}

export default function HeroCarousel({ items }: { items: AnimeSummary[] }) {
  const { state, go, setIndex, pause, resume } = useCarousel(items);
  const entries = useStore((s) => s.entries);
  const hydrated = useStore((s) => s.hydrated);
  const track = useStore((s) => s.track);

  if (state.phase === "empty") return null;
  const i = state.index;

  return (
    <section
      aria-roledescription="carousel"
      aria-label="Featured anime"
      className="relative overflow-hidden rounded-xl border border-line bg-panel"
      onMouseEnter={pause}
      onMouseLeave={resume}
    >
      <div className="relative h-[320px] sm:h-[400px] lg:h-[460px]">
        {items.map((a, idx) => {
          const dist = Math.abs(idx - i);
          const near = dist <= 1 || dist === items.length - 1;
          const tracked = !!(hydrated && entries[a.id]);
          return (
            <HeroSlide
              key={a.id}
              a={a}
              idx={idx}
              active={idx === i}
              near={near}
              tracked={tracked}
              onPlan={() => !tracked && track(a, { status: "PLANNING" })}
            />
          );
        })}
      </div>

      {items.length > 1 && (
        <>
          <button
            aria-label="Previous slide"
            onClick={() => go(-1)}
            className="absolute left-2 top-1/2 hidden h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-black/50 text-white backdrop-blur transition hover:scale-110 hover:bg-black/80 active:scale-90 sm:grid"
          >
            <ChevronLeft />
          </button>
          <button
            aria-label="Next slide"
            onClick={() => go(1)}
            className="absolute right-2 top-1/2 hidden h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-black/50 text-white backdrop-blur transition hover:scale-110 hover:bg-black/80 active:scale-90 sm:grid"
          >
            <ChevronRight />
          </button>
          <div className="absolute bottom-3 right-4 flex gap-1.5">
            {items.map((a, idx) => (
              <button
                key={a.id}
                aria-label={`Go to slide ${idx + 1}`}
                onClick={() => setIndex(idx)}
                className={`h-1.5 rounded-full transition-all ${
                  idx === i ? "w-6 bg-accent" : "w-1.5 bg-white/40 hover:bg-white/70"
                }`}
              />
            ))}
          </div>
        </>
      )}
    </section>
  );
}
