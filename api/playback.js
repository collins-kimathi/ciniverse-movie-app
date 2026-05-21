// Serverless playback proxy. Keeps optional playback backend keys server-side.
const PLAYBACK_API_BASE_URL = (process.env.PLAYBACK_API_BASE_URL || "").replace(/\/$/, "");
const PLAYBACK_API_KEY = process.env.PLAYBACK_API_KEY || "";

function getScalar(value) {
  return Array.isArray(value) ? value[0] : value;
}

function createHeaders() {
  const headers = {
    accept: "application/json",
  };

  if (PLAYBACK_API_KEY) {
    headers["x-api-key"] = PLAYBACK_API_KEY;
  }

  return headers;
}

async function parseJson(response) {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.status(204).end();
    return;
  }

  if (req.method !== "GET") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  if (!PLAYBACK_API_BASE_URL) {
    res.status(204).end();
    return;
  }

  const movieId = Number(getScalar(req.query?.movieId));
  if (!Number.isFinite(movieId) || movieId <= 0) {
    res.status(422).json({ error: "Invalid movieId" });
    return;
  }

  try {
    const response = await fetch(`${PLAYBACK_API_BASE_URL}/v1/playback/movie/${movieId}`, {
      method: "GET",
      headers: createHeaders(),
    });
    const payload = await parseJson(response);

    if (response.status === 204 || response.status === 404) {
      res.status(response.status).end();
      return;
    }

    res.status(response.status).json(payload || { error: "Playback provider returned an empty response" });
  } catch (error) {
    res.status(502).json({ error: error?.message || "Playback request failed" });
  }
}
