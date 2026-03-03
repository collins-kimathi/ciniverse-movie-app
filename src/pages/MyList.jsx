// Page component for the MyList view and its data wiring.
import { useEffect, useMemo, useState } from "react";
import { IMG_BASE } from "../api/tmdb";
import MovieModal from "../components/MovieModal";
import { readMyList, updateMyListCategory } from "../utils/library";
import { trackEvent } from "../utils/analytics";

const CATEGORY_OPTIONS = [
  { key: "all", label: "All" },
  { key: "watch-soon", label: "Watch Soon" },
  { key: "favorites", label: "Favorites" },
  { key: "completed", label: "Completed" },
];

export default function MyList({ watchTarget = null, onConsumeWatchTarget = () => {} }) {
  const [list, setList] = useState(() => readMyList());
  const [selected, setSelected] = useState(null);
  const [folder, setFolder] = useState("all");
  const [sortBy, setSortBy] = useState("saved-desc");
  const [shareStatus, setShareStatus] = useState("");

  function refreshList() {
    setList(readMyList());
  }

  useEffect(() => {
    if (!watchTarget) {
      return;
    }
    setSelected({ id: watchTarget.id, mediaType: watchTarget.mediaType });
    onConsumeWatchTarget();
  }, [watchTarget, onConsumeWatchTarget]);

  const visibleList = useMemo(() => {
    const filtered = list.filter((item) => (folder === "all" ? true : item.category === folder));
    const next = [...filtered];
    next.sort((a, b) => {
      if (sortBy === "saved-asc") {
        return new Date(a.savedAt || 0).getTime() - new Date(b.savedAt || 0).getTime();
      }
      if (sortBy === "rating-desc") {
        return Number(b.vote_average || 0) - Number(a.vote_average || 0);
      }
      if (sortBy === "title-asc") {
        return (a.title || a.name || "").localeCompare(b.title || b.name || "");
      }
      return new Date(b.savedAt || 0).getTime() - new Date(a.savedAt || 0).getTime();
    });
    return next;
  }, [list, folder, sortBy]);

  function onFolderChange(nextFolder) {
    setFolder(nextFolder);
    trackEvent("my_list_filter_category", { category: nextFolder });
  }

  function onSortChange(event) {
    const nextSort = event.target.value;
    setSortBy(nextSort);
    trackEvent("my_list_sort", { sortBy: nextSort });
  }

  function onMoveCategory(item, nextCategory) {
    updateMyListCategory(item.id, item.mediaType || "movie", nextCategory);
    refreshList();
    trackEvent("my_list_move_category", {
      id: item.id,
      category: nextCategory,
      mediaType: item.mediaType || "movie",
    });
  }

  async function onShareList() {
    const lines = visibleList.slice(0, 40).map((item, index) => {
      const title = item.title || item.name || "Untitled";
      const year = (item.release_date || item.first_air_date || "").slice(0, 4) || "N/A";
      return `${index + 1}. ${title} (${year})`;
    });
    const text = lines.length
      ? `My Ciniverse list (${CATEGORY_OPTIONS.find((option) => option.key === folder)?.label || "All"}):\n${lines.join("\n")}`
      : "My Ciniverse list is currently empty.";
    const shareUrl = `${window.location.origin}/my-list`;
    try {
      if (navigator.share) {
        await navigator.share({
          title: "My Ciniverse List",
          text,
          url: shareUrl,
        });
        setShareStatus("Shared");
        trackEvent("my_list_share_native", { size: visibleList.length, folder });
      } else {
        await navigator.clipboard.writeText(`${text}\n${shareUrl}`);
        setShareStatus("Link copied");
        trackEvent("my_list_share_copy", { size: visibleList.length, folder });
      }
    } catch {
      setShareStatus("Share failed");
    }
  }

  return (
    <main className="main">
      <section className="rail-section">
        <h3>My List</h3>
        <div className="my-list-toolbar">
          <div className="my-list-filters" role="tablist" aria-label="My list folders">
            {CATEGORY_OPTIONS.map((option) => (
              <button
                key={option.key}
                type="button"
                role="tab"
                aria-selected={folder === option.key}
                className={`my-list-filter ${folder === option.key ? "active" : ""}`}
                onClick={() => onFolderChange(option.key)}
              >
                {option.label}
              </button>
            ))}
          </div>
          <div className="my-list-actions">
            <label htmlFor="my-list-sort" className="my-list-sort-label">
              Sort
            </label>
            <select id="my-list-sort" value={sortBy} onChange={onSortChange}>
              <option value="saved-desc">Recently Added</option>
              <option value="saved-asc">Oldest Added</option>
              <option value="rating-desc">Top Rated</option>
              <option value="title-asc">Title A-Z</option>
            </select>
            <button type="button" className="row-more-btn" onClick={onShareList}>
              Share List
            </button>
            {shareStatus ? <span className="status-inline">{shareStatus}</span> : null}
          </div>
        </div>

        {!visibleList.length ? <p className="empty-state">Your list is empty.</p> : null}
        {visibleList.length ? (
          <div className="grid">
            {visibleList.map((item) => {
              const title = item.title || item.name || "Untitled";
              const poster = item.poster_path
                ? `${IMG_BASE}${item.poster_path}`
                : "https://via.placeholder.com/300x450?text=No+Image";
              const year = (item.release_date || item.first_air_date || "").slice(0, 4) || "Unknown";
              const rating =
                typeof item.vote_average === "number" ? item.vote_average.toFixed(1) : "N/A";
              return (
                <article key={`${item.id}-${item.mediaType || "movie"}`} className="card list-card">
                  <button
                    type="button"
                    className="list-card-open"
                    onClick={() => setSelected(item)}
                    aria-label={`Open details for ${title}`}
                  >
                    <img src={poster} alt={title} loading="lazy" />
                  </button>
                  <div className="card-info">
                    <h3>{title}</h3>
                    <span>Rating: {rating}</span>
                    <span>{year}</span>
                    <div className="list-card-meta">
                      <label htmlFor={`category-${item.id}-${item.mediaType || "movie"}`}>Folder</label>
                      <select
                        id={`category-${item.id}-${item.mediaType || "movie"}`}
                        value={item.category || "watch-soon"}
                        onChange={(event) => onMoveCategory(item, event.target.value)}
                      >
                        <option value="watch-soon">Watch Soon</option>
                        <option value="favorites">Favorites</option>
                        <option value="completed">Completed</option>
                      </select>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        ) : null}
      </section>
      {selected ? (
        <MovieModal
          movie={selected}
          onClose={() => {
            setSelected(null);
            refreshList();
          }}
        />
      ) : null}
    </main>
  );
}
