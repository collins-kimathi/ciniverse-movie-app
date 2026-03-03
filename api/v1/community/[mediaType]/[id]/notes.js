// Serverless community endpoint handler for notes.
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
  const text = String(body?.text || "").trim().slice(0, 500);
  const author = String(body?.author || "ReelNotes User").trim().slice(0, 32) || "ReelNotes User";
  if (!text) {
    res.status(422).json({ error: "Note text is required" });
    return;
  }
  try {
    const entry = await readEntry(params.mediaType, params.id);
    entry.notes = [
      {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
        text,
        author,
        createdAt: new Date().toISOString(),
      },
      ...(Array.isArray(entry.notes) ? entry.notes : []),
    ].slice(0, 500);
    entry.updatedAt = new Date().toISOString();
    await writeEntry(params.mediaType, params.id, entry);
    res.status(201).json(toPublicEntry(entry));
  } catch (error) {
    res.status(500).json({ error: error?.message || "Server error" });
  }
}

