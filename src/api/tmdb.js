const BASE_URL = "https://api.themoviedb.org/3";
const API_KEY = import.meta.env.VITE_TMDB_API_KEY || "";
const BEARER_TOKEN = import.meta.env.VITE_TMDB_BEARER_TOKEN || "";

export const IMG_BASE = "https://image.tmdb.org/t/p/w500";

// Use bearer auth when present, otherwise fallback to query API key.
function createUrl(path) {
  if (BEARER_TOKEN) {
    return `${BASE_URL}${path}`;
  }

  const separator = path.includes("?") ? "&" : "?";
  return `${BASE_URL}${path}${separator}api_key=${API_KEY}`;
}

// Attach auth headers only for bearer-token mode.
function createOptions() {
  if (!BEARER_TOKEN) {
    return undefined;
  }

  return {
    headers: {
      accept: "application/json",
      Authorization: `Bearer ${BEARER_TOKEN}`,
    },
  };
}

// Shared request wrapper for TMDB endpoints.
async function request(path) {
  const response = await fetch(createUrl(path), createOptions());

  if (!response.ok) {
    throw new Error(`TMDB request failed: ${response.status}`);
  }

  return response.json();
}

export const fetchTrending = (page = 1) =>
  request(`/trending/movie/week?page=${page}`);
export const fetchPopular = (page = 1) => request(`/movie/popular?page=${page}`);
export const fetchTopRated = (page = 1) =>
  request(`/movie/top_rated?page=${page}`);
export const searchMovies = (query) =>
  request(`/search/movie?query=${encodeURIComponent(query)}`);
export const fetchMovieDetails = (id) =>
  request(`/movie/${id}?append_to_response=videos,credits`);
export const fetchWatchProviders = (id) => request(`/movie/${id}/watch/providers`);
