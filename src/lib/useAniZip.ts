"use client";

import { useEffect, useState } from "react";
import { getAniZip, type AniZipData } from "./aniZip";

/** Pass null/undefined to skip fetching. `loading` is derived, so no sync setState in the effect. */
export function useAniZip(id?: number | null) {
  const [res, setRes] = useState<{ id: number; data: AniZipData | null } | null>(null);

  useEffect(() => {
    if (!id) return;
    let alive = true;
    getAniZip(id).then((data) => {
      if (alive) setRes({ id, data });
    });
    return () => {
      alive = false;
    };
  }, [id]);

  const ready = !!id && res?.id === id;
  return { data: ready ? res!.data : null, loading: !!id && !ready };
}
