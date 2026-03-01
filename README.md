# Ciniverse Movie App

Ciniverse is a React + Vite movie discovery app powered by TMDB.  
It includes a cinematic home page, popular movies, anime movies, search, movie detail modals, licensed in-app playback, and skeleton loaders.

## Features

- Home page with:
  - Featured rotating hero
  - Trending, Top Rated, and Popular rows
- Popular page:
  - Grid of popular movies
  - `More Movies +` button to load additional pages
- Anime page:
  - Anime-focused movie listing from TMDB discover filters
- Search page:
  - Search movies by title
- Movie details modal:
  - Overview, rating, runtime, trailer (YouTube), licensed in-app playback, and licensed provider listing
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

```

You can use either variable. If `VITE_TMDB_BEARER_TOKEN` is set, it is used automatically.
Full-movie playback works only from your licensed backend.

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
- SEO defaults in `index.html`, `public/robots.txt`, and `public/sitemap.xml` use `https://ciniverse.top`; replace that domain if your deployed URL is different.

## Scripts

- `npm run dev` - Run local dev server
- `npm run build` - Production build
- `npm run preview` - Preview production build

## Folder Highlights

- `src/api/tmdb.js` - TMDB request helpers and endpoints
- `src/pages/` - Top-level pages (`Home`, `Popular`, `Anime`, `Search`)
- `src/components/` - UI components (navbar, cards, modal, skeletons, footer)
- `src/hooks/useMovies.js` - Shared async movie loading hook

## Credits

- Data and images provided by [TMDB](https://www.themoviedb.org/).

## created by 
collins-kimathi

## if you find this repo good please star it.
