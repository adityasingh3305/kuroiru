"use client";

import { useCallback, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { MouseEvent, ReactNode } from "react";

export function useAnimeModal() {
  const router = useRouter();
  const pathname = usePathname();
  const pushedByUs = useRef(false);

  useEffect(() => {
    const handler = () => {
      pushedByUs.current = false;
    };
    window.addEventListener("popstate", handler);
    return () => window.removeEventListener("popstate", handler);
  }, []);

  const open = useCallback(
    (id: number, replace = false) => {
      if (pathname.startsWith("/anime/")) {
        router.push(`/anime/${id}`);
        return;
      }
      const search = typeof window !== "undefined" ? window.location.search : "";
      const sp = new URLSearchParams(search);
      const had = sp.has("id");
      sp.set("id", String(id));
      const url = `${pathname}?${sp.toString()}`;
      if (replace || had) {
        router.replace(url, { scroll: false });
      } else {
        pushedByUs.current = true;
        router.push(url, { scroll: false });
      }
    },
    [router, pathname],
  );

  const close = useCallback(() => {
    if (pushedByUs.current) {
      pushedByUs.current = false;
      router.back();
      return;
    }
    const search = typeof window !== "undefined" ? window.location.search : "";
    const sp = new URLSearchParams(search);
    sp.delete("id");
    const qs = sp.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }, [router, pathname]);

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
    <Link href={`/anime/${id}`} onClick={onClick} className={className} title={title}>
      {children}
    </Link>
  );
}
