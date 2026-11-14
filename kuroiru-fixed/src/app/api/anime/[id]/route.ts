import { NextResponse } from "next/server";
import { getAnimeDetail } from "@/lib/anilist";

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const n = Number(id);
  if (!Number.isInteger(n) || n <= 0) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }
  let anime;
  try {
    anime = await getAnimeDetail(n);
  } catch {
    return NextResponse.json({ error: "AniList unavailable" }, { status: 502 });
  }
  if (!anime) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(
    { anime },
    { headers: { "Cache-Control": "public, s-maxage=600, stale-while-revalidate=1200" } },
  );
}
