export const FORMAT_LABELS: Record<string, string> = {
  TV: "TV",
  TV_SHORT: "TV Short",
  MOVIE: "Movie",
  SPECIAL: "Special",
  OVA: "OVA",
  ONA: "ONA",
  MUSIC: "Music",
};

export function titleCase(s: string | null | undefined) {
  if (!s) return "";
  return s
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export function formatLabel(f: string | null) {
  return f ? (FORMAT_LABELS[f] ?? titleCase(f)) : "";
}

export function airStatusColor(status: string | null) {
  switch (status) {
    case "RELEASING":
      return "#00ff00";
    case "FINISHED":
      return "#9d9d9d";
    case "NOT_YET_RELEASED":
      return "#ffd0ad";
    case "CANCELLED":
      return "#ff7a6d";
    default:
      return "#bbdbdf";
  }
}

export function countdown(unixSeconds: number, now = Date.now()) {
  const diff = unixSeconds * 1000 - now;
  if (diff <= 0) return "aired";
  const d = Math.floor(diff / 86400000);
  const h = Math.floor((diff % 86400000) / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  if (d > 0) return `${d}d ${h}h`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

export function timeAgo(ms: number) {
  const s = Math.floor((Date.now() - ms) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}
