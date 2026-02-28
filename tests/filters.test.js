import test from "node:test";
import assert from "node:assert/strict";
import { applyFilters } from "../src/utils/filters.js";

test("applyFilters enforces year/rating/language", () => {
  const movies = [
    { id: 1, release_date: "2023-01-10", vote_average: 7.5, original_language: "en" },
    { id: 2, release_date: "2014-05-11", vote_average: 8.1, original_language: "ja" },
    { id: 3, release_date: "2007-09-03", vote_average: 6.2, original_language: "en" },
  ];

  const only2020s = applyFilters(movies, { year: "2020s", minRating: 0, language: "all" });
  assert.deepEqual(only2020s.map((m) => m.id), [1]);

  const highRated = applyFilters(movies, { year: "all", minRating: 7, language: "all" });
  assert.deepEqual(highRated.map((m) => m.id), [1, 2]);

  const englishOnly = applyFilters(movies, { year: "all", minRating: 0, language: "en" });
  assert.deepEqual(englishOnly.map((m) => m.id), [1, 3]);
});
