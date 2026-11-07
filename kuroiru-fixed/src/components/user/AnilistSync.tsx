"use client";

import { useEffect, useState } from "react";
import { Download, ExternalLink, LogOut, X } from "lucide-react";
import { useStore } from "@/lib/store";
import {
  fetchViewer,
  importRemoteList,
  oauthUrl,
  saveRemoteEntry,
} from "@/lib/anilist-client";

const CLIENT_ID = process.env.NEXT_PUBLIC_ANILIST_CLIENT_ID;

export default function AnilistSync({ onClose }: { onClose: () => void }) {
  const token = useStore((s) => s.anilistToken);
  const user = useStore((s) => s.anilistUser);
  const setAnilist = useStore((s) => s.setAnilist);
  const mergeEntries = useStore((s) => s.mergeEntries);
  const syncError = useStore((s) => s.lastSyncError);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const connect = async () => {
    const t = input.trim();
    if (!t) return;
    setBusy("connect");
    setMsg(null);
    try {
      const u = await fetchViewer(t);
      setAnilist(t, u);
      setInput("");
      setMsg(`Connected as ${u.name}`);
    } catch (e) {
      setMsg(e instanceof Error ? `Could not connect: ${e.message}` : "Could not connect");
    } finally {
      setBusy(null);
    }
  };

  const pull = async () => {
    if (!token || !user) return;
    setBusy("pull");
    setMsg(null);
    try {
      const entries = await importRemoteList(token, user.id);
      // AniList is authoritative on import: stamp as newer than local
      const now = Date.now();
      mergeEntries(entries.map((e) => ({ ...e, updatedAt: now })));
      setMsg(`Imported ${entries.length} entries from AniList`);
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Import failed");
    } finally {
      setBusy(null);
    }
  };

  const push = async () => {
    if (!token) return;
    setBusy("push");
    setMsg(null);
    try {
      const all = Object.values(useStore.getState().entries);
      for (const e of all) {
        await saveRemoteEntry(token, e);
        await new Promise((r) => setTimeout(r, 700)); // stay under rate limit
      }
      setMsg(`Pushed ${all.length} entries to AniList`);
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Push failed");
    } finally {
      setBusy(null);
    }
  };

  return (
    <div
      className="anim-fade fixed inset-0 z-[60] grid place-items-center bg-black/70 p-4 backdrop-blur-sm"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div role="dialog" aria-modal="true" aria-label="AniList sync" className="anim-pop w-full max-w-md rounded-xl border border-line bg-panel p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold">AniList sync</h2>
          <button onClick={onClose} aria-label="Close" className="rounded p-1 text-muted hover:text-white">
            <X size={18} />
          </button>
        </div>

        <p className="mb-4 text-sm text-muted">
          Your list is always saved locally and on this server. Connect AniList to mirror every
          change to your AniList account in real time.
        </p>

        {user && token ? (
          <div className="space-y-3">
            <div className="flex items-center gap-3 rounded-lg border border-line bg-panel2 p-3">
              {user.avatar && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={user.avatar} alt="" className="h-10 w-10 rounded-full" />
              )}
              <div className="min-w-0 flex-1">
                <div className="truncate font-medium">{user.name}</div>
                <div className="text-xs text-watching">● Syncing live</div>
              </div>
              <button
                onClick={() => setAnilist(null, null)}
                className="flex items-center gap-1 rounded-md border border-line px-2.5 py-1.5 text-xs text-muted hover:text-white"
              >
                <LogOut size={12} /> Disconnect
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button disabled={!!busy} onClick={pull} className="flex items-center justify-center gap-2 rounded-lg bg-accent px-3 py-2.5 text-sm font-medium text-black disabled:opacity-50">
                <Download size={14} /> {busy === "pull" ? "Importing…" : "Import list"}
              </button>
              <button disabled={!!busy} onClick={push} className="rounded-lg border border-line px-3 py-2.5 text-sm text-soft hover:border-accent disabled:opacity-50">
                {busy === "push" ? "Pushing…" : "Push local list"}
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {CLIENT_ID && (
              <a
                href={oauthUrl(CLIENT_ID)}
                className="flex items-center justify-center gap-2 rounded-lg bg-accent px-3 py-2.5 text-sm font-medium text-black"
              >
                <ExternalLink size={14} /> Sign in with AniList
              </a>
            )}
            <div>
              <label htmlFor="al-token" className="mb-1 block text-xs text-muted">
                Access token
              </label>
              <input
                id="al-token"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Paste an AniList access token"
                className="h-10 w-full rounded-lg border border-line bg-bg px-3 text-sm focus:border-accent focus:outline-none"
              />
              <p className="mt-1.5 text-xs text-dim">
                Create a token via{" "}
                <a className="text-accent underline" href="https://anilist.co/settings/developer" target="_blank" rel="noreferrer">
                  AniList developer settings
                </a>{" "}
                (set the redirect URL to <code className="text-soft">https://anilist.co/api/v2/oauth/pin</code>).
                {!CLIENT_ID && " Set NEXT_PUBLIC_ANILIST_CLIENT_ID to enable one-click sign-in."}
              </p>
            </div>
            <button disabled={!!busy || !input.trim()} onClick={connect} className="w-full rounded-lg border border-line px-3 py-2.5 text-sm text-soft hover:border-accent disabled:opacity-50">
              {busy === "connect" ? "Connecting…" : "Connect with token"}
            </button>
          </div>
        )}

        {(msg || syncError) && (
          <div className={`mt-3 rounded-md px-3 py-2 text-xs ${syncError && !msg ? "bg-dropped/15 text-dropped" : "bg-white/5 text-soft"}`}>
            {msg ?? syncError}
          </div>
        )}
      </div>
    </div>
  );
}
