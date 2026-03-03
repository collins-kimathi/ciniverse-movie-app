import { useEffect, useRef, useState } from "react";
import {
  fetchMovieDetails,
  fetchShowDetails,
  fetchSimilarMovies,
  fetchSimilarShows,
  IMG_BASE,
} from "../api/tmdb";
import { fetchCommunityData, postCommunityNote, postCommunityRating } from "../api/community";
import {
  getMovieNotebookEntry,
  isInMyList,
  toggleMyList,
  upsertMovieNotebookFeedback,
} from "../utils/library";
import { trackEvent } from "../utils/analytics";

export default function MovieModal({ movie, onClose }) {
  const [activeMovie, setActiveMovie] = useState(movie);
  const [details, setDetails] = useState(null);
  const [similar, setSimilar] = useState([]);
  const [showTrailer, setShowTrailer] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(isInMyList(movie.id));
  const [shareStatus, setShareStatus] = useState("");
  const [notebook, setNotebook] = useState(
    getMovieNotebookEntry(movie.id, movie.mediaType || "movie")
  );
  const [noteText, setNoteText] = useState("");
  const [noteStatus, setNoteStatus] = useState("");
  const [ratingStatus, setRatingStatus] = useState("");
  const [selectedRating, setSelectedRating] = useState(0);
  const [community, setCommunity] = useState({
    notes: [],
    ratings: { totalRatings: 0, averageRating: 0, counts: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } },
  });
  const [communityLoading, setCommunityLoading] = useState(false);
  const [communityError, setCommunityError] = useState("");
  const modalRef = useRef(null);

  const isShow = activeMovie.mediaType === "tv";

  useEffect(() => {
    setActiveMovie(movie);
    setSaved(isInMyList(movie.id));
    setNotebook(getMovieNotebookEntry(movie.id, movie.mediaType || "movie"));
    setNoteText("");
    setNoteStatus("");
    setRatingStatus("");
    setSelectedRating(0);
    trackEvent("open_modal", { id: movie.id, mediaType: movie.mediaType || "movie" });
  }, [movie]);

  useEffect(() => {
    setNotebook(getMovieNotebookEntry(activeMovie.id, activeMovie.mediaType || "movie"));
    setNoteText("");
    setNoteStatus("");
    setRatingStatus("");
    setSelectedRating(0);
  }, [activeMovie.id, activeMovie.mediaType]);

  useEffect(() => {
    let cancelled = false;
    async function loadCommunity() {
      setCommunityLoading(true);
      setCommunityError("");
      try {
        const data = await fetchCommunityData(activeMovie.id, activeMovie.mediaType || "movie");
        if (!cancelled) {
          setCommunity(data);
        }
      } catch {
        if (!cancelled) {
          setCommunityError(
            "Community data is unavailable right now. Please try again shortly."
          );
          setCommunity({
            notes: [],
            ratings: { totalRatings: 0, averageRating: 0, counts: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } },
          });
        }
      } finally {
        if (!cancelled) {
          setCommunityLoading(false);
        }
      }
    }

    loadCommunity();
    return () => {
      cancelled = true;
    };
  }, [activeMovie.id, activeMovie.mediaType]);

  useEffect(() => {
    let cancelled = false;

    async function loadDetails() {
      setDetails(null);
      setSimilar([]);
      setShowTrailer(false);
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

  if (error) {
    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal" onClick={(e) => e.stopPropagation()}>
          <button className="close-btn" onClick={onClose} aria-label="Close details">
            X
          </button>
          <p className="status-line error">{error}</p>
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
  const topCast = (details.credits?.cast || []).slice(0, 5);
  const watched = Boolean(notebook?.watched);
  const notebookRating = selectedRating;
  const notebookRecommendation =
    notebook?.recommendation === "recommend" ||
    notebook?.recommendation === "skip" ||
    notebook?.recommendation === "undecided"
      ? notebook.recommendation
      : "undecided";
  const notebookNotes = Array.isArray(community?.notes) ? community.notes : [];
  const totalRatings = Number(community?.ratings?.totalRatings || 0);
  const averageRating = Number(community?.ratings?.averageRating || 0);
  const ratingCounts = community?.ratings?.counts || { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };

  function applyNotebookFeedback(nextPatch) {
    const updated = upsertMovieNotebookFeedback({
      id: activeMovie.id,
      mediaType: activeMovie.mediaType || "movie",
      title,
      watched: watched,
      userRating: null,
      recommendation: notebookRecommendation,
      ...nextPatch,
    });
    setNotebook(updated);
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
    const pathOnly = window.location.pathname || "/home";
    const shareUrl = `${window.location.origin}${pathOnly}?watch=${activeMovie.id}&type=${
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

  function onWatchedChange(event) {
    const nextWatched = event.target.checked;
    applyNotebookFeedback({
      watched: nextWatched,
      userRating: null,
      recommendation: nextWatched ? notebookRecommendation : "undecided",
    });
    trackEvent("movie_notebook_watched", {
      id: activeMovie.id,
      mediaType: activeMovie.mediaType || "movie",
      watched: nextWatched,
    });
  }

  async function onRatingChange(nextRating) {
    const resolvedRating = notebookRating === nextRating ? 0 : nextRating;
    setSelectedRating(resolvedRating);
    if (!resolvedRating) {
      setRatingStatus("");
      return;
    }
    try {
      const data = await postCommunityRating({
        id: activeMovie.id,
        mediaType: activeMovie.mediaType || "movie",
        rating: resolvedRating,
      });
      setCommunity(data);
      setRatingStatus("Rating counted");
      applyNotebookFeedback({
        watched: true,
        userRating: null,
        recommendation: notebookRecommendation,
      });
      trackEvent("movie_rating_submitted", {
        id: activeMovie.id,
        mediaType: activeMovie.mediaType || "movie",
        rating: resolvedRating,
      });
    } catch (error) {
      setRatingStatus(error?.message || "Rating service unavailable");
    }
  }

  function onRecommendationChange(nextRecommendation) {
    const resolvedRecommendation =
      notebookRecommendation === nextRecommendation ? "undecided" : nextRecommendation;
    applyNotebookFeedback({
      watched: true,
      userRating: null,
      recommendation: resolvedRecommendation,
    });
    trackEvent("movie_notebook_recommendation", {
      id: activeMovie.id,
      mediaType: activeMovie.mediaType || "movie",
      recommendation: resolvedRecommendation,
    });
  }

  async function onAddNotebookNote(event) {
    event.preventDefault();
    const clean = noteText.trim();
    if (!clean) {
      setNoteStatus("Write a short note before posting.");
      return;
    }
    try {
      const data = await postCommunityNote({
        id: activeMovie.id,
        mediaType: activeMovie.mediaType || "movie",
        text: clean,
        author: "ReelNotes User",
      });
      setCommunity(data);
      setNoteText("");
      setNoteStatus("Note posted");
      trackEvent("movie_note_posted", {
        id: activeMovie.id,
        mediaType: activeMovie.mediaType || "movie",
        noteLength: clean.length,
      });
    } catch (error) {
      setNoteStatus(error?.message || "Note service unavailable");
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={`${title} details`}
        ref={modalRef}
      >
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
            <button
              type="button"
              className="trailer-btn"
              onClick={() => {
                setShowTrailer((prev) => !prev);
                trackEvent("toggle_trailer", { id: activeMovie.id, title });
              }}
            >
              {showTrailer ? "Hide Trailer" : "Watch Trailer Here"}
            </button>
            {showTrailer ? (
              <div className="trailer-frame-wrap">
                <iframe
                  title={`${title} trailer`}
                  src={trailerSrc}
                  allow="autoplay; encrypted-media; picture-in-picture"
                  allowFullScreen
                />
              </div>
            ) : null}
            <section className="notebook-panel" aria-label="ReelNotes">
              <p className="status-line provider-list">ReelNotes</p>
              <p className="notebook-helper">
                Rate this title, suggest it, and post notes visible to all users.
              </p>
              {communityLoading ? <p className="status-line">Loading community activity...</p> : null}
              {communityError ? (
                <p className="status-line error" aria-live="polite">
                  {communityError}
                </p>
              ) : null}
              <label className="notebook-check">
                <input type="checkbox" checked={watched} onChange={onWatchedChange} />
                I have watched this title
              </label>
              <div className="notebook-feedback-grid">
                <label>
                  Rate This Title
                  <div
                    className="star-rating"
                    role="radiogroup"
                    aria-label="My rating"
                  >
                    {Array.from({ length: 5 }, (_, index) => {
                      const starValue = index + 1;
                      const active = starValue <= notebookRating;
                      return (
                        <button
                          key={starValue}
                          type="button"
                          className={`star-btn ${active ? "is-active" : ""}`.trim()}
                          onClick={() => onRatingChange(starValue)}
                          role="radio"
                          aria-checked={notebookRating === starValue}
                          aria-label={`${starValue} star${starValue > 1 ? "s" : ""}`}
                        >
                          ★
                        </button>
                      );
                    })}
                  </div>
                  <span className="notebook-metric">
                    {totalRatings} ratings | Avg {averageRating ? averageRating.toFixed(1) : "0.0"} / 5
                  </span>
                  <span className="notebook-metric">
                    5★ {ratingCounts[5] || 0} | 4★ {ratingCounts[4] || 0} | 3★{" "}
                    {ratingCounts[3] || 0} | 2★ {ratingCounts[2] || 0} | 1★ {ratingCounts[1] || 0}
                  </span>
                  {ratingStatus ? <span className="status-inline">{ratingStatus}</span> : null}
                </label>
                <label>
                  Suggest This Title?
                  <div
                    className="recommendation-group"
                    role="radiogroup"
                    aria-label="Suggest this title"
                  >
                    <button
                      type="button"
                      className={`recommendation-chip ${
                        notebookRecommendation === "recommend" ? "is-active recommend" : ""
                      }`.trim()}
                      onClick={() => onRecommendationChange("recommend")}
                      role="radio"
                      aria-checked={notebookRecommendation === "recommend"}
                    >
                      Suggest
                    </button>
                    <button
                      type="button"
                      className={`recommendation-chip ${
                        notebookRecommendation === "skip" ? "is-active skip" : ""
                      }`.trim()}
                      onClick={() => onRecommendationChange("skip")}
                      role="radio"
                      aria-checked={notebookRecommendation === "skip"}
                    >
                      Skip
                    </button>
                    <button
                      type="button"
                      className={`recommendation-chip ${
                        notebookRecommendation === "undecided" ? "is-active undecided" : ""
                      }`.trim()}
                      onClick={() => onRecommendationChange("undecided")}
                      role="radio"
                      aria-checked={notebookRecommendation === "undecided"}
                    >
                      Undecided
                    </button>
                  </div>
                </label>
              </div>
              <form className="notebook-note-form" onSubmit={onAddNotebookNote}>
                <textarea
                  value={noteText}
                  onChange={(event) => {
                    setNoteText(event.target.value);
                    if (noteStatus) {
                      setNoteStatus("");
                    }
                  }}
                  placeholder={`Add your ReelNotes on ${title}`}
                  maxLength={500}
                  rows={3}
                />
                <div className="notebook-note-actions">
                  <button type="submit" className="row-more-btn">
                    Post Note
                  </button>
                  {noteStatus ? <span className="status-inline">{noteStatus}</span> : null}
                </div>
              </form>
              <div className="notebook-notes">
                {notebookNotes.length ? (
                  notebookNotes.map((note) => (
                    <article key={note.id} className="notebook-note">
                      <p>{note.text}</p>
                      <span>
                        {note.author || "ReelNotes User"} |{" "}
                        {new Date(note.createdAt).toLocaleDateString()}
                      </span>
                    </article>
                  ))
                ) : (
                  <p className="status-line">No ReelNotes yet. Be the first to add one.</p>
                )}
              </div>
            </section>
            {similar.length ? (
              <div className="similar-wrap">
                <p className="status-line">Similar Titles</p>
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
