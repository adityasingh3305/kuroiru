import { NextResponse } from "next/server";
import { getSchedule } from "@/lib/anilist";

export async function GET() {
  try {
    return NextResponse.json({ schedule: await getSchedule(7) });
  } catch {
    return NextResponse.json({ schedule: [], error: "Unavailable" }, { status: 502 });
  }
}
