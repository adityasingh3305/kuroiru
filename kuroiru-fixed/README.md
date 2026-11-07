# Kuroiru

Anime tracker and database built with Next.js. No database is required.

- Anime data comes from AniList and AnimeThemes (public APIs).
- Your watchlist and comments are stored in your browser's localStorage.
- Optional AniList sign-in syncs your list with your AniList account.

## Run

    npm install
    npm run dev

Optional: set `NEXT_PUBLIC_ANILIST_CLIENT_ID` in `.env.local` to enable AniList sign-in.
