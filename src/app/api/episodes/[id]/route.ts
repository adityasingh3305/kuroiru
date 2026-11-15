import { NextResponse } from "next/server";

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id } = await ctx.params;
  const n = Number(id);
  if (!Number.isInteger(n) || n <= 0) {
    return NextResponse.json(null, { status: 400 });
  }

  try {
    const r = await fetch(`https://api.ani.zip/mappings?anilist_id=${n}`, {
      next: { revalidate: 3600 },
    });
    if (!r.ok) return NextResponse.json(null, { status: r.status });
    const data = await r.json();
    return NextResponse.json(data, {
      headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400" },
    });
  } catch {
    return NextResponse.json(null, { status: 502 });
  }
}
