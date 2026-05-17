// UI component: SearchBar.
import { useEffect, useMemo, useRef, useState } from "react";
import { searchMovieSuggestions } from "../api/tmdb";
import { clearRecentSearches, pushRecentSearch, readRecentSearches } from "../utils/library";
import { trackEvent } from "../utils/analytics";

export default function SearchBar({ onSearch }) {
  const [query, setQuery] = useState("");
  const [focused, setFocused] = useState(false);
  const [recent, setRecent] = useState(readRecentSearches());
  const [liveSuggestions, setLiveSuggestions] = useState([]);
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(-1);
  const [searchOpen, setSearchOpen] = useState(false);
  const inputRef = useRef(null);

  const filteredRecent = useMemo(
    () =>
      recent.filter((item) =>
        query.trim() ? item.toLowerCase().includes(query.trim().toLowerCase()) : true
      ),
    [recent, query]
  );

  useEffect(() => {
    const clean = query.trim();
    if (!clean || clean.length < 2) {
      return;
    }

    let cancelled = false;
    const timeout = window.setTimeout(async () => {
      try {
        const data = await searchMovieSuggestions(clean);
        const next = (data.results || [])
          .map((item) => item.title || item.name || "")
          .filter(Boolean)
          .slice(0, 5);
        if (!cancelled) {
          setLiveSuggestions(next);
        }
      } catch {
        if (!cancelled) {
          setLiveSuggestions([]);
        }
      }
    }, 260);

    return () => {
      cancelled = true;
      window.clearTimeout(timeout);
    };
  }, [query]);

  const suggestionItems = useMemo(() => {
    const seen = new Set();
    const merged = [];
    const cleanQuery = query.trim();
    filteredRecent.forEach((value) => {
      const key = value.toLowerCase();
      if (!seen.has(key)) {
        seen.add(key);
        merged.push({ value, source: "recent" });
      }
    });
    if (cleanQuery.length >= 2) {
      liveSuggestions.forEach((value) => {
        const key = value.toLowerCase();
        if (!seen.has(key)) {
          seen.add(key);
          merged.push({ value, source: "live" });
        }
      });
    }
    return merged.slice(0, 8);
  }, [filteredRecent, liveSuggestions, query]);

  function submit(event) {
    event.preventDefault();
    const clean = query.trim();

    if (!searchOpen) {
      setSearchOpen(true);
      window.setTimeout(() => inputRef.current?.focus(), 0);
      return;
    }

    if (!clean) {
      inputRef.current?.focus();
      return;
    }

    onSearch(clean);
    pushRecentSearch(clean);
    setRecent(readRecentSearches());
    trackEvent("search_submit", { query: clean });
    setFocused(false);
    setSearchOpen(false);
  }

  function chooseRecent(value) {
    setQuery(value);
    onSearch(value);
    pushRecentSearch(value);
    setRecent(readRecentSearches());
    setFocused(false);
    setSearchOpen(false);
  }

  function chooseSuggestion(item) {
    chooseRecent(item.value);
    trackEvent("search_suggestion_select", {
      source: item.source,
      query: item.value,
    });
  }

  function clearHistory() {
    clearRecentSearches();
    setRecent([]);
    setQuery("");
    onSearch("");
    setFocused(false);
    setSearchOpen(false);
    trackEvent("search_history_cleared");
  }

  function onInputKeyDown(event) {
    if (!suggestionItems.length) {
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setFocused(true);
      setActiveSuggestionIndex((current) =>
        current < suggestionItems.length - 1 ? current + 1 : 0
      );
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      setFocused(true);
      setActiveSuggestionIndex((current) =>
        current > 0 ? current - 1 : suggestionItems.length - 1
      );
      return;
    }

    if (event.key === "Enter" && activeSuggestionIndex >= 0) {
      event.preventDefault();
      chooseSuggestion(suggestionItems[activeSuggestionIndex]);
      return;
    }

    if (event.key === "Escape") {
      setFocused(false);
      if (!query.trim()) {
        setSearchOpen(false);
      }
    }
  }

  return (
    <form
      onSubmit={submit}
      className={`search-form ${searchOpen || focused || query.trim() ? "is-open" : ""}`.trim()}
      autoComplete="off"
    >
      <div className="search-form-fields">
        <input
          ref={inputRef}
          id="movie-search-input"
          role="combobox"
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setActiveSuggestionIndex(-1);
          }}
          onFocus={() => {
            setFocused(true);
            setSearchOpen(true);
          }}
          onBlur={() =>
            window.setTimeout(() => {
              setFocused(false);
              if (!query.trim()) {
                setSearchOpen(false);
              }
            }, 120)
          }
          onKeyDown={onInputKeyDown}
          placeholder="Search movies, trailers, notes"
          aria-label="Search movies, trailers, notes"
          aria-haspopup="listbox"
          aria-expanded={focused && suggestionItems.length > 0}
          aria-controls="movie-search-suggestions"
          aria-activedescendant={
            activeSuggestionIndex >= 0 ? `movie-search-option-${activeSuggestionIndex}` : undefined
          }
        />
        <button type="submit" aria-label="Search">
          <svg aria-hidden="true" viewBox="0 0 24 24">
            <circle cx="10.5" cy="10.5" r="6.5" />
            <path d="m15.4 15.4 5.1 5.1" />
          </svg>
        </button>
      </div>
      {focused && suggestionItems.length ? (
        <div
          className="search-suggestions"
          role="listbox"
          id="movie-search-suggestions"
          aria-label="Search suggestions"
        >
          <div className="search-suggestions-head">
            <span>Suggestions</span>
            <button
              type="button"
              className="search-clear-history"
              onPointerDown={(event) => event.preventDefault()}
              onClick={clearHistory}
              aria-label="Clear search history"
              title="Clear search history"
            >
              <svg aria-hidden="true" viewBox="0 0 24 24" width="14" height="14">
                <path
                  d="M9 3h6l1 2h4v2H4V5h4l1-2Zm-2 6h2v9H7V9Zm4 0h2v9h-2V9Zm4 0h2v9h-2V9Z"
                  fill="currentColor"
                />
              </svg>
            </button>
          </div>
          {suggestionItems.map((item, index) => (
            <button
              key={`${item.source}-${item.value}`}
              type="button"
              className="search-suggestion"
              role="option"
              id={`movie-search-option-${index}`}
              aria-selected={index === activeSuggestionIndex}
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => chooseSuggestion(item)}
            >
              {item.value}
            </button>
          ))}
        </div>
      ) : null}
    </form>
  );
}
