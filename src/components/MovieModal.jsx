import { useEffect, useState } from "react";
import {
  fetchMovieDetails,
  fetchShowDetails,
  fetchSimilarMovies,
  fetchSimilarShows,
  IMG_BASE,
} from "../api/tmdb";
import { fetchLicensedPlaybackSession, isPlaybackEnabled } from "../api/playback";
import { licensedProviders } from "../config/licensedProviders";
import { isInMyList, toggleMyList, upsertContinueWatching } from "../utils/library";

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

  const isShow = activeMovie.mediaType === "tv";

  useEffect(() => {
    setActiveMovie(movie);
    setSaved(isInMyList(movie.id));
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
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

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
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal" onClick={(e) => e.stopPropagation()}>
          <button className="close-btn" onClick={onClose} aria-label="Close details">
            X
          </button>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  if (!details) {
    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal" onClick={(e) => e.stopPropagation()}>
          <p className="status-line">Loading details...</p>
        </div>
      </div>
    );
  }

  const trailer = details.videos?.results?.find(
    (v) => v.type === "Trailer" && v.site === "YouTube"
  );
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
  }

  async function onShare() {
    const shareUrl = `${window.location.origin}/?watch=${activeMovie.id}`;
    const payload = {
      title: `${title} on Ciniverse`,
      text: `Check out ${title} on Ciniverse`,
      url: shareUrl,
    };
    try {
      if (navigator.share) {
        await navigator.share(payload);
        setShareStatus("Shared");
        return;
      }
      await navigator.clipboard.writeText(shareUrl);
      setShareStatus("Link copied");
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

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <button className="close-btn" onClick={onClose} aria-label="Close details">
          X
        </button>
        <div className="modal-content">
          <img src={poster} alt={details.title || "Movie poster"} />
          <div className="modal-info">
            <h2>{title}</h2>
            {details.tagline ? <p className="tagline">{details.tagline}</p> : null}
            <div className="modal-actions">
              <button type="button" className="row-more-btn" onClick={onToggleMyList}>
                {saved ? "Remove From My List" : "Add To My List"}
              </button>
              <button type="button" className="row-more-btn" onClick={onShare}>
                Share
              </button>
              {shareStatus ? <span className="status-inline">{shareStatus}</span> : null}
            </div>
            <p>
              Rating: {rating} | {year} | {runtime}
            </p>
            <p>{details.overview || "No overview available."}</p>
            {topCast.length ? (
              <div className="cast-block">
                <p className="status-line provider-list">Top Cast</p>
                <ul>
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
                className="stream-btn"
                onClick={onWatchFullMovie}
                disabled={playbackLoading}
              >
                {playbackLoading
                  ? "Loading Licensed Stream..."
                  : showFullMovie
                    ? "Hide Full Movie"
                    : "Watch Full Movie"}
              </button>
            ) : (
              <p className="status-line">
                Full-movie streaming is disabled. Add a licensed playback API to enable it.
              </p>
            )}
            {playbackError ? <p className="status-line error">{playbackError}</p> : null}
            <p className="status-line provider-list">Licensed providers on Ciniverse:</p>
            <div className="provider-chips">
              {licensedProviders.map((provider) =>
                provider.url ? (
                  <a
                    key={provider.name}
                    href={provider.url}
                    target="_blank"
                    rel="noreferrer"
                    className="provider-chip provider-chip--link"
                  >
                    {provider.name}
                  </a>
                ) : (
                  <span key={provider.name} className="provider-chip">
                    {provider.name}
                  </span>
                )
              )}
            </div>
            {showFullMovie && hasPlayback ? (
              <div className="full-player-wrap">
                {playback.type === "iframe" ? (
                  <iframe
                    title={`${title} full movie`}
                    src={playback.src}
                    allow="autoplay; encrypted-media; picture-in-picture"
                    allowFullScreen
                  />
                ) : (
                  <video controls poster={playback.poster} onTimeUpdate={onVideoProgress}>
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
                <p className="license-note">
                  Source: {playback.provider} ({playback.region})
                </p>
              </div>
            ) : null}
            {trailer ? (
              <button
                type="button"
                className="trailer-btn"
                onClick={() => setShowTrailer((prev) => !prev)}
              >
                {showTrailer ? "Hide Trailer" : "Watch Trailer Here"}
              </button>
            ) : null}
            {showTrailer && trailer ? (
              <div className="trailer-frame-wrap">
                <iframe
                  title={`${title} trailer`}
                  src={`https://www.youtube.com/embed/${trailer.key}?autoplay=1&rel=0`}
                  allow="autoplay; encrypted-media; picture-in-picture"
                  allowFullScreen
                />
              </div>
            ) : null}
            {similar.length ? (
              <div className="similar-wrap">
                <p className="status-line provider-list">Similar Titles</p>
                <div className="similar-grid">
                  {similar.map((item) => (
                    <button
                      type="button"
                      key={`${item.mediaType}-${item.id}`}
                      className="similar-card"
                      onClick={() => setActiveMovie(item)}
                    >
                      {item.poster_path ? (
                        <img
                          src={`${IMG_BASE}${item.poster_path}`}
                          alt={item.title || item.name || "Similar title"}
                        />
                      ) : null}
                      <span>{item.title || item.name || "Untitled"}</span>
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
