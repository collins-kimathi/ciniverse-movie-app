const MY_LIST_KEY = "ciniverse.my_list";
const CONTINUE_WATCHING_KEY = "ciniverse.continue_watching";

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
  return readJson(MY_LIST_KEY, []);
}

export function isInMyList(id) {
  return readMyList().some((item) => item.id === id);
}

export function toggleMyList(item) {
  const list = readMyList();
  const exists = list.some((entry) => entry.id === item.id && entry.mediaType === item.mediaType);
  const next = exists
    ? list.filter((entry) => !(entry.id === item.id && entry.mediaType === item.mediaType))
    : [{ ...item, savedAt: new Date().toISOString() }, ...list];
  writeJson(MY_LIST_KEY, next.slice(0, 200));
  return !exists;
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
