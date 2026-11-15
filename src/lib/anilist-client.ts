import type { WatchEntry, WatchStatus } from "./types";

const ENDPOINT = "https://graphql.anilist.co";

export class AnilistAuthError extends Error {
  constructor(message = "AniList session expired. Please reconnect your account.") {
    super(message);
    this.name = "AnilistAuthError";
  }
}

async function request(token: string, query: string, variables: Record<string, unknown> = {}) {
  for (let attempt = 0; attempt < 3; attempt++) {
    const res = await fetch(ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ query, variables }),
      signal: AbortSignal.timeout(12000),
    });

    if (res.status === 401) {
      throw new AnilistAuthError();
    }

    if (res.status === 429 && attempt < 2) {
      const retryAfter = Number(res.headers.get("retry-after"));
      const waitMs = Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter * 1000 : 2500;
      await new Promise((r) => setTimeout(r, Math.min(waitMs, 60000)));
      continue;
    }

    const json = await res.json().catch(() => null);
    if (json?.errors) {
      const msg = json.errors[0]?.message ?? "AniList error";
      if (/invalid token|unauthenticated/i.test(msg)) {
        throw new AnilistAuthError();
      }
      throw new Error(msg);
    }
    if (!res.ok) throw new Error(`AniList request failed (${res.status})`);
    return json?.data;
  }
  throw new Error("AniList rate limit exceeded. Try again shortly.");
}

export interface AnilistUser {
  id: number;
  name: string;
  avatar: string | null;
}

export async function fetchViewer(token: string): Promise<AnilistUser> {
  const d = await request(token, `query{Viewer{id name avatar{medium}}}`);
  if (!d?.Viewer) throw new AnilistAuthError("Invalid AniList token");
  return { id: d.Viewer.id, name: d.Viewer.name, avatar: d.Viewer.avatar?.medium ?? null };
}

export async function saveRemoteEntry(
  token: string,
  e: { animeId: number; status: WatchStatus; progress: number; score: number; scoreRaw?: number },
) {
  const scoreRaw = e.scoreRaw !== undefined ? e.scoreRaw : e.score * 10;
  await request(
    token,
    `mutation($mediaId:Int,$status:MediaListStatus,$progress:Int,$scoreRaw:Int){
      SaveMediaListEntry(mediaId:$mediaId,status:$status,progress:$progress,scoreRaw:$scoreRaw){ id }
    }`,
    {
      mediaId: e.animeId,
      status: e.status,
      progress: e.progress,
      scoreRaw,
    },
  );
}

export async function deleteRemoteEntry(token: string, animeId: number) {
  const d = await request(token, `query($id:Int){Media(id:$id){mediaListEntry{id}}}`, {
    id: animeId,
  });
  const entryId = d?.Media?.mediaListEntry?.id;
  if (entryId) {
    await request(token, `mutation($id:Int){DeleteMediaListEntry(id:$id){deleted}}`, {
      id: entryId,
    });
  }
}

export async function importRemoteList(token: string, userId: number): Promise<WatchEntry[]> {
  const d = await request(
    token,
    `query($userId:Int){
      MediaListCollection(userId:$userId,type:ANIME){
        lists {
          isCustomList
          entries {
            status progress scoreRaw updatedAt
            media { id format episodes title { romaji english } coverImage { large } }
          }
        }
      }
    }`,
    { userId },
  );
  const byId = new Map<number, WatchEntry>();
  for (const list of d?.MediaListCollection?.lists ?? []) {
    if (list.isCustomList) continue;
    for (const e of list.entries ?? []) {
      if (!e?.media?.id) continue;
      const raw = e.scoreRaw ?? 0;
      const updatedAt = e.updatedAt ? e.updatedAt * 1000 : 0;
      const prev = byId.get(e.media.id);
      if (prev && prev.updatedAt >= updatedAt) continue;
      byId.set(e.media.id, {
        animeId: e.media.id,
        status: e.status as WatchStatus,
        progress: e.progress ?? 0,
        score: Math.round(raw / 10),
        scoreRaw: raw,
        title: e.media.title.english || e.media.title.romaji || "Untitled",
        cover: e.media.coverImage?.large ?? "",
        format: e.media.format ?? null,
        episodes: e.media.episodes ?? null,
        updatedAt,
      });
    }
  }
  return [...byId.values()];
}

export function oauthUrl(clientId: string) {
  return `https://anilist.co/api/v2/oauth/authorize?client_id=${encodeURIComponent(
    clientId,
  )}&response_type=token`;
}
