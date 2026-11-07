"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { AIR_STATUSES, FORMATS, GENRES, SEASONS, SORTS, type AnimeSummary } from "@/lib/types";
import { titleCase, formatLabel } from "@/lib/format";
import AnimeCard, { CardGrid, CardSkeleton } from "./AnimeCard";

const FILTER_KEYS = ["genre", "year", "season", "format", "status", "sort"] as const;

function Select({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <label className="block min-w-0">
      <span className="mb-1 block text-[11px] uppercase tracking-wide text-dim">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`h-10 w-full rounded-lg border bg-panel px-2 text-sm focus:border-accent focus:outline-none ${
          value ? "border-accent/60 text-white" : "border-line text-muted"
        }`}
      >
        <option value="">Any</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}

export default function SearchView() {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();

  const q = sp.get("q") ?? "";
  // everything that affects the result set (excludes the modal's `id`)
  const key = [q, ...FILTER_KEYS.map((k) => sp.get(k) ?? "")].join("|");

  const [text, setText] = useState(q);
  const [showFilters, setShowFilters] = useState(false);
  const [results, setResults] = useState<AnimeSummary[]>([]);
  const [page, setPage] = useState(1);
  const [hasNext, setHasNext] = useState(false);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(false);
  const [retryKey, setRetryKey] = useState(0);
  const generation = useRef(0); // bumped on every new search so late "load more" responses are dropped
  const spRef = useRef(sp);
  useEffect(() => {
    spRef.current = sp;
  });

  const update = useCallback(
    (patch: Record<string, string>) => {
      const next = new URLSearchParams(spRef.current.toString());
      for (const [k, v] of Object.entries(patch)) {
        if (v) next.set(k, v);
        else next.delete(k);
      }
      const qs = next.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [router, pathname],
  );

  // debounce typing -> URL
  useEffect(() => {
    if (text === q) return;
    const t = setTimeout(() => update({ q: text.trim() }), 350);
    return () => clearTimeout(t);
  }, [text, q, update]);

  // sync text when URL q changes externally (e.g. navbar search)
  useEffect(() => {
    const t = setTimeout(() => setText(q), 0);
    return () => clearTimeout(t);
  }, [q]);

  const buildUrl = useCallback(
    (p: number) => {
      const u = new URLSearchParams();
      const s = spRef.current;
      if (s.get("q")) u.set("q", s.get("q")!);
      for (const k of FILTER_KEYS) if (s.get(k)) u.set(k, s.get(k)!);
      u.set("page", String(p));
      u.set("perPage", "24");
      return `/api/search?${u.toString()}`;
    },
    [],
  );

  useEffect(() => {
    const ctrl = new AbortController();
    generation.current += 1;
    const t = setTimeout(() => {
      setLoading(true);
      setError(false);
      fetch(buildUrl(1), { signal: ctrl.signal })
        .then(async (r) => {
          const d = await r.json();
          if (!r.ok) throw new Error();
          return d;
        })
        .then((d) => {
          setResults(d.results);
          setHasNext(d.hasNextPage);
          setTotal(d.total);
          setPage(1);
        })
        .catch(() => {
          if (!ctrl.signal.aborted) {
            setError(true);
            setResults([]);
          }
        })
        .finally(() => {
          if (!ctrl.signal.aborted) setLoading(false);
        });
    }, 0);
    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
  }, [key, buildUrl, retryKey]);

  const loadMore = async () => {
    const gen = generation.current;
    setLoadingMore(true);
    try {
      const r = await fetch(buildUrl(page + 1));
      const d = await r.json();
      if (!r.ok) throw new Error();
      if (gen !== generation.current) return; // filters changed while loading
      setResults((prev) => {
        const seen = new Set(prev.map((a) => a.id));
        return [...prev, ...d.results.filter((a: AnimeSummary) => !seen.has(a.id))];
      });
      setHasNext(d.hasNextPage);
      setPage((p) => p + 1);
    } catch {
      if (gen === generation.current) setError(true);
    } finally {
      setLoadingMore(false);
    }
  };

  const years = useMemo(() => {
    const y = new Date().getFullYear() + 1;
    return Array.from({ length: y - 1969 }, (_, i) => String(y - i));
  }, []);

  const activeCount = FILTER_KEYS.filter((k) => sp.get(k) && k !== "sort").length;
  const clearAll = () => {
    const patch: Record<string, string> = { q: "" };
    for (const k of FILTER_KEYS) patch[k] = "";
    setText("");
    update(patch);
  };

  return (
    <div>
      <h1 className="mb-4 text-2xl font-bold">Browse anime</h1>

      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-dim" />
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Filter by title…"
            aria-label="Search titles"
            className="h-11 w-full rounded-lg border border-line bg-panel pl-9 pr-3 text-sm placeholder:text-dim focus:border-accent focus:outline-none"
          />
        </div>
        <button
          onClick={() => setShowFilters((v) => !v)}
          aria-expanded={showFilters}
          className={`flex h-11 items-center gap-2 rounded-lg border px-4 text-sm transition lg:hidden ${
            activeCount ? "border-accent text-accent" : "border-line text-soft"
          }`}
        >
          <SlidersHorizontal size={15} /> Filters{activeCount ? ` (${activeCount})` : ""}
        </button>
      </div>

      <div className={`mt-3 grid-cols-2 gap-3 sm:grid-cols-3 lg:grid lg:grid-cols-6 ${showFilters ? "grid" : "hidden"}`}>
        <Select label="Genre" value={sp.get("genre") ?? ""} onChange={(v) => update({ genre: v })} options={GENRES.map((g) => ({ value: g, label: g }))} />
        <Select label="Year" value={sp.get("year") ?? ""} onChange={(v) => update({ year: v })} options={years.map((y) => ({ value: y, label: y }))} />
        <Select label="Season" value={sp.get("season") ?? ""} onChange={(v) => update({ season: v })} options={SEASONS.map((s) => ({ value: s, label: titleCase(s) }))} />
        <Select label="Format" value={sp.get("format") ?? ""} onChange={(v) => update({ format: v })} options={FORMATS.map((f) => ({ value: f, label: formatLabel(f) }))} />
        <Select label="Status" value={sp.get("status") ?? ""} onChange={(v) => update({ status: v })} options={AIR_STATUSES.map((s) => ({ value: s, label: titleCase(s) }))} />
        <Select label="Sort" value={sp.get("sort") ?? ""} onChange={(v) => update({ sort: v })} options={SORTS} />
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2 text-sm text-muted">
        {!loading && !error && <span>{total >= 5000 ? "5000+" : total.toLocaleString()} results</span>}
        {(q || activeCount > 0 || sp.get("sort")) && (
          <button onClick={clearAll} className="flex items-center gap-1 rounded-full border border-line px-2.5 py-1 text-xs hover:text-white">
            <X size={12} /> Clear all
          </button>
        )}
      </div>

      <div className="mt-4">
        {loading ? (
          <CardGrid>
            {Array.from({ length: 12 }, (_, i) => (
              <CardSkeleton key={i} />
            ))}
          </CardGrid>
        ) : error && results.length === 0 ? (
          <div className="rounded-lg border border-line bg-panel p-10 text-center">
            <p className="text-soft">Couldn&apos;t load results.</p>
            <button onClick={() => setRetryKey((k) => k + 1)} className="mt-3 rounded-lg border border-line px-4 py-2 text-sm hover:border-accent">
              Retry
            </button>
          </div>
        ) : results.length === 0 ? (
          <div className="rounded-lg border border-line bg-panel p-10 text-center text-muted">
            No anime match these filters.
          </div>
        ) : (
          <>
            <CardGrid>
              {results.map((a) => (
                <AnimeCard key={a.id} anime={a} />
              ))}
            </CardGrid>
            {hasNext && (
              <div className="mt-8 text-center">
                <button
                  onClick={loadMore}
                  disabled={loadingMore}
                  className="rounded-lg border border-line bg-panel px-6 py-2.5 text-sm text-soft transition hover:border-accent disabled:opacity-50"
                >
                  {loadingMore ? "Loading…" : "Load more"}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
