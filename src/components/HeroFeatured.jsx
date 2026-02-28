export default function HeroFeatured({ movie, onPlay, rotateMs, tick }) {
  const heroBackgroundPath = movie?.backdrop_path || movie?.poster_path || "";
  const heroBackground = heroBackgroundPath
    ? `https://image.tmdb.org/t/p/original${heroBackgroundPath}`
    : "";

  if (!movie) {
    return null;
  }

  return (
    <section className="relative isolate mb-8 flex min-h-[250px] flex-col justify-end gap-3 overflow-hidden rounded-xl border border-white/10 bg-gradient-to-r from-black/90 to-black/70 p-4 md:min-h-[430px] md:rounded-2xl md:p-10">
      {heroBackground ? (
        <>
          <img
            className="absolute inset-0 -z-20 h-full w-full object-cover [object-position:center_28%]"
            src={heroBackground}
            alt=""
            aria-hidden="true"
          />
          <div
            className="absolute inset-0 -z-10 bg-gradient-to-r from-black/95 via-black/75 to-black/45"
            aria-hidden="true"
          />
        </>
      ) : null}
      <div className="relative z-10 flex max-w-[65ch] flex-col gap-3 animate-[heroFade_360ms_ease-out]">
        <h2 className="max-w-[18ch] text-[clamp(1.45rem,7vw,3.1rem)] leading-[1.1]">{movie.title}</h2>
        <p className="max-w-[62ch] text-sm leading-relaxed text-zinc-200 md:text-base">
          {movie.overview || "No overview available."}
        </p>
        <button
          type="button"
          className="w-fit cursor-pointer rounded-full bg-[var(--brand)] px-5 py-2.5 font-bold text-white transition hover:bg-[var(--brand-dark)]"
          onClick={() => onPlay(movie)}
        >
          Play Trailer
        </button>
        <div
          key={tick}
          className="mt-1 h-1 w-full origin-left rounded-full bg-gradient-to-r from-[var(--brand)] to-[#ff7f86] [animation-fill-mode:forwards] [animation-name:heroTimerFill] [animation-timing-function:linear]"
          style={{ animationDuration: `${rotateMs}ms` }}
        />
      </div>
    </section>
  );
}
