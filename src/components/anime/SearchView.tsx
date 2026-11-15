"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Loader2, Search, SlidersHorizontal, X } from "lucide-react";
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
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);
  const listRef = React.useRef<HTMLUListElement>(null);

  React.useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") { setOpen(false); return; }
    if (e.key === "Enter" || e.key === " ") { setOpen((v) => !v); return; }
    if (!open && (e.key === "ArrowDown" || e.key === "ArrowUp")) { setOpen(true); return; }
    if (open && listRef.current) {
      const items = Array.from(listRef.current.querySelectorAll<HTMLLIElement>("li[role=option]"));
      const idx = items.findIndex((el) => el.getAttribute("data-value") === value);
      let next = idx;
      if (e.key === "ArrowDown") next = Math.min(idx + 1, items.length - 1);
      if (e.key === "ArrowUp") next = Math.max(idx - 1, 0);
      if (next !== idx) {
        e.preventDefault();
        const v = items[next]?.getAttribute("data-value") ?? "";
        onChange(v);
        items[next]?.scrollIntoView({ block: "nearest" });
      }
    }
  };

  const displayLabel = value ? (options.find((o) => o.value === value)?.label ?? value) : "Any";
  const isActive = !!value;

  return (
    <div ref={ref} className="relative block min-w-0">
      <span className="mb-1 block text-[11px] uppercase tracking-wide text-dim">{label}</span>

      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        onKeyDown={handleKeyDown}
        onClick={() => setOpen((v) => !v)}
        className={`flex h-10 w-full items-center justify-between gap-2 rounded-lg border px-3 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-accent/40 ${
          isActive
            ? "border-accent/60 bg-accent/10 text-white"
            : "border-line bg-panel text-muted hover:border-accent/40 hover:text-soft"
        }`}
      >
        <span className="truncate">{displayLabel}</span>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="12" height="12" viewBox="0 0 24 24"
          fill="none" stroke="currentColor" strokeWidth="2.5"
          strokeLinecap="round" strokeLinejoin="round"
          className={`flex-shrink-0 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {open && (
        <ul
          ref={listRef}
          role="listbox"
          aria-label={label}
          className="absolute z-50 mt-1.5 max-h-60 w-full overflow-y-auto rounded-xl border border-line bg-[#141418] py-1 shadow-xl shadow-black/40"
          style={{ scrollbarWidth: "thin" }}
        >
          <li
            role="option"
            data-value=""
            aria-selected={value === ""}
            onClick={() => { onChange(""); setOpen(false); }}
            className={`flex cursor-pointer items-center gap-2 px-3 py-2 text-sm transition-colors ${
              value === "" ? "bg-accent/15 text-accent" : "text-muted hover:bg-white/5 hover:text-white"
            }`}
          >
            {value === "" ? (
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            ) : (
              <span className="w-3" />
            )}
            Any
          </li>

          {options.map((o) => (
            <li
              key={o.value}
              role="option"
              data-value={o.value}
              aria-selected={value === o.value}
              onClick={() => { onChange(o.value); setOpen(false); }}
              className={`flex cursor-pointer items-center gap-2 px-3 py-2 text-sm transition-colors ${
                value === o.value
                  ? "bg-accent/15 text-accent"
                  : "text-soft hover:bg-white/5 hover:text-white"
              }`}
            >
              {value === o.value ? (
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              ) : (
                <span className="w-3" />
              )}
              {o.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function SearchView() {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();

  const q = sp.get("q") ?? "";
  const key = [q, ...FILTER_KEYS.map((k) => sp.get(k) ?? "")].join("|");

  const [text, setText] = useState(q);
  const textRef = useRef(text);
  useEffect(() => {
    textRef.current = text;
  }, [text]);

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const [showFilters, setShowFilters] = useState(false);
  const [results, setResults] = useState<AnimeSummary[]>([]);
  const [page, setPage] = useState(1);
  const [hasNext, setHasNext] = useState(false);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(false);
  const [retryKey, setRetryKey] = useState(0);
  const generation = useRef(0);
  const spRef = useRef(sp);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const loadingMoreRef = useRef(false);
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

  // Debounce typing -> URL only when trimmed text actually differs from URL `q`
  useEffect(() => {
    const trimmed = text.trim();
    if (trimmed === q) return;
    const t = setTimeout(() => update({ q: trimmed }), 350);
    return () => clearTimeout(t);
  }, [text, q, update]);

  // Sync text from URL only when `q` changed externally (differs from current trimmed input)
  useEffect(() => {
    if (!mounted) return;
    if (q !== textRef.current.trim()) {
      setText(q);
    }
  }, [mounted, q]);

  const buildUrl = useCallback((p: number) => {
    const u = new URLSearchParams();
    const s = spRef.current;
    if (s.get("q")) u.set("q", s.get("q")!);
    for (const k of FILTER_KEYS) if (s.get(k)) u.set(k, s.get(k)!);
    u.set("page", String(p));
    u.set("perPage", "24");
    return `/api/search?${u.toString()}`;
  }, []);

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

  const loadMore = useCallback(async () => {
    if (!hasNext || loadingMoreRef.current) return;

    loadingMoreRef.current = true;
    const gen = generation.current;
    setLoadingMore(true);
    setError(false);

    try {
      const r = await fetch(buildUrl(page + 1));
      const d = await r.json();
      if (!r.ok) throw new Error();
      if (gen !== generation.current) return;

      setResults((prev) => {
        const seen = new Set(prev.map((a) => a.id));
        return [...prev, ...d.results.filter((a: AnimeSummary) => !seen.has(a.id))];
      });
      setHasNext(d.hasNextPage);
      setPage((p) => p + 1);
    } catch {
      if (gen === generation.current) setError(true);
    } finally {
      loadingMoreRef.current = false;
      setLoadingMore(false);
    }
  }, [buildUrl, hasNext, page]);

  useEffect(() => {
    const node = sentinelRef.current;
    if (!node || loading || loadingMore || !hasNext || error) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) void loadMore();
      },
      { rootMargin: "450px 0px" }, // fetch shortly before reaching the bottom
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [error, hasNext, loadMore, loading, loadingMore]);

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
          <SlidersHorizontal size={15} className={`transition-transform duration-200 ${showFilters ? "rotate-90" : ""}`} /> Filters{activeCount ? ` (${activeCount})` : ""}
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
          <button onClick={clearAll} className="btn flex items-center gap-1 rounded-full border border-line px-2.5 py-1 text-xs transition hover:border-accent active:scale-95 hover:text-white">
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
            <button onClick={() => setRetryKey((k) => k + 1)} className="btn mt-3 rounded-lg border border-line px-4 py-2 text-sm transition hover:border-accent active:scale-95">
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
              {results.map((a, index) => (
                <div
                  key={a.id}
                  className="browse-card-enter"
                  style={{ animationDelay: `${(index % 8) * 45}ms` }}
                >
                  <AnimeCard anime={a} />
                </div>
              ))}
              {loadingMore &&
                Array.from({ length: 6 }, (_, i) => (
                  <CardSkeleton key={`loading-${i}`} />
                ))}
            </CardGrid>
            <div
              ref={sentinelRef}
              className="mt-8 flex min-h-16 items-center justify-center"
              aria-live="polite"
            >
              {loadingMore ? (
                <span role="status" className="sr-only">
                  Loading more anime…
                </span>
              ) : hasNext ? (
                <button
                  onClick={loadMore}
                  disabled={loadingMore}
                  className="btn btn-lift inline-flex items-center gap-2 rounded-lg border border-line bg-panel px-6 py-2.5 text-sm text-soft transition hover:border-accent active:scale-95 disabled:opacity-60"
                >
                  {loadingMore && <Loader2 size={14} className="animate-spin" />}
                  {loadingMore ? "Loading…" : error ? "Retry loading" : "Load more"}
                </button>
              ) : (
                <span className="text-sm text-muted">You’ve reached the end.</span>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
