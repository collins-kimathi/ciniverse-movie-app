import { useEffect, useMemo, useRef, useState } from "react";
import { pushRecentSearch, readRecentSearches } from "../utils/library";
import { trackEvent } from "../utils/analytics";

export default function SearchBar({ onSearch }) {
  const [query, setQuery] = useState("");
  const [focused, setFocused] = useState(false);
  const [recent, setRecent] = useState([]);
  const [mobileOpen, setMobileOpen] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    setRecent(readRecentSearches());
  }, []);

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
        <span aria-hidden="true">Find</span>
      </button>
      <div className="search-form-fields">
        <input
          ref={inputRef}
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => window.setTimeout(() => setFocused(false), 120)}
          placeholder="Search movies"
          aria-label="Search movies"
        />
        <button type="submit">Search</button>
      </div>
      {focused && filteredRecent.length ? (
        <div className="search-suggestions" role="listbox" aria-label="Recent searches">
          {filteredRecent.map((item) => (
            <button
              key={item}
              type="button"
              className="search-suggestion"
              onClick={() => chooseRecent(item)}
            >
              {item}
            </button>
          ))}
        </div>
      ) : null}
    </form>
  );
}
