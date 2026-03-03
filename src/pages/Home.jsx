// Page component for the Home view and its data wiring.
import { useEffect, useMemo, useState } from "react";
import {
  fetchByGenre,
  fetchLatestReleases,
  fetchTrending,
  fetchTopRated,
} from "../api/tmdb";
import HeroFeatured from "../components/HeroFeatured";
import MovieRowSlider from "../components/MovieRowSlider";
import MovieModal from "../components/MovieModal";
import SkeletonRow from "../components/SkeletonRow";
import SectionError from "../components/SectionError";
import useMovies from "../hooks/useMovies";
import { GENRE_SECTIONS } from "../config/genres";
import { applyFilters } from "../utils/filters";

// Merge paginated/parallel TMDB responses and keep the first item per TMDB id.
function mergeUnique(...lists) {
  const byId = new Map();
  lists.flat().forEach((movie) => {
    if (movie?.id && !byId.has(movie.id)) {
      byId.set(movie.id, movie);
    }
  });
  return Array.from(byId.values());
}

// Reusable genre rail with its own loading/error lifecycle.
function GenreRail({ section, filters, onSelect, onOpenGenre }) {
  const { movies, loading, error, retry } = useMovies(
    async () => {
      const data = await fetchByGenre(section.genreId, 1);
      return data.results || [];
    },
    [section.genreId],
    { errorMessage: `Could not load ${section.title}.` }
  );

  const filtered = useMemo(() => applyFilters(movies, filters), [movies, filters]);

  if (loading) {
    return <SkeletonRow title={section.title} />;
  }

  if (error) {
    return <SectionError message={error} onRetry={retry} />;
  }

  return (
    <MovieRowSlider
      title={section.title}
      movies={filtered}
      onSelect={onSelect}
      emptyMessage={section.emptyMessage}
      onTitleClick={() => onOpenGenre(section)}
    />
  );
}

export default function Home({
  onOpenGenre = () => {},
  watchTarget = null,
  onConsumeWatchTarget = () => {},
}) {
  const HERO_ROTATE_MS = 8000;
  const [selected, setSelected] = useState(null);
  const [activeHeroIndex, setActiveHeroIndex] = useState(0);
  const [heroTick, setHeroTick] = useState(0);
  const [filters, setFilters] = useState({
    year: "all",
    minRating: 0,
    language: "all",
  });

  const {
    movies: trending,
    loading: trendingLoading,
    error: trendingError,
    retry: retryTrending,
  } = useMovies(
    async () => {
      const [page1, page2] = await Promise.all([fetchTrending(1), fetchTrending(2)]);
      return mergeUnique(page1.results || [], page2.results || []);
    },
    [],
    { errorMessage: "Could not load trending movies." }
  );

  const {
    movies: topRated,
    loading: topRatedLoading,
    error: topRatedError,
    retry: retryTopRated,
  } = useMovies(
    async () => {
      const [page1, page2] = await Promise.all([fetchTopRated(1), fetchTopRated(2)]);
      return mergeUnique(page1.results || [], page2.results || []);
    },
    [],
    { errorMessage: "Could not load top rated movies." }
  );

  const {
    movies: latestReleases,
    loading: latestLoading,
    error: latestError,
    retry: retryLatest,
  } = useMovies(
    async () => {
      const [page1, page2] = await Promise.all([fetchLatestReleases(1), fetchLatestReleases(2)]);
      return mergeUnique(page1.results || [], page2.results || []);
    },
    [],
    { errorMessage: "Could not load latest releases." }
  );

  useEffect(() => {
    // Open modal from deep link/watch-target state and consume it once handled.
    if (!watchTarget) {
      return;
    }
    setSelected({ id: watchTarget.id, mediaType: watchTarget.mediaType });
    onConsumeWatchTarget();
  }, [watchTarget, onConsumeWatchTarget]);

  const filteredTrending = useMemo(() => applyFilters(trending, filters), [trending, filters]);
  const filteredTopRated = useMemo(() => applyFilters(topRated, filters), [topRated, filters]);
  const filteredLatestReleases = useMemo(
    () => applyFilters(latestReleases, filters),
    [latestReleases, filters]
  );

  const topTwentyMovies = useMemo(() => {
    // Build a deduplicated hero pool from top "trending + top rated" titles.
    const byId = new Map();
    [...filteredTrending, ...filteredTopRated].forEach((movie) => {
      if (movie?.id && !byId.has(movie.id)) {
        byId.set(movie.id, movie);
      }
    });
    return Array.from(byId.values()).slice(0, 20);
  }, [filteredTrending, filteredTopRated]);

  useEffect(() => {
    // Rotate hero automatically while we have enough candidates to cycle.
    if (topTwentyMovies.length <= 1) {
      setActiveHeroIndex(0);
      setHeroTick(0);
      return;
    }

    setHeroTick((value) => value + 1);
    const interval = window.setInterval(() => {
      setActiveHeroIndex((current) => (current + 1) % topTwentyMovies.length);
      setHeroTick((value) => value + 1);
    }, HERO_ROTATE_MS);

    return () => window.clearInterval(interval);
  }, [topTwentyMovies, HERO_ROTATE_MS]);

  const heroMovie = useMemo(
    () => topTwentyMovies[activeHeroIndex] || filteredTrending[0] || filteredTopRated[0],
    [activeHeroIndex, topTwentyMovies, filteredTrending, filteredTopRated]
  );

  return (
    <main className="main">
      <HeroFeatured
        movie={heroMovie}
        onPlay={setSelected}
        rotateMs={HERO_ROTATE_MS}
        tick={heroTick}
      />

      {trendingLoading ? <SkeletonRow title="Trending This Week" /> : null}
      {trendingError ? <SectionError message={trendingError} onRetry={retryTrending} /> : null}
      {!trendingLoading && !trendingError ? (
        <MovieRowSlider
          title="Trending This Week"
          movies={filteredTrending}
          onSelect={setSelected}
          emptyMessage="No trending movies found."
        />
      ) : null}

      {topRatedLoading ? <SkeletonRow title="Top Rated" /> : null}
      {topRatedError ? <SectionError message={topRatedError} onRetry={retryTopRated} /> : null}
      {!topRatedLoading && !topRatedError ? (
        <MovieRowSlider
          title="Top Rated"
          movies={filteredTopRated}
          onSelect={setSelected}
          emptyMessage="No top rated movies found."
        />
      ) : null}

      {latestLoading ? <SkeletonRow title="Latest Releases" /> : null}
      {latestError ? <SectionError message={latestError} onRetry={retryLatest} /> : null}
      {!latestLoading && !latestError ? (
        <MovieRowSlider
          title="Latest Releases"
          movies={filteredLatestReleases}
          onSelect={setSelected}
          emptyMessage="No latest releases found."
        />
      ) : null}

      {GENRE_SECTIONS.map((section) => (
        <GenreRail
          key={section.key}
          section={section}
          filters={filters}
          onSelect={setSelected}
          onOpenGenre={onOpenGenre}
        />
      ))}

      {selected ? <MovieModal movie={selected} onClose={() => setSelected(null)} /> : null}
    </main>
  );
}
