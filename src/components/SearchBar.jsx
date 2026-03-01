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
  const [mobileOpen, setMobileOpen] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    const clean = query.trim();
    if (!clean) {
      return undefined;
    }

    const timeout = window.setTimeout(() => {
      onSearch(clean);
      pushRecentSearch(clean);
      setRecent(readRecentSearches());
      trackEvent("search_debounced", { query: clean });
    }, 400);

    return () => window.clearTimeout(timeout);
  }, [query, onSearch]);

  useEffect(() => {
    if (!mobileOpen) {
      return;
    }
    window.setTimeout(() => {
      inputRef.current?.focus();
    }, 0);
  }, [mobileOpen]);

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
    onSearch(clean);
    if (clean) {
      pushRecentSearch(clean);
      setRecent(readRecentSearches());
      trackEvent("search_submit", { query: clean });
    }
    setFocused(false);
    setMobileOpen(false);
  }

  function chooseRecent(value) {
    setQuery(value);
    onSearch(value);
    pushRecentSearch(value);
    setRecent(readRecentSearches());
    setFocused(false);
    setMobileOpen(false);
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
    }
  }

  return (
    <form
      onSubmit={submit}
      className={`search-form ${mobileOpen ? "mobile-open" : ""}`}
      autoComplete="off"
    >
      <button
        type="button"
        className="mobile-search-toggle"
        aria-label={mobileOpen ? "Close search" : "Open search"}
        onClick={() => setMobileOpen((prev) => !prev)}
      >
        <svg aria-hidden="true" viewBox="0 0 24 24" width="18" height="18">
          <circle cx="10" cy="10" r="6.5" fill="none" stroke="#ff3a45" strokeWidth="3.2" />
          <path
            d="M14.8 14.8 20.8 20.8"
            stroke="#ff3a45"
            strokeWidth="3.4"
            strokeLinecap="round"
          />
        </svg>
      </button>
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
          onFocus={() => setFocused(true)}
          onBlur={() => window.setTimeout(() => setFocused(false), 120)}
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
        <button type="submit">Search</button>
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
