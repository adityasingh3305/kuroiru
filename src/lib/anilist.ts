import "server-only";
import { cache } from "react";
import type {
  AnimeDetail,
  AnimeSummary,
  AnimeTheme,
  ScheduleItem,
} from "./types";

const ENDPOINT = "https://graphql.anilist.co";

export async function gql<T = any>(
  query: string,
  variables: Record<string, unknown> = {},
  revalidate = 600,
): Promise<T> {
  let lastErr: unknown;
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const res = await fetch(ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ query, variables }),
        next: { revalidate },
        signal: AbortSignal.timeout(10000),
      });
      if (res.status === 429) {
        const retryAfter = Number(res.headers.get("retry-after"));
        const delayMs = Number.isFinite(retryAfter) && retryAfter > 0
          ? Math.min(retryAfter * 1000, 4000)
          : 1200;
        lastErr = new Error("AniList rate limit exceeded (429)");
        if (attempt === 0) {
          await new Promise((r) => setTimeout(r, delayMs));
          continue;
        }
        throw lastErr;
      }
      const json = await res.json();
      if (json.errors && !json.data) {
        throw new Error(json.errors[0]?.message ?? "AniList error");
      }
      if (!res.ok) {
        throw new Error(`AniList HTTP ${res.status}`);
      }
      return json.data as T;
    } catch (e) {
      lastErr = e;
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error("AniList request failed");
}

const CARD = `
  id
  isAdult
  title { romaji english native }
  coverImage { extraLarge large color }
  bannerImage
  format
  season
  seasonYear
  startDate { year }
  episodes
  status
  averageScore
  genres
  description(asHtml: false)
  nextAiringEpisode { episode airingAt }
`;

const NAMED_ENTITIES: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: " ",
};

function decodeEntities(s: string): string {
  return s.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (match, body: string) => {
    if (body[0] === "#") {
      const code = body[1].toLowerCase() === "x" ? parseInt(body.slice(2), 16) : parseInt(body.slice(1), 10);
      return Number.isFinite(code) && code > 0 && code <= 0x10ffff ? String.fromCodePoint(code) : match;
    }
    return NAMED_ENTITIES[body.toLowerCase()] ?? match;
  });
}

function clean(html: string | null | undefined): string | null {
  if (!html) return null;
  return decodeEntities(
    html
      .replace(/~![\s\S]*?!~/g, "")
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<[^>]+>/g, ""),
  )
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function mapCard(m: any): AnimeSummary {
  return {
    id: m.id,
    title: m.title?.english || m.title?.romaji || m.title?.native || "Untitled",
    romaji: m.title?.romaji ?? "",
    english: m.title?.english ?? null,
    native: m.title?.native ?? null,
    cover: m.coverImage?.extraLarge || m.coverImage?.large || "",
    color: m.coverImage?.color ?? null,
    banner: m.bannerImage ?? null,
    format: m.format ?? null,
    year: m.seasonYear ?? m.startDate?.year ?? null,
    season: m.season ?? null,
    episodes: m.episodes ?? null,
    status: m.status ?? null,
    score: m.averageScore ?? null,
    genres: m.genres ?? [],
    description: clean(m.description),
    nextAiring: m.nextAiringEpisode
      ? { episode: m.nextAiringEpisode.episode, airingAt: m.nextAiringEpisode.airingAt }
      : null,
  };
}

export function currentSeason(date = new Date()) {
  const m = date.getUTCMonth();
  const season = m < 3 ? "WINTER" : m < 6 ? "SPRING" : m < 9 ? "SUMMER" : "FALL";
  return { season, year: date.getUTCFullYear() };
}

export async function getTrending(page = 1, perPage = 20): Promise<AnimeSummary[]> {
  const data = await gql(
    `query($page:Int,$perPage:Int){
      Page(page:$page,perPage:$perPage){
        media(type:ANIME,sort:TRENDING_DESC,isAdult:false){ ${CARD} }
      }
    }`,
    { page, perPage },
  );
  return data.Page.media.map((m: any, i: number) => ({
    ...mapCard(m),
    rank: (page - 1) * perPage + i + 1,
  }));
}

export async function getSeasonal(perPage = 20): Promise<AnimeSummary[]> {
  const { season, year } = currentSeason();
  const data = await gql(
    `query($season:MediaSeason,$year:Int,$perPage:Int){
      Page(page:1,perPage:$perPage){
        media(type:ANIME,season:$season,seasonYear:$year,sort:POPULARITY_DESC,isAdult:false){ ${CARD} }
      }
    }`,
    { season, year, perPage },
  );
  return data.Page.media.map(mapCard);
}

export async function getPopularAllTime(perPage = 20): Promise<AnimeSummary[]> {
  const data = await gql(
    `query($perPage:Int){
      Page(page:1,perPage:$perPage){
        media(type:ANIME,sort:POPULARITY_DESC,isAdult:false){ ${CARD} }
      }
    }`,
    { perPage },
    3600,
  );
  return data.Page.media.map(mapCard);
}

