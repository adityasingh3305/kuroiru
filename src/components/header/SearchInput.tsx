"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, X } from "lucide-react";
import type { AnimeSummary } from "@/lib/types";
import SearchDropdown, { type SearchPhase } from "./SearchDropdown";
import { useAnimeModal } from "../anime/useOpenAnime";

export function useSearch(q: string) {
  const [phase, setPhase] = useState<SearchPhase>("idle");
  const [results, setResults] = useState<AnimeSummary[]>([]);
  const [active, setActive] = useState(-1);

  useEffect(() => {
    const term = q.trim();
    if (term.length < 2) {
      setResults([]);
      setPhase("idle");
      setActive(-1);
      return;
    }

    setResults([]);
    setPhase("debouncing");
    setActive(-1);

    const ctrl = new AbortController();
    const t = setTimeout(async () => {
      setPhase("fetching");
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(term)}&perPage=7`, {
          signal: ctrl.signal,
        });
        const data = await res.json();
        if (ctrl.signal.aborted) return;
        setResults(data.results ?? []);
        setPhase("done");
        setActive(-1);
      } catch {
        if (!ctrl.signal.aborted) {
          setResults([]);
          setPhase("error");
        }
      }
    }, 250);

    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
  }, [q]);

  return { phase, results, active, setActive };
}

export default function SearchInput() {
  const router = useRouter();
  const { open } = useAnimeModal();
  const inputRef = useRef<HTMLInputElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const [q, setQ] = useState("");
  const [focused, setFocused] = useState(false);
  const { phase, results, active, setActive } = useSearch(q);

  // 'F' or '/' focuses search
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      const typing =
        t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.tagName === "SELECT" || t.isContentEditable);
      if (typing || e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === "f" || e.key === "F" || e.key === "/") {
        e.preventDefault();
        inputRef.current?.focus();
        inputRef.current?.select();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setFocused(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  const goAll = useCallback(() => {
    const term = q.trim();
    if (!term) return;
    setFocused(false);
    inputRef.current?.blur();
    router.push(`/search?q=${encodeURIComponent(term)}`);
  }, [q, router]);

  const pick = useCallback(
    (a: AnimeSummary) => {
      setFocused(false);
      inputRef.current?.blur();
      open(a.id);
    },
    [open],
  );

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => Math.min(results.length, a + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => Math.max(-1, a - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (active >= 0 && active < results.length) pick(results[active]);
      else goAll();
    } else if (e.key === "Escape") {
      setFocused(false);
      inputRef.current?.blur();
    }
  };

  const showDropdown = focused && phase !== "idle";
  const activeId =
    showDropdown && active >= 0
      ? active < results.length
        ? `search-opt-${results[active].id}`
        : "search-opt-all"
      : undefined;

  return (
    <div
      ref={wrapRef}
      className="relative w-full"
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node)) {
          setFocused(false);
        }
      }}
    >
      <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-dim" />
      <input
        ref={inputRef}
        role="combobox"
        aria-expanded={showDropdown}
        aria-haspopup="listbox"
        aria-autocomplete="list"
        aria-controls="search-results-listbox"
        aria-activedescendant={activeId}
        value={q}
        onChange={(e) => setQ(e.target.value)}
        onFocus={() => setFocused(true)}
        onKeyDown={onKeyDown}
        placeholder="Search anime…"
        aria-label="Search anime"
        autoComplete="off"
        className="h-10 w-full rounded-lg border border-line bg-panel pl-9 pr-9 text-sm text-white placeholder:text-dim focus:border-accent focus:outline-none"
      />
      {q ? (
        <button
          aria-label="Clear search"
          onClick={() => {
            setQ("");
            inputRef.current?.focus();
          }}
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-dim hover:text-white"
        >
          <X size={14} />
        </button>
      ) : (
        <kbd className="pointer-events-none absolute right-2.5 top-1/2 hidden -translate-y-1/2 rounded border border-line px-1.5 text-[10px] text-dim md:block">
          F
        </kbd>
      )}
      {showDropdown && (
        <SearchDropdown
          query={q}
          results={results}
          phase={phase}
          active={active}
          onPick={pick}
          onAll={goAll}
          onHover={setActive}
        />
      )}
    </div>
  );
}
