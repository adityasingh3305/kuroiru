/* Browser-side AniList helpers (direct sync with the user's token). */
import type { WatchEntry, WatchStatus } from "./types";

const ENDPOINT = "https://graphql.anilist.co";

async function request(token: string, query: string, variables: Record<string, unknown> = {}) {
  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ query, variables }),
  });
  const json = await res.json().catch(() => null);
  if (!res.ok && !json?.errors) throw new Error(`AniList request failed (${res.status})`);
  if (json?.errors) throw new Error(json.errors[0]?.message ?? "AniList error");
  return json?.data;
}

export interface AnilistUser {
  id: number;
  name: string;
  avatar: string | null;
}

export async function fetchViewer(token: string): Promise<AnilistUser> {
  const d = await request(token, `query{Viewer{id name avatar{medium}}}`);
  if (!d?.Viewer) throw new Error("Invalid AniList token");
  return { id: d.Viewer.id, name: d.Viewer.name, avatar: d.Viewer.avatar?.medium ?? null };
}

export async function saveRemoteEntry(
  token: string,
  e: { animeId: number; status: WatchStatus; progress: number; score: number },
) {
  await request(
    token,
    `mutation($mediaId:Int,$status:MediaListStatus,$progress:Int,$scoreRaw:Int){
      SaveMediaListEntry(mediaId:$mediaId,status:$status,progress:$progress,scoreRaw:$scoreRaw){ id }
    }`,
    {
      mediaId: e.animeId,
      status: e.status,
      progress: e.progress,
      scoreRaw: e.score * 10,
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
        lists { entries {
          status progress scoreRaw updatedAt
          media { id format episodes title { romaji english } coverImage { large } }
        } }
      }
    }`,
    { userId },
  );
  const out: WatchEntry[] = [];
  for (const list of d?.MediaListCollection?.lists ?? []) {
    for (const e of list.entries) {
      const status: WatchStatus = e.status === "REPEATING" ? "CURRENT" : e.status;
      out.push({
        animeId: e.media.id,
        status,
        progress: e.progress ?? 0,
        score: Math.round((e.scoreRaw ?? 0) / 10),
        title: e.media.title.english || e.media.title.romaji,
        cover: e.media.coverImage?.large ?? "",
        format: e.media.format ?? null,
        episodes: e.media.episodes ?? null,
        updatedAt: (e.updatedAt ?? 0) * 1000 || Date.now(),
      });
    }
  }
  return out;
}

export function oauthUrl(clientId: string) {
  return `https://anilist.co/api/v2/oauth/authorize?client_id=${encodeURIComponent(
    clientId,
  )}&response_type=token`;
}