export interface SearchParams {
  q?: string;
  genre?: string;
  year?: number;
  season?: string;
  format?: string;
  status?: string;
  sort?: string;
  page?: number;
  perPage?: number;
}

export async function searchAnime(p: SearchParams) {
  const sort = p.sort || (p.q ? "SEARCH_MATCH" : "POPULARITY_DESC");
  const useSeasonYear = Boolean(p.year && p.season);
  const startGreater = p.year && !p.season ? p.year * 10000 : undefined;
  const startLesser = p.year && !p.season ? (p.year + 1) * 10000 : undefined;

  const data = await gql(
    `query(
      $page:Int,
      $perPage:Int,
      $search:String,
      $genre:String,
      $seasonYear:Int,
      $startGreater:FuzzyDateInt,
      $startLesser:FuzzyDateInt,
      $season:MediaSeason,
      $format:MediaFormat,
      $status:MediaStatus,
      $sort:[MediaSort]
    ){
      Page(page:$page,perPage:$perPage){
        pageInfo { hasNextPage total currentPage }
        media(
          type:ANIME,
          isAdult:false,
          search:$search,
          genre:$genre,
          seasonYear:$seasonYear,
          startDate_greater:$startGreater,
          startDate_lesser:$startLesser,
          season:$season,
          format:$format,
          status:$status,
          sort:$sort
        ){ ${CARD} }
      }
    }`,
    {
      page: p.page ?? 1,
      perPage: p.perPage ?? 24,
      search: p.q || undefined,
      genre: p.genre || undefined,
      seasonYear: useSeasonYear ? p.year : undefined,
      startGreater,
      startLesser,
      season: p.season || undefined,
      format: p.format || undefined,
      status: p.status || undefined,
      sort: [sort],
    },
    120,
  );
  return {
    results: data.Page.media.map(mapCard) as AnimeSummary[],
    hasNextPage: !!data.Page.pageInfo.hasNextPage,
    total: (data.Page.pageInfo.total ?? 0) as number,
  };
}

export async function getSchedule(days = 7): Promise<ScheduleItem[]> {
  const nowSec = Math.floor(Date.now() / 1000);
  // Start 24h back so "Today" in any local timezone retains already-aired episodes
  const from = nowSec - 86400;
  const to = nowSec + days * 86400;
  const fromB = from - (from % 600);
  const toB = to + (600 - (to % 600)) % 600;

  const query = `query($page:Int,$from:Int,$to:Int){
    Page(page:$page,perPage:50){
      pageInfo { hasNextPage }
      airingSchedules(airingAt_greater:$from,airingAt_lesser:$to,sort:TIME){
        airingAt episode
        media { ${CARD} popularity isAdult countryOfOrigin }
      }
    }
  }`;

  const items: ScheduleItem[] = [];
  const seen = new Set<string>();
  const MAX_PAGES = 20;
  const BATCH_SIZE = 4;

  let page = 1;
  let more = true;
  while (more && page <= MAX_PAGES) {
    const batchPages = Array.from(
      { length: Math.min(BATCH_SIZE, MAX_PAGES - page + 1) },
      (_, i) => page + i,
    );
    const results = await Promise.all(
      batchPages.map((p) => gql(query, { page: p, from: fromB, to: toB }, 600).catch(() => null)),
    );
    for (const pg of results) {
      if (!pg?.Page) {
        more = false;
        break;
      }
      for (const s of pg.Page.airingSchedules ?? []) {
        const m = s.media;
        if (!m || m.isAdult || m.countryOfOrigin !== "JP") continue;
        const key = `${m.id}-${s.episode}`;
        if (seen.has(key)) continue;
        seen.add(key);
        items.push({ airingAt: s.airingAt, episode: s.episode, anime: mapCard(m) });
      }
      if (!pg.Page.pageInfo?.hasNextPage || (pg.Page.airingSchedules?.length ?? 0) < 50) {
        more = false;
        break;
      }
    }
    page += BATCH_SIZE;
  }

  return items.sort((a, b) => a.airingAt - b.airingAt);
}

function fuzzyDate(d: any): string | null {
  if (!d?.year) return null;
  const parts = [d.year, d.month, d.day].filter(Boolean).map((n: number) => String(n).padStart(2, "0"));
  return parts.join("-");
}

