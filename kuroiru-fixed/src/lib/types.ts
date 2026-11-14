export type WatchStatus =
  | "CURRENT"
  | "REPEATING"
  | "PLANNING"
  | "COMPLETED"
  | "PAUSED"
  | "DROPPED";

export const WATCH_STATUSES: {
  value: WatchStatus;
  label: string;
  color: string;
}[] = [
  { value: "CURRENT", label: "Watching", color: "#96ca8e" },
  { value: "REPEATING", label: "Rewatching", color: "#7fd1ae" },
  { value: "PLANNING", label: "Planned", color: "#ffd0ad" },
  { value: "COMPLETED", label: "Completed", color: "#bbdbdf" },
  { value: "PAUSED", label: "On hold", color: "#c9b6ff" },
  { value: "DROPPED", label: "Dropped", color: "#ff7a6d" },
];

export interface AnimeSummary {
  id: number;
  title: string;
  romaji: string;
  english: string | null;
  native: string | null;
  cover: string;
  color: string | null;
  banner: string | null;
  format: string | null;
  year: number | null;
  season: string | null;
  episodes: number | null;
  status: string | null;
  score: number | null;
  genres: string[];
  description: string | null;
  nextAiring: { episode: number; airingAt: number } | null;
  rank?: number;
}

export interface ScheduleItem {
  airingAt: number;
  episode: number;
  anime: AnimeSummary;
}

export interface CharacterEdge {
  role: string;
  id: number;
  name: string;
  image: string | null;
  voiceActor: { id: number; name: string; image: string | null } | null;
}

export interface StaffEdge {
  role: string;
  id: number;
  name: string;
  image: string | null;
}

export interface RelationEdge {
  relationType: string;
  anime: AnimeSummary;
}

export interface AnimeDetail extends AnimeSummary {
  synonyms: string[];
  duration: number | null;
  source: string | null;
  startDate: string | null;
  endDate: string | null;
  popularity: number | null;
  favourites: number | null;
  meanScore: number | null;
  studios: string[];
  tags: { name: string; rank: number }[];
  rankings: { rank: number; context: string; allTime: boolean }[];
  externalLinks: { site: string; url: string; color: string | null; type: string | null }[];
  streamingEpisodes: { title: string; url: string; site: string; thumbnail: string | null }[];
  trailer: { id: string; site: string } | null;
  siteUrl: string | null;
  relations: RelationEdge[];
  recommendations: AnimeSummary[];
  characters: CharacterEdge[];
  staff: StaffEdge[];
}

export interface ThemeVideo {
  link: string;
  audio: string | null;
  resolution: number | null;
  tags: string;
}

export interface AnimeTheme {
  id: number;
  slug: string;
  type: string;
  title: string;
  artists: string[];
  episodes: string | null;
  videos: ThemeVideo[];
}

export interface WatchEntry {
  animeId: number;
  status: WatchStatus;
  progress: number;
  score: number;
  scoreRaw?: number;
  title: string;
  cover: string;
  format: string | null;
  episodes: number | null;
  updatedAt: number;
}

export const GENRES = [
  "Action",
  "Adventure",
  "Comedy",
  "Drama",
  "Ecchi",
  "Fantasy",
  "Horror",
  "Mahou Shoujo",
  "Mecha",
  "Music",
  "Mystery",
  "Psychological",
  "Romance",
  "Sci-Fi",
  "Slice of Life",
  "Sports",
  "Supernatural",
  "Thriller",
];

export const FORMATS = ["TV", "TV_SHORT", "MOVIE", "SPECIAL", "OVA", "ONA", "MUSIC"];
export const SEASONS = ["WINTER", "SPRING", "SUMMER", "FALL"];
export const AIR_STATUSES = ["RELEASING", "FINISHED", "NOT_YET_RELEASED", "CANCELLED", "HIATUS"];
export const SORTS: { value: string; label: string }[] = [
  { value: "POPULARITY_DESC", label: "Popularity" },
  { value: "TRENDING_DESC", label: "Trending" },
  { value: "SCORE_DESC", label: "Score" },
  { value: "START_DATE_DESC", label: "Newest" },
  { value: "FAVOURITES_DESC", label: "Favourites" },
  { value: "TITLE_ROMAJI", label: "Title" },
];
