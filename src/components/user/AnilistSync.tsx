"use client";

import { useEffect, useRef, useState } from "react";
import { Download, ExternalLink, Loader2, LogOut, X } from "lucide-react";
import { useStore } from "@/lib/store";
import {
  AnilistAuthError,
  fetchViewer,
  importRemoteList,
  oauthUrl,
  saveRemoteEntry,
} from "@/lib/anilist-client";

const CLIENT_ID = process.env.NEXT_PUBLIC_ANILIST_CLIENT_ID;

export default function AnilistSync({
  onClose,
  mode,
}: {
  onClose: () => void;
  mode?: "signin" | "account";
}) {
  const token = useStore((s) => s.anilistToken);
  const user = useStore((s) => s.anilistUser);
  const setAnilist = useStore((s) => s.setAnilist);
  const mergeEntries = useStore((s) => s.mergeEntries);
  const syncError = useStore((s) => s.lastSyncError);
  const activeUser = (mode ? mode === "account" : !!token) ? user : null;
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const prevFocus = document.activeElement as HTMLElement | null;
    dialogRef.current?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        const t = e.target as HTMLElement | null;
        if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.tagName === "SELECT")) {
          t.blur();
          e.stopPropagation();
          return;
        }
        onClose();
      } else if (e.key === "Tab" && dialogRef.current) {
        const focusable = dialogRef.current.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
        );
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      prevFocus?.focus();
    };
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
      const updated = mergeEntries(entries);
      setMsg(`Imported ${updated} new or updated entries (${entries.length} total on AniList)`);
    } catch (e) {
      if (e instanceof AnilistAuthError) setAnilist(null, null);
      setMsg(e instanceof Error ? e.message : "Import failed");
    } finally {
      setBusy(null);
    }
  };

  const push = async () => {
    if (!token) return;
    setBusy("push");
    setMsg(null);
    const all = Object.values(useStore.getState().entries);
    let ok = 0;
    let failed = 0;
    for (let i = 0; i < all.length; i++) {
      try {
        await saveRemoteEntry(token, all[i]);
        ok++;
      } catch (e) {
        if (e instanceof AnilistAuthError) {
          setAnilist(null, null);
          setMsg(e.message);
          setBusy(null);
          return;
        }
        failed++;
      }
      if (i < all.length - 1) {
        await new Promise((r) => setTimeout(r, 2100)); // stay under 30 req/min rate limit
      }
    }
    setBusy(null);
    setMsg(
      failed > 0
        ? `Pushed ${ok} entries (${failed} failed).`
        : `Pushed ${ok} entries to AniList.`,
    );
  };

  return (
    <div
      className="anim-fade fixed inset-0 z-[60] grid place-items-center bg-black/70 p-4 backdrop-blur-sm"
      onMouseDown={(e) => {
        if (
          e.button === 0 &&
          e.target === e.currentTarget &&
          e.clientX < e.currentTarget.clientWidth &&
          e.clientY < e.currentTarget.clientHeight
        ) {
          onClose();
        }
      }}
    >
      <div
        ref={dialogRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label="AniList sync"
        className="anim-pop w-full max-w-md rounded-xl border border-line bg-panel p-5 focus:outline-none"
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold">AniList sync</h2>
          <button onClick={onClose} aria-label="Close" className="rounded p-1 text-muted transition duration-200 hover:rotate-90 hover:bg-black hover:text-white active:scale-90">
            <X size={18} />
          </button>
        </div>

        <p className="mb-4 text-sm text-muted">
          Your list is saved in this browser&apos;s local storage. Connect AniList to back it up and
          mirror every change to your AniList account in real time.
        </p>

        {activeUser ? (
          <div className="space-y-3">
            <div className="flex items-center gap-3 rounded-lg border border-line bg-panel2 p-3">
              {activeUser.avatar && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={activeUser.avatar} alt="" className="h-10 w-10 rounded-full" />
              )}
              <div className="min-w-0 flex-1">
                <div className="truncate font-medium">{activeUser.name}</div>
                <div className={`text-xs ${syncError ? "text-dropped" : "text-watching"}`}>
                  {syncError ? "● Sync error" : "● Syncing live"}
                </div>
              </div>
              <button
                onClick={() => setAnilist(null, null)}
                className="btn flex items-center gap-1 rounded-md border border-line px-2.5 py-1.5 text-xs text-muted hover:border-accent hover:text-white"
              >
                <LogOut size={12} /> Disconnect
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                disabled={!!busy}
                onClick={pull}
                className="btn btn-shine flex items-center justify-center gap-2 rounded-lg bg-accent px-3 py-2.5 text-sm font-medium text-black transition hover:-translate-y-0.5 active:scale-95 disabled:opacity-60"
              >
                {busy === "pull" ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
                {busy === "pull" ? "Importing…" : "Import list"}
              </button>
              <button
                disabled={!!busy}
                onClick={push}
                className="btn rounded-lg border border-line px-3 py-2.5 text-sm text-soft transition hover:-translate-y-0.5 hover:border-accent active:scale-95 disabled:opacity-60"
              >
                {busy === "push" && <Loader2 size={14} className="mr-1.5 inline animate-spin" />}
                {busy === "push" ? "Pushing…" : "Push local list"}
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {CLIENT_ID && (
              <a
                href={oauthUrl(CLIENT_ID)}
                className="btn btn-shine flex items-center justify-center gap-2 rounded-lg bg-accent px-3 py-2.5 text-sm font-medium text-black"
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
                type="password"
                autoComplete="off"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Paste an AniList access token"
                className="h-10 w-full rounded-lg border border-line bg-bg px-3 text-sm focus:border-accent focus:outline-none"
              />
              <p className="mt-1.5 text-xs text-dim">
                Create an API client in{" "}
                <a className="text-accent underline" href="https://anilist.co/settings/developer" target="_blank" rel="noreferrer">
                  AniList developer settings
                </a>
                . For manual token paste, set Redirect URL to{" "}
                <code className="text-soft">https://anilist.co/api/v2/oauth/pin</code>. For
                one-click sign-in (<code className="text-soft">NEXT_PUBLIC_ANILIST_CLIENT_ID</code>),
                set Redirect URL to your site&apos;s root URL.
              </p>
            </div>
            <button
              disabled={!!busy || !input.trim()}
              onClick={connect}
              className="btn w-full rounded-lg border border-line px-3 py-2.5 text-sm text-soft hover:border-accent disabled:opacity-50"
            >
              {busy === "connect" && <Loader2 size={14} className="mr-1.5 inline animate-spin" />}
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