export const getAnimeDetail = cache(async function getAnimeDetail(id: number): Promise<AnimeDetail | null> {
  const data: any = await gql(
    `query($id:Int){
      Media(id:$id,type:ANIME,isAdult:false){
        ${CARD}
        synonyms duration source popularity favourites meanScore siteUrl
        startDate { year month day }
        endDate { year month day }
        studios { edges { isMain node { name isAnimationStudio } } }
        tags { name rank isMediaSpoiler }
        rankings { rank type allTime context }
        externalLinks { site url type color }
        streamingEpisodes { title url site thumbnail }
        trailer { id site }
        relations { edges { relationType(version:2) node { ${CARD} type } } }
        recommendations(perPage:12,sort:RATING_DESC){ nodes { mediaRecommendation { ${CARD} } } }
        characters(perPage:16,sort:[ROLE,RELEVANCE]){
          edges { role node { id name { full } image { medium } }
            voiceActors(language:JAPANESE){ id name { full } image { medium } } }
        }
        staff(perPage:16,sort:RELEVANCE){
          edges { role node { id name { full } image { medium } } }
        }
      }
    }`,
    { id },
    900,
  );
  const m = data?.Media;
  if (!m || m.isAdult) return null;
  const base = mapCard(m);
  return {
    ...base,
    synonyms: m.synonyms ?? [],
    duration: m.duration ?? null,
    source: m.source ?? null,
    startDate: fuzzyDate(m.startDate),
    endDate: fuzzyDate(m.endDate),
    popularity: m.popularity ?? null,
    favourites: m.favourites ?? null,
    meanScore: m.meanScore ?? null,
    siteUrl: m.siteUrl ?? null,
    studios: (m.studios?.edges ?? [])
      .filter((e: any) => e.node.isAnimationStudio)
      .sort((a: any, b: any) => Number(b.isMain) - Number(a.isMain))
      .map((e: any) => e.node.name),
    tags: (m.tags ?? [])
      .filter((t: any) => !t.isMediaSpoiler)
      .slice(0, 14)
      .map((t: any) => ({ name: t.name, rank: t.rank })),
    rankings: (m.rankings ?? [])
      .filter((r: any) => r.type === "RATED" || r.type === "POPULAR")
      .slice(0, 4)
      .map((r: any) => ({
        rank: r.rank,
        context: r.context,
        allTime: !!r.allTime,
      })),
    externalLinks: (m.externalLinks ?? []).map((l: any) => ({
      site: l.site,
      url: l.url,
      color: l.color,
      type: l.type,
    })),
    streamingEpisodes: (m.streamingEpisodes ?? []).map((e: any) => ({
      title: e.title,
      url: e.url,
      site: e.site,
      thumbnail: e.thumbnail,
    })),
    trailer: m.trailer?.id ? { id: m.trailer.id, site: m.trailer.site } : null,
    relations: (m.relations?.edges ?? [])
      .filter((e: any) => e.node.type === "ANIME" && !e.node.isAdult)
      .map((e: any) => ({
        relationType: String(e.relationType).replace(/_/g, " "),
        anime: mapCard(e.node),
      })),
    recommendations: (m.recommendations?.nodes ?? [])
      .map((n: any) => n.mediaRecommendation)
      .filter((rec: any) => Boolean(rec && !rec.isAdult))
      .map(mapCard),
    characters: (m.characters?.edges ?? []).map((e: any) => {
      const va = e.voiceActors?.[0];
      return {
        role: e.role,
        id: e.node.id,
        name: e.node.name.full,
        image: e.node.image?.medium ?? null,
        voiceActor: va
          ? { id: va.id, name: va.name.full, image: va.image?.medium ?? null }
          : null,
      };
    }),
    staff: (m.staff?.edges ?? []).map((e: any) => ({
      role: e.role,
      id: e.node.id,
      name: e.node.name.full,
      image: e.node.image?.medium ?? null,
    })),
  };
});

const themeCache = new Map<number, { at: number; themes: AnimeTheme[] }>();
const THEME_TTL = 3600_000;

/** Returns null when AnimeThemes is unreachable, [] when it has no entries. */
export async function getThemes(anilistId: number): Promise<AnimeTheme[] | null> {
  const hit = themeCache.get(anilistId);
  if (hit && Date.now() - hit.at < THEME_TTL) return hit.themes;
  const themes = await fetchThemes(anilistId);
  // only cache successful lookups so transient failures aren't remembered
  if (themes) {
    if (themeCache.size > 500) themeCache.clear();
    themeCache.set(anilistId, { at: Date.now(), themes });
  }
  return themes;
}

async function fetchThemes(anilistId: number): Promise<AnimeTheme[] | null> {
  const url =
    "https://api.animethemes.moe/anime?filter[has]=resources&filter[site]=AniList" +
    `&filter[external_id]=${anilistId}` +
    "&include=animethemes.song.artists,animethemes.animethemeentries.videos.audio";
  try {
    const res = await fetch(url, {
      headers: { Accept: "application/json", "User-Agent": "Kuroiru/1.0 (anime tracker)" },
      cache: "no-store",
      signal: AbortSignal.timeout(12000),
    });
    if (!res.ok) return null;
    const json = await res.json();
    const anime = json.anime?.[0];
    if (!anime) return [];
    return (anime.animethemes ?? []).map((t: any): AnimeTheme => {
      const entry = t.animethemeentries?.[0];
      const videos = (t.animethemeentries ?? [])
        .flatMap((e: any) => e.videos ?? [])
        .map((v: any) => ({
          link: v.link,
          audio: v.audio?.link ?? null,
          resolution: v.resolution ?? null,
          tags: v.tags ?? "",
        }));
      return {
        id: t.id,
        slug: t.slug,
        type: t.type,
        title: t.song?.title ?? "Unknown",
        artists: (t.song?.artists ?? []).map((a: any) => a.name),
        episodes: entry?.episodes ?? null,
        videos,
      };
    });
  } catch {
    return null;
  }
}
