// Automated tests for smoke.test behavior.
import test from "node:test";
import assert from "node:assert/strict";
import { appConfig, uiLabels } from "../src/config/appConfig.js";
import { GENRE_SECTIONS } from "../src/config/genres.js";

test("config smoke checks", () => {
  assert.ok(appConfig.siteName);
  assert.ok(uiLabels.watchFullMovie);
  assert.ok(Array.isArray(GENRE_SECTIONS));
  assert.ok(GENRE_SECTIONS.length >= 4);
});
