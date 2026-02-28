export default function HeroFeatured({ movie, onPlay, rotateMs, tick }) {
  const heroBackgroundPath = movie?.backdrop_path || movie?.poster_path || "";
  const heroBackground = heroBackgroundPath
    ? `https://image.tmdb.org/t/p/original${heroBackgroundPath}`
    : "";

  if (!movie) {
    return null;
  }

  return (
    <section className="hero">
      {heroBackground ? (
        <>
          <img className="hero-bg-image" src={heroBackground} alt="" aria-hidden="true" />
          <div className="hero-bg-overlay" aria-hidden="true" />
        </>
      ) : null}
      <div className="hero-main">
        <h2>{movie.title}</h2>
        <p>{movie.overview || "No overview available."}</p>
        <button type="button" className="hero-btn" onClick={() => onPlay(movie)}>
          Play Trailer
        </button>
        <div
          key={tick}
          className="hero-timer-bar"
          style={{ animationDuration: `${rotateMs}ms` }}
        />
      </div>
    </section>
  );
}
