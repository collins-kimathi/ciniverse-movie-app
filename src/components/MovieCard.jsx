import { useEffect, useRef, useState } from "react";
import { fetchMovieVideos, fetchShowVideos, IMG_BASE } from "../api/tmdb";
import { fetchLicensedPlaybackSession, isPlaybackEnabled } from "../api/playback";

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
  const [licensed, setLicensed] = useState(availabilityCache.get(movie.id));
  const [imageLoaded, setImageLoaded] = useState(false);
  const [previewActive, setPreviewActive] = useState(false);
  const [previewAudioOn, setPreviewAudioOn] = useState(false);
  const [trailerKey, setTrailerKey] = useState(trailerCache.get(`${mediaType}:${movie.id}`));
  const hoverIntentTimerRef = useRef(null);

  useEffect(() => {
    setImageLoaded(false);
    setPreviewActive(false);
    setPreviewAudioOn(false);
    setTrailerKey(trailerCache.get(`${mediaType}:${movie.id}`));
  }, [movie.id, movie.poster_path, mediaType]);

  useEffect(() => {
    let cancelled = false;
    if (!isPlaybackEnabled) {
      return undefined;
    }
    if (availabilityCache.has(movie.id)) {
      setLicensed(availabilityCache.get(movie.id));
      return undefined;
    }
    fetchLicensedPlaybackSession(movie.id)
      .then((stream) => {
        const isLicensed = Boolean(stream?.src);
        availabilityCache.set(movie.id, isLicensed);
        if (!cancelled) {
          setLicensed(isLicensed);
        }
      })
      .catch(() => {
        availabilityCache.set(movie.id, false);
        if (!cancelled) {
          setLicensed(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [movie.id]);

  async function ensureTrailerKey() {
    const cacheKey = `${mediaType}:${movie.id}`;
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
    setPreviewAudioOn(false);
    if (trailerKey === undefined) {
      ensureTrailerKey();
    }
    hoverIntentTimerRef.current = window.setTimeout(() => {
      setPreviewActive(true);
    }, 420);
  }

  function stopPreview() {
    window.clearTimeout(hoverIntentTimerRef.current);
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

  return (
    <button
      type="button"
      className="card"
      onClick={() => onClick(movie)}
      onMouseEnter={startPreview}
      onMouseLeave={stopPreview}
      onFocus={startPreview}
      onBlur={stopPreview}
      aria-label={`Open details for ${title}`}
    >
      {isPlaybackEnabled && licensed != null ? (
        <span className={`availability-badge ${licensed ? "yes" : "no"}`}>
          {licensed ? "Licensed" : "Not Licensed"}
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
              className="preview-audio-toggle"
              aria-label={previewAudioOn ? "Mute preview audio" : "Unmute preview audio"}
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                setPreviewAudioOn((current) => !current);
              }}
            >
              {previewAudioOn ? "Mute" : "Sound"}
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
