// Serverless Streaming Availability proxy. Keeps RapidAPI credentials server-side.
const STREAMING_AVAILABILITY_BASE_URL =
  process.env.STREAMING_AVAILABILITY_BASE_URL ||
  "https://streaming-availability.p.rapidapi.com";
const STREAMING_AVAILABILITY_API_KEY = process.env.STREAMING_AVAILABILITY_API_KEY || "";
const STREAMING_AVAILABILITY_API_HOST =
  process.env.STREAMING_AVAILABILITY_API_HOST || "streaming-availability.p.rapidapi.com";

function getScalar(value) {
  return Array.isArray(value) ? value[0] : value;
}

function createHeaders() {
  return {
    accept: "application/json",
    "X-RapidAPI-Key": STREAMING_AVAILABILITY_API_KEY,
    "X-RapidAPI-Host": STREAMING_AVAILABILITY_API_HOST,
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

  if (!STREAMING_AVAILABILITY_API_KEY) {
    res.status(204).end();
    return;
  }

  const mediaType = getScalar(req.query?.mediaType) === "tv" ? "tv" : "movie";
  const id = Number(getScalar(req.query?.id));
  const country = String(getScalar(req.query?.country) || "us").toLowerCase();
  const outputLanguage = String(getScalar(req.query?.output_language) || "en");

  if (!Number.isFinite(id) || id <= 0 || !/^[a-z]{2}$/.test(country)) {
    res.status(422).json({ error: "Invalid mediaType, id, or country" });
    return;
  }

  const showId = encodeURIComponent(`${mediaType}/${id}`);
  const query = new URLSearchParams({
    country,
    output_language: outputLanguage,
  });

  try {
    const response = await fetch(
      `${STREAMING_AVAILABILITY_BASE_URL}/shows/${showId}?${query.toString()}`,
      {
        method: "GET",
        headers: createHeaders(),
      }
    );
    const payload = await parseJson(response);

    if (response.status === 204 || response.status === 404) {
      res.status(response.status).end();
      return;
    }

    res.status(response.status).json(payload || { error: "Provider returned an empty response" });
  } catch (error) {
    res.status(502).json({ error: error?.message || "Streaming availability request failed" });
  }
}
