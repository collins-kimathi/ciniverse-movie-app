// Helpers for embedded playback providers.
const VIDKING_BASE_URL = "https://www.vidking.net/embed";
const VIDKING_COLOR = "e50914";

export function buildVidkingUrl({ id, mediaType, season = 1, episode = 1 }) {
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

  return `${VIDKING_BASE_URL}${path}?${params.toString()}`;
}
