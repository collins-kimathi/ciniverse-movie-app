// Frontend API client helpers for tmdb.
const env = import.meta.env || {};
const TMDB_API_BASE_URL = (env.VITE_TMDB_API_BASE_URL || "/api/tmdb").replace(/\/$/, "");

export const IMG_BASE = "https://image.tmdb.org/t/p/w500";

export function normalizePlayableSearchResults(results = []) {
  const seen = new Set();
  return results
    .filter((item) => item?.id && (item.media_type === "movie" || item.media_type === "tv"))
    .map((item) => ({
      ...item,
      mediaType: item.media_type === "tv" ? "tv" : "movie",
    }))
    .filter((item) => {
      const key = `${item.mediaType}:${item.id}`;
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
}

function createUrl(path) {
  const params = new URLSearchParams({ path });
  return `${TMDB_API_BASE_URL}?${params.toString()}`;
}

// Shared request wrapper for TMDB endpoints.
async function request(path) {
  const response = await fetch(createUrl(path));

  if (!response.ok) {
    let message = `TMDB request failed: ${response.status}`;
    try {
      const payload = await response.json();
      if (typeof payload?.error === "string" && payload.error) {
        message = payload.error;
      }
    } catch {
      // Keep the generic HTTP message when the response is not JSON.
    }
    throw new Error(message);
  }

  return response.json();
}

export const fetchTrending = (page = 1) =>
  request(`/trending/movie/week?page=${page}`);
export const fetchPopular = (page = 1) =>
  request(`/movie/popular?page=${page}`);
export const fetchTopRated = (page = 1) =>
  request(`/movie/top_rated?page=${page}`);
export const fetchLatestReleases = (page = 1) => {
  const today = new Date().toISOString().slice(0, 10);
  return request(
    `/discover/movie?include_adult=false&include_video=false&sort_by=primary_release_date.desc&primary_release_date.lte=${today}&page=${page}`
  );
};
export const fetchPopularShows = (page = 1) =>
  request(`/tv/popular?page=${page}`);
export const fetchAnime = (page = 1) =>
  request(
    `/discover/movie?include_adult=false&include_video=false&sort_by=popularity.desc&with_genres=16&with_origin_country=JP&page=${page}`,
  );
export const fetchByGenre = (genreId, page = 1) =>
  request(
    `/discover/movie?include_adult=false&include_video=false&sort_by=popularity.desc&with_genres=${genreId}&page=${page}`,
  );
export const searchPlayableTitles = async (query) => {
  const data = await request(
    `/search/multi?include_adult=false&page=1&query=${encodeURIComponent(query)}`
  );
  return {
    ...data,
    results: normalizePlayableSearchResults(data.results || []),
  };
};
export const searchPlayableSuggestions = searchPlayableTitles;
export const searchMovies = searchPlayableTitles;
export const searchMovieSuggestions = searchPlayableSuggestions;
export const fetchMovieDetails = (id) =>
  request(`/movie/${id}?append_to_response=videos,credits`);
export const fetchShowDetails = (id) =>
  request(`/tv/${id}?append_to_response=videos,credits`);
export const fetchMovieVideos = (id) =>
  request(`/movie/${id}/videos`);
export const fetchShowVideos = (id) =>
  request(`/tv/${id}/videos`);
export const fetchSimilarMovies = (id) =>
  request(`/movie/${id}/similar?page=1`);
export const fetchSimilarShows = (id) =>
  request(`/tv/${id}/similar?page=1`);
