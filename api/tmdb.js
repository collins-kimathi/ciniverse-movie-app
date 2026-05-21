// Serverless TMDB proxy. Keeps TMDB credentials out of the browser bundle.
const TMDB_BASE_URL = "https://api.themoviedb.org/3";
const TMDB_API_KEY = process.env.TMDB_API_KEY || process.env.VITE_TMDB_API_KEY || "";
const TMDB_BEARER_TOKEN =
  process.env.TMDB_BEARER_TOKEN || process.env.VITE_TMDB_BEARER_TOKEN || "";

const ALLOWED_PATH_PATTERN = /^\/[a-z0-9_/-]+(?:\?[a-z0-9_.,/%=&:-]+)?$/i;

function withCors(res) {
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

function getRequestedPath(req) {
  const path = Array.isArray(req.query?.path) ? req.query.path[0] : req.query?.path;
  if (typeof path !== "string" || !ALLOWED_PATH_PATTERN.test(path)) {
    return "";
  }
  return path;
}

function createTmdbUrl(path) {
  if (TMDB_BEARER_TOKEN) {
    return `${TMDB_BASE_URL}${path}`;
  }

  const separator = path.includes("?") ? "&" : "?";
  return `${TMDB_BASE_URL}${path}${separator}api_key=${TMDB_API_KEY}`;
}

function createTmdbOptions() {
  if (!TMDB_BEARER_TOKEN) {
    return {
      headers: {
        accept: "application/json",
      },
    };
  }

  return {
    headers: {
      accept: "application/json",
      Authorization: `Bearer ${TMDB_BEARER_TOKEN}`,
    },
  };
}

async function parseJson(response) {
  try {
    return await response.json();
  } catch {
    return null;
  }
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

  if (!TMDB_BEARER_TOKEN && !TMDB_API_KEY) {
    res.status(500).json({
      error:
        "TMDB credentials are not configured. Add TMDB_BEARER_TOKEN to .env.local and restart the dev server.",
    });
    return;
  }

  const path = getRequestedPath(req);
  if (!path) {
    res.status(422).json({ error: "Invalid TMDB path" });
    return;
  }

  try {
    const response = await fetch(createTmdbUrl(path), createTmdbOptions());
    const payload = await parseJson(response);

    res.status(response.status).json(payload || { error: "TMDB returned an empty response" });
  } catch (error) {
    res.status(502).json({ error: error?.message || "TMDB proxy request failed" });
  }
}
