export default function HeroFeatured({ movie, onPlay, rotateMs, tick }) {
  const heroBackground = movie?.backdrop_path
    ? `https://image.tmdb.org/t/p/original${movie.backdrop_path}`
    : "";

  if (!movie) {
    return null;
  }

  return (
    <section
      className="hero"
      style={
        heroBackground
          ? {
              backgroundImage: `linear-gradient(to right, rgba(0,0,0,.92), rgba(0,0,0,.5)), url(${heroBackground})`,
            }
          : undefined
      }
    >
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
