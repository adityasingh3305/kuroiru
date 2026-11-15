"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { AnimeSummary, WatchEntry, WatchStatus } from "./types";
import { deriveWatchState } from "./watchStatus";
import {
  AnilistAuthError,
  deleteRemoteEntry,
  saveRemoteEntry,
  type AnilistUser,
} from "./anilist-client";

type Minimal = Pick<AnimeSummary, "id" | "title" | "cover" | "format" | "episodes">;
type PendingOp = { type: "save" | "delete"; animeId: number };

interface State {
  hydrated: boolean;
  entries: Record<number, WatchEntry>;
  pendingOps: Record<number, PendingOp>;
  anilistToken: string | null;
  anilistUser: AnilistUser | null;
  lastSyncError: string | null;

  setHydrated: () => void;
  track: (
    anime: Minimal,
    patch: Partial<Pick<WatchEntry, "status" | "progress" | "score">>,
  ) => void;
  remove: (animeId: number) => void;
  mergeEntries: (entries: WatchEntry[]) => number;
  setAnilist: (token: string | null, user: AnilistUser | null) => void;
  setSyncError: (msg: string | null) => void;
  flushQueue: () => Promise<void>;
}

let flushTimer: ReturnType<typeof setTimeout> | null = null;
let flushing = false;
let syncCallId = 0;

function scheduleFlush(fn: () => Promise<void>, delay = 600) {
  if (flushTimer) clearTimeout(flushTimer);
  flushTimer = setTimeout(() => {
    flushTimer = null;
    void fn();
  }, delay);
}

export const useStore = create<State>()(
  persist(
    (set, get) => ({
      hydrated: false,
      entries: {},
      pendingOps: {},
      anilistToken: null,
      anilistUser: null,
      lastSyncError: null,

      setHydrated: () => set({ hydrated: true }),

      track: (anime, patch) => {
        const s = get();
        const prev = s.entries[anime.id];
        const total = anime.episodes ?? prev?.episodes ?? null;
        const { status, progress } = deriveWatchState(prev, patch, total);
        const score = patch.score ?? prev?.score ?? 0;
        const scoreRaw =
          patch.score !== undefined ? patch.score * 10 : (prev?.scoreRaw ?? score * 10);

        const entry: WatchEntry = {
          animeId: anime.id,
          status,
          progress,
          score,
          scoreRaw,
          title: anime.title,
          cover: anime.cover,
          format: anime.format,
          episodes: total,
          updatedAt: Date.now(),
        };

        const nextOps = s.anilistToken
          ? { ...s.pendingOps, [anime.id]: { type: "save" as const, animeId: anime.id } }
          : s.pendingOps;

        set({ entries: { ...s.entries, [anime.id]: entry }, pendingOps: nextOps });
        if (s.anilistToken) {
          scheduleFlush(() => get().flushQueue());
        }
      },

      remove: (animeId) => {
        const s = get();
        const next = { ...s.entries };
        delete next[animeId];
        const nextOps = s.anilistToken
          ? { ...s.pendingOps, [animeId]: { type: "delete" as const, animeId } }
          : s.pendingOps;
        set({ entries: next, pendingOps: nextOps });
        if (s.anilistToken) {
          scheduleFlush(() => get().flushQueue());
        }
      },

      flushQueue: async () => {
        if (flushing) return;
        flushing = true;
        try {
          while (true) {
            const s = get();
            const token = s.anilistToken;
            const ops = Object.values(s.pendingOps);
            if (!token || ops.length === 0) break;
            if (typeof navigator !== "undefined" && !navigator.onLine) break;

            const op = ops[0];
            const snapshotEntry = s.entries[op.animeId];
            const myId = ++syncCallId;
            try {
              if (op.type === "save" && snapshotEntry) {
                await saveRemoteEntry(token, snapshotEntry);
              } else if (op.type === "delete") {
                await deleteRemoteEntry(token, op.animeId);
              }
              const cur = get();
              const latestEntry = cur.entries[op.animeId];
              // Only dequeue if the entry wasn't modified again while the request was in flight
              if (
                (op.type === "save" && latestEntry?.updatedAt === snapshotEntry?.updatedAt) ||
                (op.type === "delete" && !latestEntry)
              ) {
                const copy = { ...cur.pendingOps };
                delete copy[op.animeId];
                set({ pendingOps: copy, ...(myId === syncCallId ? { lastSyncError: null } : {}) });
              }
            } catch (e) {
              if (myId === syncCallId) {
                if (e instanceof AnilistAuthError) {
                  set({
                    anilistToken: null,
                    anilistUser: null,
                    lastSyncError: e.message,
                  });
                } else {
                  set({ lastSyncError: e instanceof Error ? e.message : "Sync failed" });
                }
              }
              break;
            }
          }
        } finally {
          flushing = false;
        }
      },

      mergeEntries: (incoming) => {
        const s = get();
        const next = { ...s.entries };
        let count = 0;
        for (const e of incoming) {
          const cur = next[e.animeId];
          if (!cur || e.updatedAt > cur.updatedAt) {
            next[e.animeId] = e;
            count++;
          }
        }
        set({ entries: next });
        return count;
      },

      setAnilist: (token, user) =>
        set({ anilistToken: token, anilistUser: user, lastSyncError: null }),
      setSyncError: (msg) => set({ lastSyncError: msg }),
    }),
    {
      name: "kuroiru-store",
      version: 1,
      migrate: (persistedState: any) => persistedState,
      skipHydration: true,
      partialize: (s) => ({
        entries: s.entries,
        pendingOps: s.pendingOps,
        anilistToken: s.anilistToken,
        anilistUser: s.anilistUser,
      }),
    },
  ),
);
