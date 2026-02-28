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
    <form onSubmit={submit} className="relative" autoComplete="off">
      <button
        type="button"
        className="flex h-9 w-9 items-center justify-center rounded-full border border-[var(--border)] bg-white/8 text-xs text-[var(--text)] sm:hidden"
        aria-label={mobileOpen ? "Close search" : "Open search"}
        onClick={() => setMobileOpen((prev) => !prev)}
      >
        <span aria-hidden="true">Find</span>
      </button>

      <div
        className={`gap-2 sm:flex ${
          mobileOpen ? "absolute right-0 top-11 z-30 flex w-[min(92vw,340px)] rounded-xl border border-white/12 bg-[#181a20] p-2" : "hidden"
        } sm:static sm:w-auto sm:rounded-none sm:border-0 sm:bg-transparent sm:p-0`}
      >
        <input
          ref={inputRef}
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => window.setTimeout(() => setFocused(false), 120)}
          placeholder="Search movies"
          aria-label="Search movies"
          className="w-full rounded-full border border-[var(--border)] bg-white/8 px-4 py-2 text-sm text-[var(--text)] outline-none focus:border-[rgba(229,9,20,0.65)] sm:w-[270px]"
        />
        <button
          type="submit"
          className="cursor-pointer rounded-full bg-[var(--brand)] px-4 py-2 text-sm font-bold text-white transition hover:bg-[var(--brand-dark)]"
        >
          Search
        </button>
      </div>

      {focused && filteredRecent.length ? (
        <div
          className="absolute left-0 top-[calc(100%+0.3rem)] z-[120] grid w-full gap-1 rounded-xl border border-white/14 bg-[#181a20] p-1 sm:w-[270px]"
          role="listbox"
          aria-label="Recent searches"
        >
          {filteredRecent.map((item) => (
            <button
              key={item}
              type="button"
              className="cursor-pointer rounded-lg px-2 py-1.5 text-left text-sm text-[var(--text)] hover:bg-white/10"
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
