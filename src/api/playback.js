const PLAYBACK_API_BASE_URL = import.meta.env.VITE_PLAYBACK_API_BASE_URL || "";
const PLAYBACK_API_KEY = import.meta.env.VITE_PLAYBACK_API_KEY || "";
const DEMO_PLAYBACK_MP4_SRC =
  import.meta.env.VITE_PLAYBACK_DEMO_MP4_SRC ||
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4";
const DEMO_PLAYBACK_POSTER =
  import.meta.env.VITE_PLAYBACK_DEMO_POSTER ||
  "https://peach.blender.org/wp-content/uploads/title_anouncement.jpg";

export const isPlaybackEnabled = Boolean(PLAYBACK_API_BASE_URL || DEMO_PLAYBACK_MP4_SRC);

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

function getDemoPlayback() {
  if (!DEMO_PLAYBACK_MP4_SRC) {
    return null;
  }

  return {
    type: "mp4",
    src: DEMO_PLAYBACK_MP4_SRC,
    poster: DEMO_PLAYBACK_POSTER,
    provider: "Demo Licensed Catalog",
    region: "Global",
    expiresAt: "",
  };
}

export async function fetchLicensedPlaybackSession(movieId) {
  if (!PLAYBACK_API_BASE_URL) {
    return getDemoPlayback();
  }

  const response = await fetch(
    `${PLAYBACK_API_BASE_URL}/v1/playback/movie/${movieId}`,
    {
      method: "GET",
      headers: buildPlaybackHeaders(),
    }
  );

  if (response.status === 204 || response.status === 404) {
    return getDemoPlayback();
  }

  if (!response.ok) {
    throw new Error(`Playback request failed: ${response.status}`);
  }

  const payload = await response.json();
  return normalizePlayback(payload) || getDemoPlayback();
}
