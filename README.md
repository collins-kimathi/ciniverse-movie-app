# Ciniverse Movie App

Ciniverse is a React + Vite movie discovery app powered by TMDB.  
It includes a cinematic home page, trending/top/latest releases, search, movie detail modals, licensed in-app playback, shared ReelNotes, and rating counts.

## Features

- Home page with:
  - Featured rotating hero
  - Trending, Top Rated, Latest Releases, and genre rows
- Popular page:
  - Grid of popular movies
  - `More Movies +` button to load additional pages
- Anime page:
  - Anime-focused movie listing from TMDB discover filters
- Search page:
  - Search movies by title
- Movie details modal:
  - Overview, runtime, trailer (YouTube), licensed in-app playback, and licensed provider listing
  - ReelNotes: shared notes and shared rating counts
- Global footer
- Skeleton loading UI for smoother page loading

## Tech Stack

- React
- Vite
- Plain CSS
- TMDB API

## Project Setup

1. Install dependencies:

```bash
npm install
```

2. Create a `.env.local` file in the project root:

```env
# Option 1: API key auth
VITE_TMDB_API_KEY=your_tmdb_api_key

# Option 2: Bearer token auth (preferred)
VITE_TMDB_BEARER_TOKEN=your_tmdb_bearer_token

# Licensed playback API (required for full-movie streaming)
VITE_PLAYBACK_API_BASE_URL=http://localhost:4000

# Optional shared key sent as x-api-key header to your backend
VITE_PLAYBACK_API_KEY=your_playback_api_key

# Optional: override provider badges shown in the modal
# Format: Provider Name|https://provider-url,Another Provider|https://url
VITE_LICENSED_PROVIDERS=Netflix|https://www.netflix.com,Prime Video|https://www.primevideo.com

# Community API (optional override). If empty, frontend calls same-origin /api routes.
# VITE_COMMUNITY_API_BASE_URL=https://your-api-domain.com

# Optional persistent store for Vercel /api community endpoints (recommended in production)
UPSTASH_REDIS_REST_URL=your_upstash_redis_rest_url
UPSTASH_REDIS_REST_TOKEN=your_upstash_redis_rest_token

```

You can use either variable. If `VITE_TMDB_BEARER_TOKEN` is set, it is used automatically.
Full-movie playback works only from your licensed backend.
Shared notes/ratings work from the Community API endpoints.

### Licensed playback endpoint contract

Frontend call:

- `GET /v1/playback/movie/:tmdbMovieId`

Expected JSON response:

```json
{
  "provider": "Mux",
  "region": "US",
  "expiresAt": "2026-03-01T12:00:00Z",
  "playback": {
    "type": "iframe",
    "src": "https://player.mux.com/your_signed_playback_id"
  }
}
```

Notes:

- Return `404` (or `204`) if the movie is not licensed for playback.
- `playback.type` can be `iframe`, `hls`, `dash`, or `mp4`.
- Your backend should enforce entitlement, region, and expiration checks before returning stream URLs.

### Community API endpoint contract (Vercel /api)

Frontend reads/writes (same origin by default):

- `GET /api/v1/community/:mediaType/:id`
- `POST /api/v1/community/:mediaType/:id/notes`
- `POST /api/v1/community/:mediaType/:id/ratings`

Example note request:

```json
{
  "text": "This one has great pacing.",
  "author": "ReelNotes User"
}
```

Example rating request:

```json
{
  "rating": 5
}
```

3. Start development server:

```bash
npm run dev
```

4. Build for production:

```bash
npm run build
```

5. Preview production build:

```bash
npm run preview
```

## Available Routes / Views

- `Home`
- `Popular`
- `Anime`
- `Search` (triggered from navbar search)

Navigation is handled in-app via the top navbar.

## Environment Notes

- The app uses TMDB image base path `https://image.tmdb.org/t/p/w500`.
- Full-movie playback comes from your licensed playback backend.
- Licensed provider badges come from `VITE_LICENSED_PROVIDERS` (or built-in defaults).
- SEO defaults in `index.html`, `public/robots.txt`, and `public/sitemap.xml` are set to `https://ciniverse-movie-app.vercel.app`.
- For production shared community data, configure `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`. Without them, Vercel /api uses in-memory fallback (not durable).

## Scripts

- `npm run dev` - Run local dev server
- `npm run build` - Production build
- `npm run preview` - Preview production build
- `npm run community:api` - Run local shared Community API

## Folder Highlights

- `src/api/tmdb.js` - TMDB request helpers and endpoints
- `src/api/community.js` - Shared community notes + rating counts API client
- `api/v1/community/` - Vercel serverless routes for shared notes/ratings
- `api/_lib/communityStore.js` - Shared store adapter (Upstash or in-memory fallback)
- `server/community-api.mjs` - Minimal Node API server for shared notes and ratings
- `src/pages/` - Top-level pages (`Home`, `Popular`, `Anime`, `Search`)
- `src/components/` - UI components (navbar, cards, modal, skeletons, footer)
- `src/hooks/useMovies.js` - Shared async movie loading hook

## Credits

- Data and images provided by [TMDB](https://www.themoviedb.org/).

## created by 
collins-kimathi

## if you find this repo good please star it.
