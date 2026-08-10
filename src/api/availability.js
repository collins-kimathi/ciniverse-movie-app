// Shared availability checks across licensed playback and streaming providers.
import { fetchLicensedPlaybackSession, isPlaybackEnabled } from "./playback";
import {
  fetchStreamingAvailability,
  isStreamingAvailabilityEnabled,
} from "./streamingAvailability";

export const isAvailabilityEnabled = isPlaybackEnabled || isStreamingAvailabilityEnabled;

function unavailable(error = "") {
  return {
    available: false,
    label: "",
    source: "",
    providers: [],
    actionUrl: "",
    actionLabel: "",
    error,
  };
}

export async function fetchTitleAvailability(id, mediaType = "movie") {
  if (isStreamingAvailabilityEnabled) {
    try {
      const streaming = await fetchStreamingAvailability(mediaType, id);
      if (streaming?.available) {
        const actionProvider = streaming.providers.find((provider) => provider.homePage) || null;
        return {
          available: true,
          label: "Streaming",
          source: "rapidapi",
          providers: streaming.providers,
          actionUrl: actionProvider?.homePage || "",
          actionLabel: actionProvider ? `Watch on ${actionProvider.name}` : "Watch Now",
          error: "",
        };
      }
    } catch {
      // Provider badges are optional; playback should keep working if this check fails.
    }
  }

  if (mediaType === "movie" && isPlaybackEnabled) {
    try {
      const playback = await fetchLicensedPlaybackSession(id);
      if (playback?.src) {
        return {
          available: true,
          label: "Licensed",
          source: "playback",
          providers: playback.provider
            ? [{ id: playback.provider, name: playback.provider, homePage: "" }]
            : [],
          actionUrl: playback.src,
          actionLabel: "Watch Now",
          error: "",
        };
      }
    } catch {
      // Licensed provider lookup is optional; the embedded player remains available.
    }
  }

  return unavailable();
}
