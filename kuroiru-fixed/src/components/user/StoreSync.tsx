"use client";

import { useEffect } from "react";
import { useStore } from "@/lib/store";
import { fetchViewer } from "@/lib/anilist-client";

export default function StoreSync() {
  useEffect(() => {
    (async () => {
      await useStore.persist.rehydrate();
      useStore.getState().setHydrated();
      void useStore.getState().flushQueue();

      if (window.location.hash.includes("access_token")) {
        const params = new URLSearchParams(window.location.hash.slice(1));
        const token = params.get("access_token");
        history.replaceState(null, "", window.location.pathname + window.location.search);
        if (token) {
          try {
            const user = await fetchViewer(token);
            useStore.getState().setAnilist(token, user);
          } catch {
            useStore.getState().setSyncError("AniList sign-in failed");
          }
        }
      }
    })();

    const onStorage = (e: StorageEvent) => {
      if (e.key === "kuroiru-store") {
        void useStore.persist.rehydrate();
      }
    };
    const onOnline = () => {
      void useStore.getState().flushQueue();
    };
    window.addEventListener("storage", onStorage);
    window.addEventListener("online", onOnline);

    if ("serviceWorker" in navigator && process.env.NODE_ENV === "production") {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }

    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("online", onOnline);
    };
  }, []);
  return null;
}
