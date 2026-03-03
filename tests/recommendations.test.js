// Automated tests for recommendations.test behavior.
import test from "node:test";
import assert from "node:assert/strict";
import {
  buildRecommendationSeeds,
  rankSimilarRecommendations,
} from "../src/utils/recommendations.js";

test("buildRecommendationSeeds merges continue watching and my list without duplicates", () => {
  const continueWatching = [
    { id: 1, mediaType: "movie", title: "One" },
    { id: 2, mediaType: "tv", name: "Two" },
  ];
  const myList = [
    { id: 1, mediaType: "movie", title: "One Again" },
    { id: 3, mediaType: "movie", title: "Three" },
  ];

  const seeds = buildRecommendationSeeds(continueWatching, myList, 5);
  assert.deepEqual(
    seeds.map((item) => `${item.mediaType}:${item.id}`),
    ["movie:1", "tv:2", "movie:3"]
  );
});

test("rankSimilarRecommendations prioritizes repeated similar titles and excludes seeds", () => {
  const seeds = [
    { id: 10, mediaType: "movie" },
    { id: 20, mediaType: "movie" },
  ];
  const groups = [
    {
      seed: seeds[0],
      items: [
        { id: 100, title: "Shared Pick" },
        { id: 101, title: "Single Pick A" },
      ],
    },
    {
      seed: seeds[1],
      items: [
        { id: 100, title: "Shared Pick" },
        { id: 20, title: "Seed Should Be Excluded" },
        { id: 102, title: "Single Pick B" },
      ],
    },
  ];

  const ranked = rankSimilarRecommendations(groups, seeds, 10);

  assert.equal(ranked[0].id, 100);
  assert.equal(ranked.some((item) => item.id === 20), false);
});
