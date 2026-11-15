"use client";

import { usePathname, useSearchParams } from "next/navigation";
import AnimeModal from "./AnimeModal";

export default function ModalHost() {
  const search = useSearchParams();
  const pathname = usePathname();
  const raw = search.get("id");
  const id = raw ? Number(raw) : NaN;
  if (!Number.isInteger(id) || id <= 0 || pathname.startsWith("/anime/")) return null;
  return <AnimeModal key={id} id={id} />;
}
