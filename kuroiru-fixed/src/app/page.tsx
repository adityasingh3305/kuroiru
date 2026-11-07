import { getPopularAllTime, getSchedule, getSeasonal, getTrending, currentSeason } from "@/lib/anilist";
import type { AnimeSummary, ScheduleItem } from "@/lib/types";
import HeroCarousel from "@/components/home/HeroCarousel";
import TrendingSection from "@/components/home/TrendingSection";
import AiringCalendar from "@/components/home/AiringCalendar";

export const dynamic = "force-dynamic";

async function safe<T>(p: Promise<T>, fallback: T): Promise<T> {
  try {
    return await p;
  } catch {
    return fallback;
  }
}

export default async function HomePage() {
  const [trending, seasonal, popular, schedule] = await Promise.all([
    safe<AnimeSummary[]>(getTrending(1, 24), []),
    safe<AnimeSummary[]>(getSeasonal(24), []),
    safe<AnimeSummary[]>(getPopularAllTime(24), []),
    safe<ScheduleItem[]>(getSchedule(7), []),
  ]);

  const hero = trending.filter((a) => a.banner).slice(0, 6);
  const { season, year } = currentSeason();
  const seasonLabel = `${season.charAt(0)}${season.slice(1).toLowerCase()} ${year}`;
  const nothing = trending.length === 0 && seasonal.length === 0 && schedule.length === 0;

  return (
    <div>
      {nothing && (
        <div className="mb-6 rounded-lg border border-dropped/40 bg-dropped/10 p-4 text-sm text-dropped">
          Couldn&apos;t reach AniList right now. Refresh in a moment — your list is still available under
          “My List”.
        </div>
      )}
      <HeroCarousel items={hero.length ? hero : trending.slice(0, 5)} />
      <TrendingSection title="Trending now" items={trending} href="/search?sort=TRENDING_DESC" />
      <TrendingSection
        title={`Popular this season · ${seasonLabel}`}
        items={seasonal}
        href={`/search?season=${season}&year=${year}`}
      />
      <AiringCalendar schedule={schedule} />
      <TrendingSection title="All-time popular" items={popular} href="/search?sort=POPULARITY_DESC" />
    </div>
  );
}
