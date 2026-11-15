import { NextResponse } from "next/server";
import { getTrending } from "@/lib/anilist";

export async function GET() {
  try {
    return NextResponse.json(
      { results: await getTrending(1, 24) },
      { headers: { "Cache-Control": "public, s-maxage=600, stale-while-revalidate=1200" } },
    );
  } catch {
    return NextResponse.json({ results: [], error: "Unavailable" }, { status: 502 });
  }
}
