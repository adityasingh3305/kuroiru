"use client";

import { useEffect, useRef } from "react";
import { X } from "lucide-react";
import AnimeDetailView from "./AnimeDetailView";
import { useAnimeModal } from "./useOpenAnime";

export default function AnimeModal({ id }: { id: number }) {
  const { close } = useAnimeModal();
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    const prevFocus = document.activeElement as HTMLElement | null;
    document.body.style.overflow = "hidden";
    dialogRef.current?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        const t = e.target as HTMLElement | null;
        if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.tagName === "SELECT")) {
          t.blur();
          e.stopPropagation();
          return;
        }
        close();
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
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKey);
      prevFocus?.focus();
    };
  }, [close]);

  return (
    <div
      className="anim-fade fixed inset-0 z-50 bg-black/70 backdrop-blur-md"
      onMouseDown={(e) => {
        if (
          e.button === 0 &&
          e.target === e.currentTarget &&
          e.clientX < e.currentTarget.clientWidth &&
          e.clientY < e.currentTarget.clientHeight
        ) {
          close();
        }
      }}
    >
      <div
        ref={dialogRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label="Anime details"
        className="anim-pop relative mx-auto my-0 max-h-screen min-h-screen w-full max-w-5xl overflow-y-auto border-x border-line bg-bg focus:outline-none sm:my-6 sm:max-h-[calc(100vh-3rem)] sm:min-h-0 sm:rounded-xl sm:border"
      >
        <button
          onClick={close}
          aria-label="Close"
          className="absolute right-3 top-3 z-30 grid h-9 w-9 place-items-center rounded-full bg-black/70 text-white backdrop-blur transition duration-200 hover:rotate-90 hover:bg-black active:scale-90"
        >
          <X size={18} />
        </button>
        <AnimeDetailView id={id} inModal />
      </div>
    </div>
  );
}
