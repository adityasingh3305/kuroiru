"use client";

import type { AnimeDetail } from "@/lib/types";
import { titleCase } from "@/lib/format";
import AnimeCard from "../AnimeCard";

const ORDER = ["PARENT", "PREQUEL", "SEQUEL", "SIDE STORY", "SPIN OFF", "ALTERNATIVE", "SUMMARY", "ADAPTATION", "CHARACTER", "OTHER"];

export default function TabRelations({ anime }: { anime: AnimeDetail }) {
  const groups = new Map<string, typeof anime.relations>();
  for (const r of anime.relations) {
    const arr = groups.get(r.relationType) ?? [];
    arr.push(r);
    groups.set(r.relationType, arr);
  }
  const keys = [...groups.keys()].sort(
    (a, b) => (ORDER.indexOf(a) === -1 ? 99 : ORDER.indexOf(a)) - (ORDER.indexOf(b) === -1 ? 99 : ORDER.indexOf(b)),
  );

  return (
    <div className="space-y-8">
      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-dim">Franchise</h2>
        {keys.length === 0 ? (
          <p className="text-sm text-muted">No related anime found.</p>
        ) : (
          <div className="space-y-5">
            {keys.map((k) => (
              <div key={k}>
                <h3 className="mb-2 text-sm font-medium text-accent">{titleCase(k)}</h3>
                <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5">
                  {groups.get(k)!.map((r) => (
                    <AnimeCard key={r.anime.id} anime={r.anime} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {anime.recommendations.length > 0 && (
        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-dim">You might also like</h2>
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5">
            {anime.recommendations.slice(0, 10).map((r) => (
              <AnimeCard key={r.id} anime={r} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
