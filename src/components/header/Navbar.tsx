"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bookmark, Compass, Home, User } from "lucide-react";
import SearchInput from "./SearchInput";
import AnilistSync from "../user/AnilistSync";
import { useStore } from "@/lib/store";

const LINKS = [
  { href: "/", label: "Home", icon: Home },
  { href: "/search", label: "Browse", icon: Compass },
  { href: "/list", label: "My List", icon: Bookmark },
];

export type SyncPanel = "closed" | "open:signin" | "open:account";

export default function Navbar() {
  const pathname = usePathname();
  const [syncOpen, setSyncOpen] = useState(false);
  const user = useStore((s) => s.anilistUser);
  const count = useStore((s) => (s.hydrated ? Object.keys(s.entries).length : 0));

  const syncPanel: SyncPanel = !syncOpen
    ? "closed"
    : user
    ? "open:account"
    : "open:signin";

  const openSyncPanel = () => setSyncOpen(true);
  const closeSyncPanel = () => setSyncOpen(false);

  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-line bg-bg/90 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-[1800px] items-center gap-3 px-3 sm:gap-6 sm:px-6">
          <Link href="/" className="flex shrink-0 items-center gap-2 text-lg font-bold tracking-tight">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/icon.svg" alt="" className="h-7 w-7" />
            <span className="hidden sm:inline">
              Kuro<span className="text-accent">iru</span>
            </span>
          </Link>

          <nav className="hidden items-center gap-1 md:flex" aria-label="Main">
            {LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className={`relative rounded-md px-3 py-1.5 text-sm transition ${
                  isActive(l.href) ? "bg-white/10 text-white" : "text-muted hover:text-white"
                }`}
              >
                {l.label}
                {l.href === "/list" && count > 0 && (
                  <span className="ml-1.5 rounded-full bg-accent px-1.5 text-[10px] font-bold text-black">
                    {count}
                  </span>
                )}
              </Link>
            ))}
          </nav>

          <div className="mx-auto w-full max-w-xl flex-1 md:mx-0">
            <SearchInput />
          </div>

          <button
            onClick={openSyncPanel}
            aria-label="Account and AniList sync"
            className="btn btn-lift flex h-10 shrink-0 items-center gap-2 rounded-lg border border-line bg-panel px-3 text-sm text-soft hover:border-accent"
          >
            {user?.avatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={user.avatar} alt="" className="h-5 w-5 rounded-full" />
            ) : (
              <User size={16} />
            )}
            <span className="hidden lg:inline">{user ? user.name : "AniList"}</span>
          </button>
        </div>
      </header>

      {/* mobile bottom tab bar */}
      <nav
        aria-label="Tabs"
        className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-3 border-t border-line bg-bg/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden"
      >
        {LINKS.map((l) => {
          const Icon = l.icon;
          return (
            <Link
              key={l.href}
              href={l.href}
              className={`group relative flex flex-col items-center gap-0.5 py-2 text-[11px] transition active:scale-90 ${
                isActive(l.href) ? "text-accent" : "text-muted"
              }`}
            >
              <span className="relative">
                <Icon size={20} className={`transition-transform ${isActive(l.href) ? "-translate-y-0.5 scale-110" : "group-active:scale-90"}`} />
                {l.href === "/list" && count > 0 && (
                  <span className="absolute -right-3 -top-1 rounded-full bg-accent px-1 text-[9px] font-bold leading-tight text-black">
                    {count}
                  </span>
                )}
              </span>
              {l.label}
            </Link>
          );
        })}
      </nav>

      {syncPanel !== "closed" && (
        <AnilistSync
          mode={syncPanel === "open:account" ? "account" : "signin"}
          onClose={closeSyncPanel}
        />
      )}
    </>
  );
}
