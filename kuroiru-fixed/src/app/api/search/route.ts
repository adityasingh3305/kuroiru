import { NextResponse } from "next/server";
import { searchAnime } from "@/lib/anilist";
import { AIR_STATUSES, FORMATS, GENRES, SEASONS, SORTS } from "@/lib/types";

const pick = (v: string | null, allowed: readonly string[]) =>
  v && allowed.includes(v) ? v : undefined;

export async function GET(req: Request) {
  const sp = new URL(req.url).searchParams;
  const intParam = (k: string) => {
    const raw = sp.get(k);
    if (!raw) return undefined;
    const v = Number(raw);
    return Number.isInteger(v) && v > 0 ? v : undefined;
  };
  try {
    const data = await searchAnime({
      q: sp.get("q")?.trim().slice(0, 100) || undefined,
      genre: pick(sp.get("genre"), GENRES),
      year: intParam("year"),
      season: pick(sp.get("season"), SEASONS),
      format: pick(sp.get("format"), FORMATS),
      status: pick(sp.get("status"), AIR_STATUSES),
      sort: pick(sp.get("sort"), SORTS.map((s) => s.value)),
      page: intParam("page"),
      perPage: Math.min(intParam("perPage") ?? 24, 50),
    });
    return NextResponse.json(data, {
      headers: { "Cache-Control": "public, s-maxage=120, stale-while-revalidate=300" },
    });
  } catch {
    return NextResponse.json(
      { results: [], hasNextPage: false, total: 0, error: "Search unavailable" },
      { status: 502 },
    );
  }
}
