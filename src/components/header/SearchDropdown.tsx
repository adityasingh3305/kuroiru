"use client";

import { Search } from "lucide-react";
import type { AnimeSummary } from "@/lib/types";
import { formatLabel } from "@/lib/format";

export type SearchPhase = "idle" | "debouncing" | "fetching" | "done" | "error";

export default function SearchDropdown({
  query,
  results,
  phase,
  active,
  onPick,
  onAll,
  onHover,
}: {
  query: string;
  results: AnimeSummary[];
  phase: SearchPhase;
  active: number;
  onPick: (a: AnimeSummary) => void;
  onAll: () => void;
  onHover: (i: number) => void;
}) {
  return (
    <div
      id="search-results-listbox"
      role="listbox"
      className="anim-fade absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-lg border border-line bg-panel shadow-2xl"
    >
      {(phase === "fetching" || phase === "debouncing") && results.length === 0 && (
        <div className="space-y-2 p-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="skeleton h-12 rounded" />
          ))}
        </div>
      )}
      {phase === "done" && results.length === 0 && (
        <div className="p-4 text-sm text-muted">No results for “{query}”</div>
      )}
      {phase === "error" && (
        <div className="p-4 text-sm text-dropped">Could not load search results.</div>
      )}
      {results.map((a, i) => (
        <button
          key={a.id}
          id={`search-opt-${a.id}`}
          role="option"
          aria-selected={i === active}
          onMouseEnter={() => onHover(i)}
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => onPick(a)}
          className={`flex w-full items-center gap-3 px-3 py-2 text-left ${
            i === active ? "bg-white/10" : ""
          }`}
        >
          {a.cover ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={a.cover} alt="" className="h-12 w-8 shrink-0 rounded object-cover" />
          ) : (
            <div className="h-12 w-8 shrink-0 rounded bg-panel2" />
          )}
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm text-white">{a.title}</span>
            <span className="block truncate text-xs text-dim">
              {[formatLabel(a.format), a.year, a.episodes ? `${a.episodes} ep` : null]
                .filter(Boolean)
                .join(" · ")}
            </span>
          </span>
          {a.score ? <span className="text-xs text-planned">★ {(a.score / 10).toFixed(1)}</span> : null}
        </button>
      ))}
      {query.trim() && (
        <button
          id="search-opt-all"
          role="option"
          aria-selected={active === results.length}
          onMouseDown={(e) => e.preventDefault()}
          onClick={onAll}
          className={`flex w-full items-center gap-2 border-t border-line px-3 py-2.5 text-left text-sm text-accent ${
            active === results.length ? "bg-white/10" : ""
          }`}
          onMouseEnter={() => onHover(results.length)}
        >
          <Search size={14} /> See all results for “{query}”
        </button>
      )}
    </div>
  );
}
