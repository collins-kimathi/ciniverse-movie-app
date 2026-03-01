const MY_LIST_KEY = "ciniverse.my_list";
const CONTINUE_WATCHING_KEY = "ciniverse.continue_watching";
const RECENT_SEARCHES_KEY = "ciniverse.recent_searches";
const LIST_CATEGORY_VALUES = ["watch-soon", "favorites", "completed"];

function readJson(key, fallback) {
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) {
      return fallback;
    }
    const parsed = JSON.parse(raw);
    return parsed ?? fallback;
  } catch {
    return fallback;
  }
}

function writeJson(key, value) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Best effort only.
  }
}

export function readMyList() {
  return readJson(MY_LIST_KEY, []).map((item) => ({
    ...item,
    category: LIST_CATEGORY_VALUES.includes(item?.category) ? item.category : "watch-soon",
  }));
}

export function isInMyList(id) {
  return readMyList().some((item) => item.id === id);
}

export function toggleMyList(item) {
  const list = readMyList();
  const exists = list.some((entry) => entry.id === item.id && entry.mediaType === item.mediaType);
  const next = exists
    ? list.filter((entry) => !(entry.id === item.id && entry.mediaType === item.mediaType))
    : [{ ...item, category: "watch-soon", savedAt: new Date().toISOString() }, ...list];
  writeJson(MY_LIST_KEY, next.slice(0, 200));
  return !exists;
}

export function updateMyListCategory(id, mediaType, category) {
  const nextCategory = LIST_CATEGORY_VALUES.includes(category) ? category : "watch-soon";
  const list = readMyList();
  const next = list.map((item) =>
    item.id === id && (item.mediaType || "movie") === (mediaType || "movie")
      ? { ...item, category: nextCategory }
      : item
  );
  writeJson(MY_LIST_KEY, next);
}

export function readContinueWatching() {
  return readJson(CONTINUE_WATCHING_KEY, []);
}

export function upsertContinueWatching(entry) {
  const list = readContinueWatching();
  const next = [
    { ...entry, updatedAt: new Date().toISOString() },
    ...list.filter(
      (item) => !(item.id === entry.id && item.mediaType === entry.mediaType)
    ),
  ].slice(0, 120);
  writeJson(CONTINUE_WATCHING_KEY, next);
}

export function getContinueWatchingEntry(id, mediaType = "movie") {
  return readContinueWatching().find(
    (item) => item.id === id && (item.mediaType || "movie") === mediaType
  );
}

export function readRecentSearches() {
  return readJson(RECENT_SEARCHES_KEY, []);
}

export function pushRecentSearch(query) {
  const clean = (query || "").trim();
  if (!clean) {
    return;
  }
  const list = readRecentSearches();
  const next = [clean, ...list.filter((item) => item.toLowerCase() !== clean.toLowerCase())].slice(
    0,
    8
  );
  writeJson(RECENT_SEARCHES_KEY, next);
}

export function clearRecentSearches() {
  writeJson(RECENT_SEARCHES_KEY, []);
}
