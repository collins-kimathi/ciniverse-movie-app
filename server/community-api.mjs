// Local Node server for community notes/ratings APIs.
import { createServer } from "node:http";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dataDir = path.join(__dirname, "data");
const dataFile = path.join(dataDir, "community.json");
const port = Number(process.env.PORT || 8787);

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}

function sendJson(res, status, payload) {
  res.writeHead(status, {
    "Content-Type": "application/json",
    ...corsHeaders(),
  });
  res.end(JSON.stringify(payload));
}

async function ensureStoreFile() {
  await mkdir(dataDir, { recursive: true });
  try {
    await readFile(dataFile, "utf8");
  } catch {
    await writeFile(dataFile, JSON.stringify({}), "utf8");
  }
}

async function readStore() {
  await ensureStoreFile();
  try {
    const raw = await readFile(dataFile, "utf8");
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

async function writeStore(store) {
  await ensureStoreFile();
  await writeFile(dataFile, JSON.stringify(store, null, 2), "utf8");
}

function keyOf(mediaType, id) {
  return `${mediaType}:${id}`;
}

function emptyEntry(mediaType, id) {
  return {
    mediaType,
    id,
    notes: [],
    ratings: {
      totalRatings: 0,
      sumRatings: 0,
      counts: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
    },
    updatedAt: new Date().toISOString(),
  };
}

function toPublicEntry(entry) {
  const totalRatings = Number(entry?.ratings?.totalRatings || 0);
  const sumRatings = Number(entry?.ratings?.sumRatings || 0);
  const averageRating = totalRatings > 0 ? Number((sumRatings / totalRatings).toFixed(2)) : 0;
  return {
    notes: Array.isArray(entry?.notes) ? entry.notes : [],
    ratings: {
      totalRatings,
      averageRating,
      counts: entry?.ratings?.counts || { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
    },
    updatedAt: entry?.updatedAt || new Date().toISOString(),
  };
}

function parseRoute(urlPath) {
  const match = urlPath.match(
    /^\/v1\/community\/(movie|tv)\/(\d+)(?:\/(notes|ratings))?$/
  );
  if (!match) {
    return null;
  }
  return {
    mediaType: match[1],
    id: Number(match[2]),
    action: match[3] || "read",
  };
}

async function readBody(req) {
  let body = "";
  for await (const chunk of req) {
    body += chunk;
    if (body.length > 2_000_000) {
      throw new Error("Body too large");
    }
  }
  if (!body) {
    return {};
  }
  return JSON.parse(body);
}

const server = createServer(async (req, res) => {
  if (!req.url || !req.method) {
    sendJson(res, 400, { error: "Bad request" });
    return;
  }

  if (req.method === "OPTIONS") {
    res.writeHead(204, corsHeaders());
    res.end();
    return;
  }

  if (req.method === "GET" && req.url === "/health") {
    sendJson(res, 200, { ok: true });
    return;
  }

  const route = parseRoute(req.url);
  if (!route) {
    sendJson(res, 404, { error: "Not found" });
    return;
  }

  try {
    const store = await readStore();
    const storeKey = keyOf(route.mediaType, route.id);
    const current = store[storeKey] || emptyEntry(route.mediaType, route.id);

    if (req.method === "GET" && route.action === "read") {
      sendJson(res, 200, toPublicEntry(current));
      return;
    }

    if (req.method !== "POST") {
      sendJson(res, 405, { error: "Method not allowed" });
      return;
    }

    const body = await readBody(req);

    if (route.action === "notes") {
      const text = String(body?.text || "").trim().slice(0, 500);
      const author = String(body?.author || "ReelNotes User").trim().slice(0, 32);
      if (!text) {
        sendJson(res, 422, { error: "Note text is required" });
        return;
      }
      const note = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
        text,
        author: author || "ReelNotes User",
        createdAt: new Date().toISOString(),
      };
      current.notes = [note, ...(current.notes || [])].slice(0, 500);
      current.updatedAt = new Date().toISOString();
      store[storeKey] = current;
      await writeStore(store);
      sendJson(res, 201, toPublicEntry(current));
      return;
    }

    if (route.action === "ratings") {
      const rating = Number(body?.rating);
      if (!Number.isFinite(rating) || rating < 1 || rating > 5) {
        sendJson(res, 422, { error: "Rating must be between 1 and 5" });
        return;
      }
      const rounded = Math.round(rating);
      current.ratings = current.ratings || {
        totalRatings: 0,
        sumRatings: 0,
        counts: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
      };
      current.ratings.totalRatings += 1;
      current.ratings.sumRatings += rounded;
      current.ratings.counts[rounded] = Number(current.ratings.counts[rounded] || 0) + 1;
      current.updatedAt = new Date().toISOString();
      store[storeKey] = current;
      await writeStore(store);
      sendJson(res, 201, toPublicEntry(current));
      return;
    }

    sendJson(res, 404, { error: "Unsupported action" });
  } catch (error) {
    sendJson(res, 500, { error: error?.message || "Server error" });
  }
});

server.listen(port, () => {
  console.log(`Community API running on http://localhost:${port}`);
});
