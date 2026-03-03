// Serverless community endpoint handler for [id].
import { readEntry, toPublicEntry } from "../../../../_lib/communityStore.js";

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

export default async function handler(req, res) {
  withCors(res);
  if (req.method === "OPTIONS") {
    res.status(204).end();
    return;
  }
  if (req.method !== "GET") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }
  const params = validateParams(req);
  if (!params) {
    res.status(422).json({ error: "Invalid mediaType or id" });
    return;
  }
  try {
    const entry = await readEntry(params.mediaType, params.id);
    res.status(200).json(toPublicEntry(entry));
  } catch (error) {
    res.status(500).json({ error: error?.message || "Server error" });
  }
}

