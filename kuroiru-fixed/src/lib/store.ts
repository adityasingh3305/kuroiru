"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { AnimeSummary, WatchEntry, WatchStatus } from "./types";
import {
  deleteRemoteEntry,
  saveRemoteEntry,
  type AnilistUser,
} from "./anilist-client";

type Minimal = Pick<AnimeSummary, "id" | "title" | "cover" | "format" | "episodes">;

interface State {
  hydrated: boolean;
  entries: Record<number, WatchEntry>;
  anilistToken: string | null;
  anilistUser: AnilistUser | null;
  lastSyncError: string | null;

  setHydrated: () => void;
  track: (
    anime: Minimal,
    patch: Partial<Pick<WatchEntry, "status" | "progress" | "score">>,
  ) => void;
  remove: (animeId: number) => void;
  mergeEntries: (entries: WatchEntry[]) => void;
  setAnilist: (token: string | null, user: AnilistUser | null) => void;
  setSyncError: (msg: string | null) => void;
}

export const useStore = create<State>()(
  persist(
    (set, get) => ({
      hydrated: false,
      entries: {},
      anilistToken: null,
      anilistUser: null,
      lastSyncError: null,

      setHydrated: () => set({ hydrated: true }),

      track: (anime, patch) => {
        const s = get();
        const prev = s.entries[anime.id];
        let status: WatchStatus = patch.status ?? prev?.status ?? "PLANNING";
        let progress = patch.progress ?? prev?.progress ?? 0;
        const score = patch.score ?? prev?.score ?? 0;
        const total = anime.episodes ?? prev?.episodes ?? null;

        if (patch.status === "COMPLETED" && total) progress = total;
        if (patch.progress !== undefined) {
          progress = Math.max(0, total ? Math.min(total, progress) : progress);
          if (total && progress >= total) status = "COMPLETED";
          else if (progress > 0 && (status === "PLANNING" || status === "COMPLETED"))
            status = "CURRENT";
        }
        const entry: WatchEntry = {
          animeId: anime.id,
          status,
          progress,
          score,
          title: anime.title,
          cover: anime.cover,
          format: anime.format,
          episodes: total,
          updatedAt: Date.now(),
        };
        set({ entries: { ...s.entries, [anime.id]: entry } });
        if (s.anilistToken) {
          saveRemoteEntry(s.anilistToken, entry)
            .then(() => get().lastSyncError && set({ lastSyncError: null }))
            .catch((e) => set({ lastSyncError: e.message }));
        }
      },

      remove: (animeId) => {
        const s = get();
        const next = { ...s.entries };
        delete next[animeId];
        set({ entries: next });
        if (s.anilistToken) {
          deleteRemoteEntry(s.anilistToken, animeId).catch((e) =>
            set({ lastSyncError: e.message }),
          );
        }
      },

      mergeEntries: (incoming) => {
        const s = get();
        const next = { ...s.entries };
        for (const e of incoming) {
          const cur = next[e.animeId];
          if (!cur || e.updatedAt > cur.updatedAt) next[e.animeId] = e;
        }
        set({ entries: next });
      },

      setAnilist: (token, user) => set({ anilistToken: token, anilistUser: user }),
      setSyncError: (msg) => set({ lastSyncError: msg }),
    }),
    {
      name: "kuroiru-store",
      skipHydration: true,
      partialize: (s) => ({
        entries: s.entries,
        anilistToken: s.anilistToken,
        anilistUser: s.anilistUser,
      }),
    },
  ),
);
