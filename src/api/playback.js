const PLAYBACK_API_BASE_URL = import.meta.env.VITE_PLAYBACK_API_BASE_URL || "";
const PLAYBACK_API_KEY = import.meta.env.VITE_PLAYBACK_API_KEY || "";

export const isPlaybackEnabled = Boolean(PLAYBACK_API_BASE_URL);

function buildPlaybackHeaders() {
  const headers = {
    accept: "application/json",
  };

  if (PLAYBACK_API_KEY) {
    headers["x-api-key"] = PLAYBACK_API_KEY;
  }

  return headers;
}

function normalizePlayback(payload) {
  if (!payload || typeof payload !== "object") {
    return null;
  }

  const stream = payload.playback || payload.stream || payload;
  if (!stream?.src || typeof stream.src !== "string") {
    return null;
  }

  return {
    type: stream.type || "iframe",
    src: stream.src,
    poster: stream.poster || "",
    provider: payload.provider || "Licensed provider",
    region: payload.region || "US",
    expiresAt: payload.expiresAt || "",
  };
}

export async function fetchLicensedPlaybackSession(movieId) {
  if (!PLAYBACK_API_BASE_URL) {
    return null;
  }

  const response = await fetch(
    `${PLAYBACK_API_BASE_URL}/v1/playback/movie/${movieId}`,
    {
      method: "GET",
      headers: buildPlaybackHeaders(),
    }
  );

  if (response.status === 204 || response.status === 404) {
    return null;
  }

  if (!response.ok) {
    throw new Error(`Playback request failed: ${response.status}`);
  }

  const payload = await response.json();
  return normalizePlayback(payload);
}
