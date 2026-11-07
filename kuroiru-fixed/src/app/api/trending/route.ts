import { NextResponse } from "next/server";
import { getTrending } from "@/lib/anilist";

export async function GET() {
  try {
    return NextResponse.json({ results: await getTrending(1, 24) });
  } catch {
    return NextResponse.json({ results: [], error: "Unavailable" }, { status: 502 });
  }
}
