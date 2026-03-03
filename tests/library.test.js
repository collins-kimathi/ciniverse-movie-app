// Automated tests for library.test behavior.
import test from "node:test";
import assert from "node:assert/strict";
import {
  pushRecentSearch,
  readRecentSearches,
  toggleMyList,
  readMyList,
  upsertContinueWatching,
  readContinueWatching,
} from "../src/utils/library.js";

function createStorage() {
  const map = new Map();
  return {
    getItem(key) {
      return map.has(key) ? map.get(key) : null;
    },
    setItem(key, value) {
      map.set(key, String(value));
    },
    clear() {
      map.clear();
    },
  };
}

test("library persists my list, continue watching, and recent search", () => {
  global.window = { localStorage: createStorage() };

  pushRecentSearch("batman");
  pushRecentSearch("dune");
  pushRecentSearch("batman");
  assert.deepEqual(readRecentSearches(), ["batman", "dune"]);

  const added = toggleMyList({ id: 42, mediaType: "movie", title: "Interstellar" });
  assert.equal(added, true);
  assert.equal(readMyList().length, 1);

  const removed = toggleMyList({ id: 42, mediaType: "movie", title: "Interstellar" });
  assert.equal(removed, false);
  assert.equal(readMyList().length, 0);

  upsertContinueWatching({ id: 9, mediaType: "movie", title: "Tenet", resumeSeconds: 32 });
  assert.equal(readContinueWatching()[0].id, 9);
});
