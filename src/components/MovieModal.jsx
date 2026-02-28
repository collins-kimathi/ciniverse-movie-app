import { useEffect, useRef, useState } from "react";
import {
  fetchMovieDetails,
  fetchShowDetails,
  fetchSimilarMovies,
  fetchSimilarShows,
  IMG_BASE,
} from "../api/tmdb";
import { fetchLicensedPlaybackSession, isPlaybackEnabled } from "../api/playback";
import { licensedProviders } from "../config/licensedProviders";
import {
  getContinueWatchingEntry,
  isInMyList,
  toggleMyList,
  upsertContinueWatching,
} from "../utils/library";
import { trackEvent } from "../utils/analytics";
import { uiLabels } from "../config/appConfig";

export default function MovieModal({ movie, onClose }) {
  const [activeMovie, setActiveMovie] = useState(movie);
  const [details, setDetails] = useState(null);
  const [similar, setSimilar] = useState([]);
  const [showTrailer, setShowTrailer] = useState(false);
  const [showFullMovie, setShowFullMovie] = useState(false);
  const [playback, setPlayback] = useState(null);
  const [playbackLoading, setPlaybackLoading] = useState(false);
  const [playbackError, setPlaybackError] = useState("");
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(isInMyList(movie.id));
  const [shareStatus, setShareStatus] = useState("");
  const [resumePoint, setResumePoint] = useState(0);
  const modalRef = useRef(null);

  const isShow = activeMovie.mediaType === "tv";

  useEffect(() => {
    setActiveMovie(movie);
    setSaved(isInMyList(movie.id));
    const resumeEntry = getContinueWatchingEntry(movie.id, movie.mediaType || "movie");
    setResumePoint(Number(resumeEntry?.resumeSeconds || 0));
    trackEvent("open_modal", { id: movie.id, mediaType: movie.mediaType || "movie" });
  }, [movie]);

  useEffect(() => {
    let cancelled = false;

    async function loadDetails() {
      setDetails(null);
      setSimilar([]);
      setShowTrailer(false);
      setShowFullMovie(false);
      setPlayback(null);
      setPlaybackLoading(false);
      setPlaybackError("");
      setError("");
      setShareStatus("");

      try {
        const [data, similarData] = await Promise.all([
          isShow ? fetchShowDetails(activeMovie.id) : fetchMovieDetails(activeMovie.id),
          isShow ? fetchSimilarShows(activeMovie.id) : fetchSimilarMovies(activeMovie.id),
        ]);

        if (!cancelled) {
          setDetails(data);
          setSimilar(
            (similarData?.results || [])
              .slice(0, 8)
              .map((item) => ({ ...item, mediaType: isShow ? "tv" : "movie" }))
          );
        }
      } catch {
        if (!cancelled) {
          setError("Failed to load movie details. Please try again.");
        }
      }
    }

    loadDetails();

    return () => {
      cancelled = true;
    };
  }, [activeMovie.id, isShow]);

  useEffect(() => {
    function onKeyDown(event) {
      if (event.key === "Escape") {
        onClose();
        return;
      }

      if (event.key !== "Tab" || !modalRef.current) {
        return;
      }

      const focusable = modalRef.current.querySelectorAll(
        "button, [href], input, select, textarea, [tabindex]:not([tabindex='-1'])"
      );
      if (!focusable.length) {
        return;
      }
      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  useEffect(() => {
    const firstButton = modalRef.current?.querySelector("button");
    firstButton?.focus();
  }, [activeMovie.id]);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    const previousOverscroll = document.body.style.overscrollBehavior;
    document.body.style.overflow = "hidden";
    document.body.style.overscrollBehavior = "contain";

    return () => {
      document.body.style.overflow = previousOverflow;
      document.body.style.overscrollBehavior = previousOverscroll;
    };
  }, []);

  useEffect(() => {
    if (!details) {
      return;
    }
    const title = details.title || details.name || "Untitled";
    upsertContinueWatching({
      id: activeMovie.id,
      mediaType: activeMovie.mediaType || "movie",
      title,
      poster_path: details.poster_path || "",
      release_date: details.release_date || details.first_air_date || "",
      resumeSeconds: playback?.src ? 0 : undefined,
    });
  }, [activeMovie.id, activeMovie.mediaType, details, playback?.src]);

  if (error) {
    return (
      <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/80 p-4" onClick={onClose}>
        <div className="relative max-h-[90vh] w-[min(920px,96vw)] overflow-y-auto rounded-xl border border-white/8 bg-[linear-gradient(160deg,#1d1f24,#121318)] p-4 md:p-6" onClick={(e) => e.stopPropagation()}>
          <button className="absolute right-3 top-3 h-8 w-8 cursor-pointer rounded-full border-none bg-white/14 text-white" onClick={onClose} aria-label="Close details">
            X
          </button>
          <p className="my-2 text-sm text-red-400">{error}</p>
        </div>
      </div>
    );
  }

  if (!details) {
    return (
      <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/80 p-4" onClick={onClose}>
        <div className="relative max-h-[90vh] w-[min(920px,96vw)] overflow-y-auto rounded-xl border border-white/8 bg-[linear-gradient(160deg,#1d1f24,#121318)] p-4 md:p-6" onClick={(e) => e.stopPropagation()}>
          <p className="my-2 text-sm text-[var(--muted)]">Loading details...</p>
        </div>
      </div>
    );
  }

  const trailer = details.videos?.results?.find(
    (v) => v.type === "Trailer" && v.site === "YouTube"
  );
  const trailerSrc = trailer?.key
    ? `https://www.youtube.com/embed/${trailer.key}?autoplay=1&rel=0`
    : `https://www.youtube.com/embed?autoplay=1&rel=0&listType=search&list=${encodeURIComponent(
        `${title} official trailer`
      )}`;
  const poster = details.poster_path
    ? `${IMG_BASE}${details.poster_path}`
    : "https://via.placeholder.com/300x450?text=No+Image";
  const rating =
    typeof details.vote_average === "number" ? details.vote_average.toFixed(1) : "N/A";
  const title = details.title || details.name || "Untitled";
  const year = (details.release_date || details.first_air_date)?.slice(0, 4) || "Unknown";
  const runtime = isShow
    ? details.episode_run_time?.[0]
      ? `${details.episode_run_time[0]} min/episode`
      : "Unknown runtime"
    : details.runtime
      ? `${details.runtime} min`
      : "Unknown runtime";
  const hasPlayback = Boolean(playback?.src);
  const topCast = (details.credits?.cast || []).slice(0, 5);

  async function onWatchFullMovie() {
    if (showFullMovie && hasPlayback) {
      setShowFullMovie(false);
      return;
    }

    if (hasPlayback) {
      setShowFullMovie(true);
      return;
    }

    setPlaybackLoading(true);
    setPlaybackError("");

    try {
      const stream = await fetchLicensedPlaybackSession(activeMovie.id);
      if (stream) {
        setPlayback(stream);
        setShowFullMovie(true);
        trackEvent("start_playback", {
          id: activeMovie.id,
          mediaType: activeMovie.mediaType || "movie",
          title,
        });
        upsertContinueWatching({
          id: activeMovie.id,
          mediaType: activeMovie.mediaType || "movie",
          title,
          poster_path: details.poster_path || "",
          release_date: details.release_date || details.first_air_date || "",
          resumeSeconds: 0,
        });
      } else {
        setPlaybackError(
          "No licensed full-movie stream is available for this title in your region."
        );
      }
    } catch {
      setPlaybackError("Failed to start licensed playback. Please try again.");
    } finally {
      setPlaybackLoading(false);
    }
  }

  function onToggleMyList() {
    const next = toggleMyList({
      id: activeMovie.id,
      mediaType: activeMovie.mediaType || "movie",
      title,
      name: details.name || "",
      poster_path: details.poster_path || "",
      release_date: details.release_date || details.first_air_date || "",
      first_air_date: details.first_air_date || "",
      vote_average: details.vote_average || 0,
    });
    setSaved(next);
    trackEvent(next ? "add_my_list" : "remove_my_list", {
      id: activeMovie.id,
      mediaType: activeMovie.mediaType || "movie",
      title,
    });
  }

  async function onShare() {
    const currentHash = window.location.hash.replace(/^#/, "") || "/home";
    const [pathOnly] = currentHash.split("?");
    const shareUrl = `${window.location.origin}/#${pathOnly}?watch=${activeMovie.id}&type=${
      activeMovie.mediaType || "movie"
    }`;
    const payload = {
      title: `${title} on Ciniverse`,
      text: `Check out ${title} on Ciniverse`,
      url: shareUrl,
    };
    try {
      if (navigator.share) {
        await navigator.share(payload);
        setShareStatus("Shared");
        trackEvent("share_native", { id: activeMovie.id, title });
        return;
      }
      await navigator.clipboard.writeText(shareUrl);
      setShareStatus("Link copied");
      trackEvent("share_copy_link", { id: activeMovie.id, title });
    } catch {
      setShareStatus("Share failed");
    }
  }

  function onVideoProgress(event) {
    const resumeSeconds = Math.floor(event.currentTarget.currentTime || 0);
    if (resumeSeconds % 5 !== 0) {
      return;
    }
    upsertContinueWatching({
      id: activeMovie.id,
      mediaType: activeMovie.mediaType || "movie",
      title,
      poster_path: details.poster_path || "",
      release_date: details.release_date || details.first_air_date || "",
      resumeSeconds,
    });
  }

  function onVideoReady(event) {
    if (!resumePoint) {
      return;
    }
    try {
      event.currentTarget.currentTime = resumePoint;
    } catch {
      // Ignore seek errors.
    }
  }

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/80 p-4" onClick={onClose}>
      <div
        className="relative max-h-[90vh] w-[min(920px,96vw)] overflow-y-auto rounded-xl border border-white/8 bg-[linear-gradient(160deg,#1d1f24,#121318)] p-4 md:p-6"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={`${title} details`}
        ref={modalRef}
      >
        <button className="absolute right-3 top-3 h-8 w-8 cursor-pointer rounded-full border-none bg-white/14 text-white" onClick={onClose} aria-label="Close details">
          X
        </button>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-[220px_1fr]">
          <img
            src={poster}
            alt={details.title || "Movie poster"}
            className="h-auto max-h-[55vh] w-full rounded-lg object-cover md:h-[320px] md:w-[220px]"
          />
          <div className="space-y-2">
            <h2 className="text-2xl font-semibold">{title}</h2>
            {details.tagline ? <p className="mb-2 italic text-[var(--muted)]">{details.tagline}</p> : null}
            <div className="my-2 flex flex-wrap items-center gap-2">
              <button type="button" className="cursor-pointer rounded-full border border-white/20 bg-white/8 px-3 py-1.5 text-sm font-semibold text-[var(--text)] transition hover:bg-white/18" onClick={onToggleMyList}>
                {saved ? "Remove From My List" : "Add To My List"}
              </button>
              <button type="button" className="cursor-pointer rounded-full border border-white/20 bg-white/8 px-3 py-1.5 text-sm font-semibold text-[var(--text)] transition hover:bg-white/18" onClick={onShare}>
                Share
              </button>
              {shareStatus ? <span className="text-xs text-[var(--muted)]">{shareStatus}</span> : null}
            </div>
            <p className="leading-relaxed">
              Rating: {rating} | {year} | {runtime}
            </p>
            <p className="leading-relaxed">{details.overview || "No overview available."}</p>
            {topCast.length ? (
              <div className="space-y-1">
                <p className="my-2 text-sm text-[var(--muted)]">Top Cast</p>
                <ul className="mb-3 ml-4 text-[var(--muted)]">
                  {topCast.map((person) => (
                    <li key={person.credit_id || person.id}>
                      {person.name} as {person.character || "Unknown"}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
            {isPlaybackEnabled ? (
              <button
                type="button"
                className="mr-2 inline-block cursor-pointer rounded-full border-none bg-[#f2f2f2] px-4 py-2 font-bold text-[#111] transition hover:bg-white disabled:cursor-wait disabled:opacity-70"
                onClick={onWatchFullMovie}
                disabled={playbackLoading}
              >
                {playbackLoading
                  ? uiLabels.loadingStream
                  : showFullMovie
                    ? uiLabels.hideFullMovie
                    : uiLabels.watchFullMovie}
              </button>
            ) : (
              <p className="my-2 text-sm text-[var(--muted)]">
                Full-movie streaming is disabled. Add a licensed playback API to enable it.
              </p>
            )}
            {playbackError ? (
              <p className="my-2 text-sm text-red-400" aria-live="polite">
                {playbackError}
              </p>
            ) : null}
            <p className="my-2 text-sm text-[var(--muted)]">Licensed providers on Ciniverse:</p>
            <div className="mb-4 mt-1 flex flex-wrap gap-1.5">
              {licensedProviders.map((provider) =>
                provider.url ? (
                  <a
                    key={provider.name}
                    href={provider.url}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-full bg-white/8 px-2 py-1 text-xs text-[var(--text)] no-underline transition hover:bg-white/18"
                  >
                    {provider.name}
                  </a>
                ) : (
                  <span key={provider.name} className="rounded-full bg-white/8 px-2 py-1 text-xs text-[var(--text)]">
                    {provider.name}
                  </span>
                )
              )}
            </div>
            {showFullMovie && hasPlayback ? (
              <div className="my-3 overflow-hidden rounded-lg border border-white/12 bg-[#0d0f13]">
                {playback.type === "iframe" ? (
                  <iframe
                    title={`${title} full movie`}
                    src={playback.src}
                    allow="autoplay; encrypted-media; picture-in-picture"
                    allowFullScreen
                    className="block w-full border-0 [aspect-ratio:16/9]"
                  />
                ) : (
                  <video
                    controls
                    poster={playback.poster}
                    onTimeUpdate={onVideoProgress}
                    onLoadedMetadata={onVideoReady}
                    className="block w-full border-0 [aspect-ratio:16/9]"
                  >
                    <source
                      src={playback.src}
                      type={
                        playback.type === "hls"
                          ? "application/x-mpegURL"
                          : playback.type === "dash"
                            ? "application/dash+xml"
                            : "video/mp4"
                      }
                    />
                    Your browser does not support the video tag.
                  </video>
                )}
                <p className="m-0 px-3 py-2 text-xs text-[var(--muted)]">
                  Source: {playback.provider} ({playback.region})
                </p>
              </div>
            ) : null}
            <button
              type="button"
              className="mt-3 inline-block cursor-pointer rounded-full border-none bg-[var(--brand)] px-4 py-2 font-bold text-white transition hover:bg-[var(--brand-dark)]"
              onClick={() => {
                setShowTrailer((prev) => !prev);
                trackEvent("toggle_trailer", { id: activeMovie.id, title });
              }}
            >
              {showTrailer ? "Hide Trailer" : "Watch Trailer Here"}
            </button>
            {showTrailer ? (
              <div className="my-3 overflow-hidden rounded-lg border border-white/12">
                <iframe
                  title={`${title} trailer`}
                  src={trailerSrc}
                  allow="autoplay; encrypted-media; picture-in-picture"
                  allowFullScreen
                  className="block w-full border-0 [aspect-ratio:16/9]"
                />
              </div>
            ) : null}
            {similar.length ? (
              <div className="mt-3">
                <p className="my-2 text-sm text-[var(--muted)]">Similar Titles</p>
                <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
                  {similar.map((item) => (
                    <button
                      type="button"
                      key={`${item.mediaType}-${item.id}`}
                      className="cursor-pointer overflow-hidden rounded-lg border border-white/12 bg-white/3 text-left text-[var(--text)]"
                      onClick={() => setActiveMovie(item)}
                    >
                      {item.poster_path ? (
                        <img
                          src={`${IMG_BASE}${item.poster_path}`}
                          alt={item.title || item.name || "Similar title"}
                          className="block w-full object-cover [aspect-ratio:2/3]"
                        />
                      ) : null}
                      <span className="block p-2 text-xs">{item.title || item.name || "Untitled"}</span>
                    </button>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
