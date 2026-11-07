"use client";

import { useRef } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { AnimeSummary } from "@/lib/types";
import AnimeCard from "../anime/AnimeCard";

export default function TrendingSection({
  title,
  items,
  href,
}: {
  title: string;
  items: AnimeSummary[];
  href?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  if (items.length === 0) return null;
  const scroll = (d: number) =>
    ref.current?.scrollBy({ left: d * ref.current.clientWidth * 0.85, behavior: "smooth" });

  return (
    <section className="mt-8">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-lg font-bold sm:text-xl">{title}</h2>
        <div className="flex items-center gap-2">
          {href && (
            <Link href={href} className="text-sm text-accent hover:underline">
              View all
            </Link>
          )}
          <button aria-label="Scroll left" onClick={() => scroll(-1)} className="hidden h-8 w-8 place-items-center rounded-full border border-line text-muted transition hover:border-accent hover:text-white sm:grid">
            <ChevronLeft size={16} />
          </button>
          <button aria-label="Scroll right" onClick={() => scroll(1)} className="hidden h-8 w-8 place-items-center rounded-full border border-line text-muted transition hover:border-accent hover:text-white sm:grid">
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
      <div
        ref={ref}
        className="no-scrollbar -mx-3 flex snap-x snap-mandatory gap-3 overflow-x-auto px-3 pb-2 sm:-mx-6 sm:gap-4 sm:px-6"
      >
        {items.map((a, idx) => (
          <AnimeCard
            key={a.id}
            anime={a}
            priority={idx < 6}
            className="w-[132px] shrink-0 snap-start sm:w-[160px] lg:w-[176px]"
          />
        ))}
      </div>
    </section>
  );
}
