"use client";

import type { AnimeDetail } from "@/lib/types";
import { titleCase } from "@/lib/format";

function Avatar({ src, alt }: { src: string | null; alt: string }) {
  return src ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} loading="lazy" className="h-16 w-12 shrink-0 rounded object-cover" />
  ) : (
    <div className="h-16 w-12 shrink-0 rounded bg-panel2" />
  );
}

export default function TabStaff({ anime }: { anime: AnimeDetail }) {
  return (
    <div className="space-y-8">
      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-dim">Characters &amp; voice actors</h2>
        {anime.characters.length === 0 ? (
          <p className="text-sm text-muted">No character data available.</p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {anime.characters.map((c) => (
              <div key={c.id} className="flex items-stretch justify-between overflow-hidden rounded-lg border border-line bg-panel">
                <div className="flex min-w-0 flex-1 gap-3 p-2">
                  <Avatar src={c.image} alt={c.name} />
                  <div className="min-w-0 self-center">
                    <div className="truncate text-sm text-white">{c.name}</div>
                    <div className="text-xs text-dim">{titleCase(c.role)}</div>
                  </div>
                </div>
                {c.voiceActor && (
                  <div className="flex min-w-0 flex-1 flex-row-reverse gap-3 p-2 text-right">
                    <Avatar src={c.voiceActor.image} alt={c.voiceActor.name} />
                    <div className="min-w-0 self-center">
                      <div className="truncate text-sm text-soft">{c.voiceActor.name}</div>
                      <div className="text-xs text-dim">Japanese</div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-dim">Production staff</h2>
        {anime.staff.length === 0 ? (
          <p className="text-sm text-muted">No staff data available.</p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {anime.staff.map((s) => (
              <div key={`${s.id}-${s.role}`} className="flex gap-3 rounded-lg border border-line bg-panel p-2">
                <Avatar src={s.image} alt={s.name} />
                <div className="min-w-0 self-center">
                  <div className="truncate text-sm text-white">{s.name}</div>
                  <div className="line-clamp-2 text-xs text-dim">{s.role}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
