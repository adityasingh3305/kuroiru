import { NextResponse } from "next/server";
import { getSchedule } from "@/lib/anilist";

export async function GET() {
  try {
    return NextResponse.json(
      { schedule: await getSchedule(7) },
      { headers: { "Cache-Control": "public, s-maxage=600, stale-while-revalidate=1200" } },
    );
  } catch {
    return NextResponse.json({ schedule: [], error: "Unavailable" }, { status: 502 });
  }
}
