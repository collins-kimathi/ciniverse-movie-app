// UI component: MovieCard.
import { useEffect, useRef, useState } from "react";
import { fetchMovieVideos, fetchShowVideos, IMG_BASE } from "../api/tmdb";
import { fetchTitleAvailability, isAvailabilityEnabled } from "../api/availability";

// In-memory caches reduce repeated API calls while users browse rows/cards.
const availabilityCache = new Map();
const trailerCache = new Map();

export default function MovieCard({ movie, onClick }) {
  const poster = movie.poster_path
    ? `${IMG_BASE}${movie.poster_path}`
    : "https://via.placeholder.com/300x450?text=No+Image";
  const rating =
    typeof movie.vote_average === "number" ? movie.vote_average.toFixed(1) : "N/A";
  const year = (movie.release_date || movie.first_air_date)?.slice(0, 4) || "Unknown";
  const title = movie.title || movie.name || "Untitled";
  const mediaType = movie.mediaType || "movie";
  const availabilityCacheKey = `${mediaType}:${movie.id}`;
  const [availability, setAvailability] = useState(availabilityCache.get(availabilityCacheKey));
  const [imageLoaded, setImageLoaded] = useState(false);
  const [previewActive, setPreviewActive] = useState(false);
  const [previewAudioOn, setPreviewAudioOn] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const [trailerKey, setTrailerKey] = useState(trailerCache.get(`${mediaType}:${movie.id}`));
  const hoverIntentTimerRef = useRef(null);

  useEffect(() => {
    setImageLoaded(false);
    setIsHovering(false);
    setPreviewActive(false);
    setPreviewAudioOn(false);
    setTrailerKey(trailerCache.get(`${mediaType}:${movie.id}`));
  }, [movie.id, movie.poster_path, mediaType]);

  useEffect(() => {
    let cancelled = false;
    if (!isAvailabilityEnabled) {
      return undefined;
    }
    // Reuse known availability so each title is checked only once per session.
    if (availabilityCache.has(availabilityCacheKey)) {
      setAvailability(availabilityCache.get(availabilityCacheKey));
      return undefined;
    }
    fetchTitleAvailability(movie.id, mediaType)
      .then((result) => {
        availabilityCache.set(availabilityCacheKey, result);
        if (!cancelled) {
          setAvailability(result);
        }
      })
      .catch(() => {
        const unavailable = { available: false, label: "", source: "", providers: [] };
        availabilityCache.set(availabilityCacheKey, unavailable);
        if (!cancelled) {
          setAvailability(unavailable);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [availabilityCacheKey, mediaType, movie.id]);

  async function ensureTrailerKey() {
    const cacheKey = `${mediaType}:${movie.id}`;
    // Trailer lookup can be expensive; cache youtube key by media type + id.
    if (trailerCache.has(cacheKey)) {
      setTrailerKey(trailerCache.get(cacheKey));
      return;
    }

    try {
      const data = mediaType === "tv" ? await fetchShowVideos(movie.id) : await fetchMovieVideos(movie.id);
      const videos = data?.results || [];
      const preferred =
        videos.find((item) => item.site === "YouTube" && item.type === "Trailer") ||
        videos.find((item) => item.site === "YouTube" && item.type === "Teaser");
      const key = preferred?.key || null;
      trailerCache.set(cacheKey, key);
      setTrailerKey(key);
    } catch {
      trailerCache.set(cacheKey, null);
      setTrailerKey(null);
    }
  }

  function startPreview() {
    window.clearTimeout(hoverIntentTimerRef.current);
    setIsHovering(true);
    setPreviewAudioOn(false);
    if (trailerKey === undefined) {
      ensureTrailerKey();
    }
    // Small hover delay prevents accidental iframe loads when cursor passes over cards.
    hoverIntentTimerRef.current = window.setTimeout(() => {
      setPreviewActive(true);
    }, 420);
  }

  function stopPreview() {
    window.clearTimeout(hoverIntentTimerRef.current);
    setIsHovering(false);
    setPreviewActive(false);
    setPreviewAudioOn(false);
  }

  useEffect(
    () => () => {
      window.clearTimeout(hoverIntentTimerRef.current);
    },
    []
  );

  const showTrailerPreview = previewActive && Boolean(trailerKey);
  const trailerSrc = trailerKey
    ? `https://www.youtube.com/embed/${trailerKey}?autoplay=1&mute=${
        previewAudioOn ? 0 : 1
      }&controls=${previewAudioOn ? 1 : 0}&modestbranding=1&rel=0&playsinline=1&loop=1&playlist=${trailerKey}`
    : "";
  const cardClassName = `card${isHovering ? " is-hovered" : ""}${
    showTrailerPreview ? " is-previewing" : ""
  }`;

  return (
    <button
      type="button"
      className={cardClassName}
      onClick={() => onClick(movie)}
      onMouseEnter={startPreview}
      onMouseLeave={stopPreview}
      onFocus={startPreview}
      onBlur={stopPreview}
      aria-label={`Open details for ${title}`}
    >
      {isAvailabilityEnabled && availability?.available ? (
        <span className="availability-badge yes">
          {availability.label || "Available"}
        </span>
      ) : null}
      <div className="card-media">
        {showTrailerPreview ? (
          <>
            <iframe
              src={trailerSrc}
              title={`${title} trailer preview`}
              loading="lazy"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
            <button
              type="button"
              className={`preview-audio-toggle ${previewAudioOn ? "unmuted" : "muted"}`}
              aria-label={previewAudioOn ? "Mute preview audio" : "Unmute preview audio"}
              aria-pressed={previewAudioOn}
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                setPreviewAudioOn((current) => !current);
              }}
            >
              <span className="preview-audio-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" focusable="false">
                  <path d="M11 5 6.6 9H3.5v6h3.1L11 19z" />
                  {previewAudioOn ? (
                    <path d="M14.5 9.5a4.2 4.2 0 0 1 0 5" />
                  ) : (
                    <>
                      <path d="M14.2 10.2l5.6 5.6" />
                      <path d="M19.8 10.2l-5.6 5.6" />
                    </>
                  )}
                </svg>
              </span>
            </button>
          </>
        ) : (
          <img
            src={poster}
            alt={title}
            loading="lazy"
            className={imageLoaded ? "loaded" : "loading"}
            onLoad={() => setImageLoaded(true)}
          />
        )}
      </div>
      <div className="card-info">
        <h3>{title}</h3>
        <span>Rating: {rating}</span>
        <span>{year}</span>
      </div>
    </button>
  );
}
