import { readEntry, toPublicEntry, writeEntry } from "../../../../../_lib/communityStore.js";

function withCors(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

function validateParams(req) {
  const mediaType = req.query?.mediaType;
  const id = Number(req.query?.id);
  if ((mediaType !== "movie" && mediaType !== "tv") || !Number.isFinite(id)) {
    return null;
  }
  return { mediaType, id };
}

function getBody(req) {
  if (req.body && typeof req.body === "object") {
    return req.body;
  }
  if (typeof req.body === "string") {
    try {
      return JSON.parse(req.body);
    } catch {
      return {};
    }
  }
  return {};
}

export default async function handler(req, res) {
  withCors(res);
  if (req.method === "OPTIONS") {
    res.status(204).end();
    return;
  }
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }
  const params = validateParams(req);
  if (!params) {
    res.status(422).json({ error: "Invalid mediaType or id" });
    return;
  }
  const body = getBody(req);
  const rawRating = Number(body?.rating);
  if (!Number.isFinite(rawRating) || rawRating < 1 || rawRating > 5) {
    res.status(422).json({ error: "Rating must be between 1 and 5" });
    return;
  }
  const rating = Math.round(rawRating);
  try {
    const entry = await readEntry(params.mediaType, params.id);
    entry.ratings = entry.ratings || {
      totalRatings: 0,
      sumRatings: 0,
      counts: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
    };
    entry.ratings.totalRatings = Number(entry.ratings.totalRatings || 0) + 1;
    entry.ratings.sumRatings = Number(entry.ratings.sumRatings || 0) + rating;
    entry.ratings.counts = entry.ratings.counts || { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    entry.ratings.counts[rating] = Number(entry.ratings.counts[rating] || 0) + 1;
    entry.updatedAt = new Date().toISOString();
    await writeEntry(params.mediaType, params.id, entry);
    res.status(201).json(toPublicEntry(entry));
  } catch (error) {
    res.status(500).json({ error: error?.message || "Server error" });
  }
}

