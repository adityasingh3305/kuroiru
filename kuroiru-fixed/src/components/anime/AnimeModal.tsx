"use client";

import { useEffect } from "react";
import { X } from "lucide-react";
import AnimeDetailView from "./AnimeDetailView";
import { useAnimeModal } from "./useOpenAnime";

export default function AnimeModal({ id }: { id: number }) {
  const { close } = useAnimeModal();

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [close]);

  return (
    <div
      className="anim-fade fixed inset-0 z-50 overflow-y-auto bg-black/70 backdrop-blur-md"
      onMouseDown={(e) => e.target === e.currentTarget && close()}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Anime details"
        className="anim-pop relative mx-auto my-0 min-h-screen w-full max-w-5xl overflow-hidden border-x border-line bg-bg sm:my-6 sm:min-h-0 sm:rounded-xl sm:border"
      >
        <button
          onClick={close}
          aria-label="Close"
          className="absolute right-3 top-3 z-20 grid h-9 w-9 place-items-center rounded-full bg-black/70 text-white backdrop-blur transition hover:bg-black"
        >
          <X size={18} />
        </button>
        <AnimeDetailView id={id} inModal />
      </div>
    </div>
  );
}
