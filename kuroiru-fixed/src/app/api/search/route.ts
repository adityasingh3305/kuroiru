import { NextResponse } from "next/server";
import { searchAnime } from "@/lib/anilist";
import { AIR_STATUSES, FORMATS, GENRES, SEASONS, SORTS } from "@/lib/types";

/** Only pass through values we recognise; anything else is ignored. */
const pick = (v: string | null, allowed: readonly string[]) =>
  v && allowed.includes(v) ? v : undefined;

export async function GET(req: Request) {
  const sp = new URL(req.url).searchParams;
  const num = (k: string) => {
    const v = Number(sp.get(k));
    return Number.isFinite(v) && v > 0 ? v : undefined;
  };
  try {
    const data = await searchAnime({
      q: sp.get("q")?.slice(0, 100) || undefined,
      genre: pick(sp.get("genre"), GENRES),
      year: num("year"),
      season: pick(sp.get("season"), SEASONS),
      format: pick(sp.get("format"), FORMATS),
      status: pick(sp.get("status"), AIR_STATUSES),
      sort: pick(sp.get("sort"), SORTS.map((s) => s.value)),
      page: num("page"),
      perPage: Math.min(num("perPage") ?? 24, 50),
    });
    return NextResponse.json(data);
  } catch {
    return NextResponse.json(
      { results: [], hasNextPage: false, total: 0, error: "Search unavailable" },
      { status: 502 },
    );
  }
}
