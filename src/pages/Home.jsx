import { useEffect, useMemo, useState } from "react";
import {
  fetchByGenre,
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

function mergeUnique(...lists) {
  const byId = new Map();
  lists.flat().forEach((movie) => {
    if (movie?.id && !byId.has(movie.id)) {
      byId.set(movie.id, movie);
    }
  });
  return Array.from(byId.values());
}

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
  const [showMoreFilters, setShowMoreFilters] = useState(false);

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

  useEffect(() => {
    if (!watchTarget) {
      return;
    }
    setSelected({ id: watchTarget.id, mediaType: watchTarget.mediaType });
    onConsumeWatchTarget();
  }, [watchTarget, onConsumeWatchTarget]);

  const filteredTrending = useMemo(() => applyFilters(trending, filters), [trending, filters]);
  const filteredTopRated = useMemo(() => applyFilters(topRated, filters), [topRated, filters]);

  const topTwentyMovies = useMemo(() => {
    const byId = new Map();
    [...filteredTrending, ...filteredTopRated].forEach((movie) => {
      if (movie?.id && !byId.has(movie.id)) {
        byId.set(movie.id, movie);
      }
    });
    return Array.from(byId.values()).slice(0, 20);
  }, [filteredTrending, filteredTopRated]);

  useEffect(() => {
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

      <section aria-label="Home filters">
        <div className="filter-chips" style={{ flexWrap: "nowrap", overflowX: "auto" }}>
          <button
            type="button"
            className={filters.year === "all" ? "active" : ""}
            onClick={() => setFilters((f) => ({ ...f, year: "all" }))}
          >
            Any Year
          </button>
          <button
            type="button"
            className={filters.year === "2020s" ? "active" : ""}
            onClick={() => setFilters((f) => ({ ...f, year: "2020s" }))}
          >
            2020s
          </button>
          <button
            type="button"
            className={filters.year === "2010s" ? "active" : ""}
            onClick={() => setFilters((f) => ({ ...f, year: "2010s" }))}
          >
            2010s
          </button>
          <button
            type="button"
            className={filters.year === "2000s" ? "active" : ""}
            onClick={() => setFilters((f) => ({ ...f, year: "2000s" }))}
          >
            2000s
          </button>
          <button
            type="button"
            className={showMoreFilters ? "active" : ""}
            onClick={() => setShowMoreFilters((open) => !open)}
            aria-expanded={showMoreFilters}
          >
            {showMoreFilters ? "Less" : "More"}
          </button>
        </div>

        {showMoreFilters ? (
          <div className="filter-chips" style={{ marginTop: "0.5rem" }}>
            <button
              type="button"
              className={filters.minRating === 7 ? "active" : ""}
              onClick={() => setFilters((f) => ({ ...f, minRating: f.minRating === 7 ? 0 : 7 }))}
            >
              Rating 7+
            </button>
            <button
              type="button"
              className={filters.language === "en" ? "active" : ""}
              onClick={() =>
                setFilters((f) => ({ ...f, language: f.language === "en" ? "all" : "en" }))
              }
            >
              English
            </button>
            <button
              type="button"
              className={filters.language === "ja" ? "active" : ""}
              onClick={() =>
                setFilters((f) => ({ ...f, language: f.language === "ja" ? "all" : "ja" }))
              }
            >
              Japanese
            </button>
          </div>
        ) : null}
      </section>

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
