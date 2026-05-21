// Automated tests for playable title search normalization.
import test from "node:test";
import assert from "node:assert/strict";
import { normalizePlayableSearchResults } from "../src/api/tmdb.js";

test("normalizePlayableSearchResults keeps only movie and tv results for Vidking playback", () => {
  const results = normalizePlayableSearchResults([
    { id: 1, media_type: "movie", title: "Vikings Movie" },
    { id: 2, media_type: "tv", name: "Vikings" },
    { id: 3, media_type: "person", name: "Actor" },
    { id: 2, media_type: "tv", name: "Duplicate Vikings" },
  ]);

  assert.deepEqual(
    results.map((item) => `${item.mediaType}:${item.id}`),
    ["movie:1", "tv:2"]
  );
});
