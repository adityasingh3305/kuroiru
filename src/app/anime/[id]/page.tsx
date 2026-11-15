import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getAnimeDetail } from "@/lib/anilist";
import AnimeDetailView from "@/components/anime/AnimeDetailView";
import type { AnimeDetail } from "@/lib/types";

export const revalidate = 900;

type Props = { params: Promise<{ id: string }> };

function parse(id: string) {
  const n = Number(id);
  return Number.isInteger(n) && n > 0 ? n : null;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const n = parse((await params).id);
  let anime: AnimeDetail | null = null;
  try {
    anime = n ? await getAnimeDetail(n) : null;
  } catch {
    return { title: "Anime" };
  }
  if (!anime) return { title: "Anime not found" };
  return {
    title: anime.title,
    description: anime.description?.slice(0, 160),
    openGraph: { title: anime.title, images: anime.cover ? [anime.cover] : [] },
  };
}

export default async function AnimePage({ params }: Props) {
  const n = parse((await params).id);
  if (!n) notFound();
  let anime: AnimeDetail | null = null;
  let failed = false;
  try {
    anime = await getAnimeDetail(n);
  } catch {
    // AniList is unreachable: let the client retry instead of reporting "not found"
    failed = true;
  }
  if (!failed && !anime) notFound();
  return (
    <div className="mx-auto max-w-5xl rounded-xl border border-line bg-bg">
      <AnimeDetailView key={n} id={n} initial={failed ? null : anime} />
    </div>
  );
}
