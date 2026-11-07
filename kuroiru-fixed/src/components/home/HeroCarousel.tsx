"use client";

import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Info, Plus, Check } from "lucide-react";
import type { AnimeSummary } from "@/lib/types";
import { formatLabel, titleCase } from "@/lib/format";
import { useStore } from "@/lib/store";
import { AnimeLink } from "../anime/useOpenAnime";

export default function HeroCarousel({ items }: { items: AnimeSummary[] }) {
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);
  const entries = useStore((s) => s.entries);
  const hydrated = useStore((s) => s.hydrated);
  const track = useStore((s) => s.track);

  useEffect(() => {
    if (paused || items.length < 2) return;
    const t = setInterval(() => setI((x) => (x + 1) % items.length), 7000);
    return () => clearInterval(t);
  }, [paused, items.length]);

  if (items.length === 0) return null;
  const go = (d: number) => setI((x) => (x + d + items.length) % items.length);

  return (
    <section
      aria-roledescription="carousel"
      aria-label="Featured anime"
      className="relative overflow-hidden rounded-xl border border-line bg-panel"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="relative h-[320px] sm:h-[400px] lg:h-[460px]">
        {items.map((a, idx) => {
          const tracked = hydrated && entries[a.id];
          return (
            <div
              key={a.id}
              aria-hidden={idx !== i}
              inert={idx !== i}
              className={`absolute inset-0 transition-opacity duration-700 ${idx === i ? "opacity-100" : "pointer-events-none opacity-0"}`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={a.banner ?? a.cover}
                alt=""
                loading={idx === 0 ? "eager" : "lazy"}
                className={`h-full w-full object-cover ${a.banner ? "" : "scale-110 blur-2xl"}`}
              />
              <div className="absolute inset-0 bg-gradient-to-r from-bg via-bg/70 to-transparent" />
              <div className="absolute inset-0 bg-gradient-to-t from-bg via-transparent to-transparent" />
              <div className="absolute inset-0 flex items-end p-5 sm:p-10">
                <div className="flex w-full items-end gap-6">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={a.cover}
                    alt=""
                    className="hidden h-56 w-40 shrink-0 rounded-lg border border-line object-cover shadow-2xl md:block lg:h-72 lg:w-48"
                  />
                  <div className="max-w-2xl">
                    <div className="mb-2 flex flex-wrap items-center gap-2 text-xs text-soft">
                      <span className="rounded bg-accent px-2 py-0.5 font-bold text-black">#{idx + 1} Trending</span>
                      {a.score ? <span className="text-planned">★ {(a.score / 10).toFixed(1)}</span> : null}
                      <span>{formatLabel(a.format)}</span>
                      {a.year && <span>{[titleCase(a.season), a.year].filter(Boolean).join(" ")}</span>}
                    </div>
                    <h2 className="line-clamp-2 text-2xl font-bold leading-tight sm:text-4xl">{a.title}</h2>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {a.genres.slice(0, 4).map((g) => (
                        <span key={g} className="text-xs text-accent">
                          {g}
                        </span>
                      ))}
                    </div>
                    {a.description && (
                      <p className="mt-3 line-clamp-2 text-sm text-soft sm:line-clamp-3">{a.description}</p>
                    )}
                    <div className="mt-4 flex gap-2">
                      <AnimeLink
                        id={a.id}
                        className="flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-medium text-black transition hover:bg-accent"
                      >
                        <Info size={15} /> Details
                      </AnimeLink>
                      <button
                        onClick={() => !tracked && track(a, { status: "PLANNING" })}
                        className="flex items-center gap-2 rounded-lg border border-white/30 bg-black/40 px-4 py-2 text-sm text-white backdrop-blur transition hover:border-accent"
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
        })}
      </div>

      {items.length > 1 && (
        <>
          <button
            aria-label="Previous slide"
            onClick={() => go(-1)}
            className="absolute left-2 top-1/2 hidden h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-black/50 text-white backdrop-blur transition hover:bg-black/80 sm:grid"
          >
            <ChevronLeft />
          </button>
          <button
            aria-label="Next slide"
            onClick={() => go(1)}
            className="absolute right-2 top-1/2 hidden h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-black/50 text-white backdrop-blur transition hover:bg-black/80 sm:grid"
          >
            <ChevronRight />
          </button>
          <div className="absolute bottom-3 right-4 flex gap-1.5">
            {items.map((a, idx) => (
              <button
                key={a.id}
                aria-label={`Go to slide ${idx + 1}`}
                onClick={() => setI(idx)}
                className={`h-1.5 rounded-full transition-all ${idx === i ? "w-6 bg-accent" : "w-1.5 bg-white/40"}`}
              />
            ))}
          </div>
        </>
      )}
    </section>
  );
}
