// Automated tests for streaming URL helpers.
import test from "node:test";
import assert from "node:assert/strict";
import { buildVidkingUrl } from "../src/utils/streaming.js";

test("buildVidkingUrl creates movie embed URLs", () => {
  const url = new URL(buildVidkingUrl({ id: 603, mediaType: "movie" }));

  assert.equal(url.origin, "https://www.vidking.net");
  assert.equal(url.pathname, "/embed/movie/603");
  assert.equal(url.searchParams.get("autoPlay"), "true");
  assert.equal(url.searchParams.get("color"), "e50914");
});

test("buildVidkingUrl creates tv embed URLs with season and episode selectors", () => {
  const url = new URL(buildVidkingUrl({ id: 1399, mediaType: "tv", season: 3, episode: 4 }));

  assert.equal(url.pathname, "/embed/tv/1399/3/4");
  assert.equal(url.searchParams.get("nextEpisode"), "true");
  assert.equal(url.searchParams.get("episodeSelector"), "true");
});
