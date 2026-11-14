export type AniZipEpisode = {
  episode: string; // "1", "2", "S1"...
  episodeNumber?: number;
  seasonNumber?: number;
  absoluteEpisodeNumber?: number;
  title?: Record<string, string>;
  overview?: string;
  summary?: string;
  image?: string;
  airDateUtc?: string;
  airdate?: string;
  runtime?: number;
  length?: number;
  rating?: string;
  finaleType?: string;
};

export type AniZipData = {
  titles?: Record<string, string>;
  episodes?: Record<string, AniZipEpisode>;
  episodeCount?: number;
  specialCount?: number;
  images?: { coverType: "Banner" | "Poster" | "Fanart" | "Clearlogo"; url: string }[];
  mappings?: {
    mal_id?: number | null;
    kitsu_id?: number | null;
    anilist_id?: number;
    anidb_id?: number | null;
    thetvdb_id?: number | null;
    imdb_id?: string | null;
    themoviedb_id?: string | null;
    livechart_id?: number | null;
    anisearch_id?: number | null;
    animeplanet_id?: string | null;
  };
};

const cache = new Map<number, Promise<AniZipData | null>>();

/** Cached per id. Failed lookups are evicted so a later call can retry. */
export function getAniZip(anilistId: number): Promise<AniZipData | null> {
  let p = cache.get(anilistId);
  if (!p) {
    p = fetch(`https://api.ani.zip/mappings?anilist_id=${anilistId}`, {
      signal: AbortSignal.timeout(10000),
    })
      .then((r) => (r.ok ? (r.json() as Promise<AniZipData>) : null))
      .catch(() => null)
      .then((d) => {
        if (!d || typeof d !== "object") {
          cache.delete(anilistId);
          return null;
        }
        return d;
      });
    cache.set(anilistId, p);
  }
  return p;
}

export function splitEpisodes(data: AniZipData) {
  const all = Object.values(data.episodes ?? {});
  const main = all
    .filter((e) => /^\d+$/.test(e.episode))
    .sort((a, b) => Number(a.episode) - Number(b.episode));
  const specials = all.filter((e) => !/^\d+$/.test(e.episode));
  return { main, specials };
}

export const pickImage = (d: AniZipData | null | undefined, type: string) =>
  d?.images?.find((i) => i.coverType === type)?.url;

export function mappingLinks(d: AniZipData | null | undefined) {
  const m = d?.mappings;
  if (!m) return [];
  const out: { name: string; url: string }[] = [];
  if (m.mal_id) out.push({ name: "MyAnimeList", url: `https://myanimelist.net/anime/${m.mal_id}` });
  if (m.kitsu_id) out.push({ name: "Kitsu", url: `https://kitsu.app/anime/${m.kitsu_id}` });
  if (m.anidb_id) out.push({ name: "AniDB", url: `https://anidb.net/anime/${m.anidb_id}` });
  if (m.anisearch_id) out.push({ name: "aniSearch", url: `https://www.anisearch.com/anime/${m.anisearch_id}` });
  if (m.livechart_id) out.push({ name: "LiveChart", url: `https://www.livechart.me/anime/${m.livechart_id}` });
  if (m.animeplanet_id) out.push({ name: "Anime-Planet", url: `https://www.anime-planet.com/anime/${m.animeplanet_id}` });
  if (m.imdb_id) out.push({ name: "IMDb", url: `https://www.imdb.com/title/${m.imdb_id}` });
  if (m.themoviedb_id) out.push({ name: "TMDB", url: `https://www.themoviedb.org/tv/${m.themoviedb_id}` });
  if (m.thetvdb_id) out.push({ name: "TheTVDB", url: `https://thetvdb.com/dereferrer/series/${m.thetvdb_id}` });
  return out;
}
