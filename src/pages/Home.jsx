import { useEffect, useMemo, useState } from "react";
import { fetchByGenre, fetchPopular, fetchTrending, fetchTopRated } from "../api/tmdb";
import HeroFeatured from "../components/HeroFeatured";
import MovieRowSlider from "../components/MovieRowSlider";
import MovieModal from "../components/MovieModal";
import SkeletonRow from "../components/SkeletonRow";

const GENRE_SECTIONS = [
  { key: "action", title: "Action Hits", genreId: 28, emptyMessage: "No action movies found." },
  {
    key: "comedy",
    title: "Comedy Picks",
    genreId: 35,
    emptyMessage: "No comedy movies found.",
  },
  { key: "drama", title: "Drama Stories", genreId: 18, emptyMessage: "No drama movies found." },
  {
    key: "thriller",
    title: "Thriller Zone",
    genreId: 53,
    emptyMessage: "No thriller movies found.",
  },
  { key: "horror", title: "Horror Nights", genreId: 27, emptyMessage: "No horror movies found." },
  { key: "scifi", title: "Sci-Fi Worlds", genreId: 878, emptyMessage: "No sci-fi movies found." },
  {
    key: "romance",
    title: "Romance Picks",
    genreId: 10749,
    emptyMessage: "No romance movies found.",
  },
  {
    key: "animation",
    title: "Animation Spotlight",
    genreId: 16,
    emptyMessage: "No animation movies found.",
  },
];

export default function Home() {
  // Featured hero switches to the next movie on this cadence.
  const HERO_ROTATE_MS = 8000;
  const [trending, setTrending] = useState([]);
  const [topRated, setTopRated] = useState([]);
  const [popular, setPopular] = useState([]);
  const [genreRows, setGenreRows] = useState({});
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
          ...genrePages
        ] = await Promise.all([
          fetchTrending(1),
          fetchTrending(2),
          fetchTopRated(1),
          fetchTopRated(2),
          fetchPopular(1),
          fetchPopular(2),
          ...GENRE_SECTIONS.map((section) => fetchByGenre(section.genreId, 1)),
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
          const nextGenreRows = {};
          GENRE_SECTIONS.forEach((section, index) => {
            nextGenreRows[section.key] = mergeUnique(genrePages[index]?.results || []);
          });
          setGenreRows(nextGenreRows);
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

  const topTwentyMovies = useMemo(() => {
    const byId = new Map();
    [...trending, ...topRated, ...popular].forEach((movie) => {
      if (movie?.id && !byId.has(movie.id)) {
        byId.set(movie.id, movie);
      }
    });
    return Array.from(byId.values()).slice(0, 20);
  }, [trending, topRated, popular]);

  useEffect(() => {
    if (topTwentyMovies.length <= 1) {
      setActiveHeroIndex(0);
      setHeroTick(0);
      return;
    }

    // Advance the hero movie on a timer and restart progress animation.
    setHeroTick((value) => value + 1);
    const interval = window.setInterval(() => {
      setActiveHeroIndex((current) => (current + 1) % topTwentyMovies.length);
      setHeroTick((value) => value + 1);
    }, HERO_ROTATE_MS);

    return () => window.clearInterval(interval);
  }, [topTwentyMovies, HERO_ROTATE_MS]);

  const heroMovie = useMemo(
    () => topTwentyMovies[activeHeroIndex] || trending[0] || topRated[0],
    [activeHeroIndex, topTwentyMovies, trending, topRated]
  );
  return (
    <main className="main">
      <HeroFeatured
        movie={heroMovie}
        onPlay={setSelected}
        rotateMs={HERO_ROTATE_MS}
        tick={heroTick}
      />

      {loading ? (
        <>
          <SkeletonRow title="Trending This Week" />
          <SkeletonRow title="Top Rated" />
          <SkeletonRow title="Popular Right Now" />
          <SkeletonRow title="Action Hits" />
          <SkeletonRow title="Comedy Picks" />
          <SkeletonRow title="Drama Stories" />
          <SkeletonRow title="Thriller Zone" />
          <SkeletonRow title="Horror Nights" />
          <SkeletonRow title="Sci-Fi Worlds" />
          <SkeletonRow title="Romance Picks" />
          <SkeletonRow title="Animation Spotlight" />
        </>
      ) : null}
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
          {GENRE_SECTIONS.map((section) => (
            <MovieRowSlider
              key={section.key}
              title={section.title}
              movies={genreRows[section.key] || []}
              onSelect={setSelected}
              emptyMessage={section.emptyMessage}
            />
          ))}
        </>
      ) : null}

      {selected ? <MovieModal movie={selected} onClose={() => setSelected(null)} /> : null}
    </main>
  );
}
