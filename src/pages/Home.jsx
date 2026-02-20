import { useEffect, useMemo, useState } from "react";
import { fetchPopular, fetchTrending, fetchTopRated } from "../api/tmdb";
import HeroFeatured from "../components/HeroFeatured";
import MovieRowSlider from "../components/MovieRowSlider";
import MovieModal from "../components/MovieModal";

export default function Home() {
  // Featured hero switches to the next movie on this cadence.
  const HERO_ROTATE_MS = 8000;
  const [trending, setTrending] = useState([]);
  const [topRated, setTopRated] = useState([]);
  const [popular, setPopular] = useState([]);
  const [selected, setSelected] = useState(null);
  const [activeHeroIndex, setActiveHeroIndex] = useState(0);
  const [heroTick, setHeroTick] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadHome() {
      setLoading(true);
      setError("");

      try {
        const [
          trendingPage1,
          trendingPage2,
          topRatedPage1,
          topRatedPage2,
          popularPage1,
          popularPage2,
        ] = await Promise.all([
          fetchTrending(1),
          fetchTrending(2),
          fetchTopRated(1),
          fetchTopRated(2),
          fetchPopular(1),
          fetchPopular(2),
        ]);

        if (!cancelled) {
          // Merge multiple pages and remove duplicate movie IDs.
          const mergeUnique = (...lists) => {
            const byId = new Map();
            lists.flat().forEach((movie) => {
              if (movie?.id && !byId.has(movie.id)) {
                byId.set(movie.id, movie);
              }
            });
            return Array.from(byId.values());
          };

          setTrending(
            mergeUnique(trendingPage1.results || [], trendingPage2.results || [])
          );
          setTopRated(
            mergeUnique(topRatedPage1.results || [], topRatedPage2.results || [])
          );
          setPopular(
            mergeUnique(popularPage1.results || [], popularPage2.results || [])
          );
        }
      } catch {
        if (!cancelled) {
          setError("Could not load movies. Please check your API key or network.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadHome();

    return () => {
      cancelled = true;
    };
  }, []);

  const topTenMovies = useMemo(() => {
    const byId = new Map();
    [...trending, ...topRated, ...popular].forEach((movie) => {
      if (movie?.id && !byId.has(movie.id)) {
        byId.set(movie.id, movie);
      }
    });
    return Array.from(byId.values()).slice(0, 10);
  }, [trending, topRated, popular]);

  useEffect(() => {
    if (topTenMovies.length <= 1) {
      setActiveHeroIndex(0);
      setHeroTick(0);
      return;
    }

    // Advance the hero movie on a timer and restart progress animation.
    setHeroTick((value) => value + 1);
    const interval = window.setInterval(() => {
      setActiveHeroIndex((current) => (current + 1) % topTenMovies.length);
      setHeroTick((value) => value + 1);
    }, HERO_ROTATE_MS);

    return () => window.clearInterval(interval);
  }, [topTenMovies, HERO_ROTATE_MS]);

  const heroMovie = useMemo(
    () => topTenMovies[activeHeroIndex] || trending[0] || topRated[0],
    [activeHeroIndex, topTenMovies, trending, topRated]
  );
  return (
    <main className="main">
      <HeroFeatured
        movie={heroMovie}
        onPlay={setSelected}
        rotateMs={HERO_ROTATE_MS}
        tick={heroTick}
      />

      {loading ? <p className="status-line">Loading movies...</p> : null}
      {error ? <p className="status-line error">{error}</p> : null}

      {!loading && !error ? (
        <>
          <MovieRowSlider
            title="Trending This Week"
            movies={trending}
            onSelect={setSelected}
            emptyMessage="No trending movies found."
          />
          <MovieRowSlider
            title="Top Rated"
            movies={topRated}
            onSelect={setSelected}
            emptyMessage="No top rated movies found."
          />
          <MovieRowSlider
            title="Popular Right Now"
            movies={popular}
            onSelect={setSelected}
            emptyMessage="No popular movies found."
          />
        </>
      ) : null}

      {selected ? <MovieModal movie={selected} onClose={() => setSelected(null)} /> : null}
    </main>
  );
}
