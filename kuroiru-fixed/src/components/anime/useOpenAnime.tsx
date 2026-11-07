"use client";

import { useCallback } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { MouseEvent, ReactNode } from "react";

let pushedByUs = false;

// Once the user navigates with Back/Forward, the modal's history entry is no longer
// ours to pop, so closing must not call router.back() anymore.
if (typeof window !== "undefined") {
  window.addEventListener("popstate", () => {
    pushedByUs = false;
  });
}

export function useAnimeModal() {
  const router = useRouter();
  const pathname = usePathname();
  const search = useSearchParams();

  const open = useCallback(
    (id: number, replace = false) => {
      if (pathname.startsWith("/anime/")) {
        router.push(`/anime/${id}`);
        return;
      }
      const sp = new URLSearchParams(search.toString());
      const had = sp.has("id");
      sp.set("id", String(id));
      const url = `${pathname}?${sp.toString()}`;
      if (replace || had) {
        router.replace(url, { scroll: false });
      } else {
        pushedByUs = true;
        router.push(url, { scroll: false });
      }
    },
    [router, pathname, search],
  );

  const close = useCallback(() => {
    if (pushedByUs) {
      pushedByUs = false;
      router.back();
      return;
    }
    const sp = new URLSearchParams(search.toString());
    sp.delete("id");
    const qs = sp.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }, [router, pathname, search]);

  return { open, close };
}

/** A real link to /anime/[id] that opens the modal on plain left-click. */
export function AnimeLink({
  id,
  className,
  children,
  title,
  replace,
}: {
  id: number;
  className?: string;
  children: ReactNode;
  title?: string;
  replace?: boolean;
}) {
  const { open } = useAnimeModal();
  const onClick = (e: MouseEvent<HTMLAnchorElement>) => {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey)
      return;
    e.preventDefault();
    open(id, replace);
  };
  return (
    <a href={`/anime/${id}`} onClick={onClick} className={className} title={title}>
      {children}
    </a>
  );
}
