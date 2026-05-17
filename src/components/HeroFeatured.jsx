// UI component: HeroFeatured.
export default function HeroFeatured({ movie, onPlay }) {
  const heroBackgroundPath = movie?.backdrop_path || movie?.poster_path || "";
  const heroBackground = heroBackgroundPath
    ? `https://image.tmdb.org/t/p/original${heroBackgroundPath}`
    : "";

  if (!movie) {
    return null;
  }

  const title = movie.title || movie.name || "Untitled";
  const rating =
    typeof movie.vote_average === "number" ? movie.vote_average.toFixed(1) : "N/A";
  const year = (movie.release_date || movie.first_air_date)?.slice(0, 4) || "Unknown";

  return (
    <section className="hero">
      {heroBackground ? (
        <>
          <img className="hero-bg-image" src={heroBackground} alt="" aria-hidden="true" />
          <div className="hero-bg-overlay" aria-hidden="true" />
        </>
      ) : null}
      <div className="hero-main">
        <h2>{title}</h2>
        <div className="hero-meta" aria-label="Featured title metadata">
          <span className="hero-rating">
            <svg aria-hidden="true" viewBox="0 0 24 24">
              <path d="m12 2.2 2.9 6 6.6.9-4.8 4.7 1.2 6.6-5.9-3.1-5.9 3.1 1.2-6.6-4.8-4.7 6.6-.9z" />
            </svg>
            {rating}
          </span>
          <span>{year}</span>
          <span>Movie</span>
        </div>
        <p>{movie.overview || "No overview available."}</p>
        <div className="hero-actions">
          <button type="button" className="hero-btn hero-btn-primary" onClick={() => onPlay(movie)}>
            <svg aria-hidden="true" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
            Play
          </button>
          <button type="button" className="hero-btn hero-btn-secondary" onClick={() => onPlay(movie)}>
            <svg aria-hidden="true" viewBox="0 0 24 24">
              <path
                d="M12 17v-6m0-4h.01M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
              />
            </svg>
            See More
          </button>
        </div>
      </div>
    </section>
  );
}
