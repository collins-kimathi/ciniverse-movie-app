# Ciniverse Movie App

Ciniverse is a React + Vite movie discovery app powered by TMDB.  
It includes a cinematic home page, popular movies, anime movies, search, movie detail modals, watch provider links, and skeleton loaders.

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
  - Overview, rating, runtime, trailer (YouTube), and US watch providers
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
```

You can use either variable. If `VITE_TMDB_BEARER_TOKEN` is set, it is used automatically.

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
- Watch provider data in the modal is shown for `US` region.

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

## if you find this repo good please star it 