// Frontend API client helpers for Streaming Availability via RapidAPI.
const STREAMING_AVAILABILITY_BASE_URL =
  import.meta.env.VITE_STREAMING_AVAILABILITY_BASE_URL ||
  "https://streaming-availability.p.rapidapi.com";
const STREAMING_AVAILABILITY_API_KEY =
  import.meta.env.VITE_STREAMING_AVAILABILITY_API_KEY || "";
const STREAMING_AVAILABILITY_API_HOST =
  import.meta.env.VITE_STREAMING_AVAILABILITY_API_HOST ||
  "streaming-availability.p.rapidapi.com";
const STREAMING_AVAILABILITY_COUNTRY =
  (import.meta.env.VITE_STREAMING_AVAILABILITY_COUNTRY || "us").toLowerCase();
const STREAMING_AVAILABILITY_LANGUAGE =
  import.meta.env.VITE_STREAMING_AVAILABILITY_LANGUAGE || "en";

export const isStreamingAvailabilityEnabled = Boolean(STREAMING_AVAILABILITY_API_KEY);

function buildHeaders() {
  return {
    accept: "application/json",
    "X-RapidAPI-Key": STREAMING_AVAILABILITY_API_KEY,
    "X-RapidAPI-Host": STREAMING_AVAILABILITY_API_HOST,
  };
}

function getShowId(mediaType, id) {
  const sourceType = mediaType === "tv" ? "tv" : "movie";
  return `${sourceType}/${id}`;
}

function collectServices(value, found = []) {
  if (Array.isArray(value)) {
    value.forEach((item) => collectServices(item, found));
    return found;
  }

  if (!value || typeof value !== "object") {
    return found;
  }

  if (value.service && typeof value.service === "object") {
    found.push(value.service);
  }

  Object.values(value).forEach((nested) => collectServices(nested, found));
  return found;
}

function normalizeAvailability(payload, mediaType, id) {
  if (!payload || typeof payload !== "object") {
    return null;
  }

  const options = payload.streamingOptions || {};
  const countryOptions = options[STREAMING_AVAILABILITY_COUNTRY] || options;
  const providers = collectServices(countryOptions)
    .map((service) => ({
      id: service.id || service.name || service.imageSet?.lightThemeImage || "",
      name: service.name || "Streaming provider",
      homePage: service.homePage || "",
    }))
    .filter((provider) => provider.id);
  const uniqueProviders = Array.from(
    providers.reduce((map, provider) => map.set(provider.id, provider), new Map()).values()
  );

  return {
    id,
    mediaType,
    country: STREAMING_AVAILABILITY_COUNTRY.toUpperCase(),
    available: uniqueProviders.length > 0,
    providers: uniqueProviders,
    payload,
  };
}

export async function fetchStreamingAvailability(mediaType, id) {
  if (!isStreamingAvailabilityEnabled) {
    return null;
  }

  const showId = encodeURIComponent(getShowId(mediaType, id));
  const query = new URLSearchParams({
    country: STREAMING_AVAILABILITY_COUNTRY,
    output_language: STREAMING_AVAILABILITY_LANGUAGE,
  });
  const response = await fetch(
    `${STREAMING_AVAILABILITY_BASE_URL}/shows/${showId}?${query.toString()}`,
    {
      method: "GET",
      headers: buildHeaders(),
    }
  );

  if (response.status === 204 || response.status === 404) {
    return null;
  }

  if (!response.ok) {
    throw new Error(`Streaming availability request failed: ${response.status}`);
  }

  const payload = await response.json();
  return normalizeAvailability(payload, mediaType, id);
}
