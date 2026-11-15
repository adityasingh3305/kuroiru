import { NextResponse } from "next/server";
import { getThemes } from "@/lib/anilist";

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const n = Number(id);
  if (!Number.isInteger(n) || n <= 0) {
    return NextResponse.json({ themes: [] }, { status: 400 });
  }
  const themes = await getThemes(n);
  if (!themes) {
    return NextResponse.json({ themes: [], error: "AnimeThemes unavailable" }, { status: 502 });
  }
  return NextResponse.json(
    { themes },
    { headers: { "Cache-Control": "public, s-maxage=600, stale-while-revalidate=1200" } },
  );
}
