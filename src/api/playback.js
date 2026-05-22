// Frontend API client helpers for playback.
const PLAYBACK_API_BASE_URL = (import.meta.env.VITE_PLAYBACK_API_BASE_URL || "/api/playback").replace(
  /\/$/,
  ""
);

export const isPlaybackEnabled = import.meta.env.VITE_PLAYBACK_ENABLED !== "false";

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
  if (!isPlaybackEnabled) {
    return null;
  }

  const query = new URLSearchParams({ movieId });
  const response = await fetch(`${PLAYBACK_API_BASE_URL}?${query.toString()}`);

  if (response.status === 204 || response.status === 404) {
    return null;
  }

  if (!response.ok) {
    let message = `Playback request failed: ${response.status}`;
    try {
      const payload = await response.json();
      message = payload?.error || message;
    } catch {
      // Keep the status-based message when the response body is not JSON.
    }
    throw new Error(message);
  }

  const payload = await response.json();
  return normalizePlayback(payload);
}
