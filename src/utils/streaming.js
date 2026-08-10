// Helpers for embedded playback providers.
const VIDKING_BASE_URL = "https://www.vidking.net/embed";
const VIDKING_COLOR = "e50914";

function getProgressSeconds(progress) {
  const seconds = Number(progress);
  return Number.isFinite(seconds) && seconds > 0 ? Math.floor(seconds) : 0;
}

export function buildVidkingUrl({ id, mediaType, season = 1, episode = 1, progress = 0 }) {
  const path =
    mediaType === "tv"
      ? `/tv/${id}/${season || 1}/${episode || 1}`
      : `/movie/${id}`;
  const params = new URLSearchParams({
    color: VIDKING_COLOR,
    autoPlay: "true",
  });

  if (mediaType === "tv") {
    params.set("nextEpisode", "true");
    params.set("episodeSelector", "true");
  }

  const progressSeconds = getProgressSeconds(progress);
  if (progressSeconds) {
    params.set("progress", String(progressSeconds));
  }

  return `${VIDKING_BASE_URL}${path}?${params.toString()}`;
}
