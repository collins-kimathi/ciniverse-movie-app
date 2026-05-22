// Frontend API client helpers for Streaming Availability.
const STREAMING_AVAILABILITY_API_BASE_URL = (
  import.meta.env.VITE_STREAMING_AVAILABILITY_API_BASE_URL || "/api/streaming-availability"
).replace(/\/$/, "");
const STREAMING_AVAILABILITY_COUNTRY =
  (import.meta.env.VITE_STREAMING_AVAILABILITY_COUNTRY || "us").toLowerCase();
const STREAMING_AVAILABILITY_LANGUAGE =
  import.meta.env.VITE_STREAMING_AVAILABILITY_LANGUAGE || "en";

export const isStreamingAvailabilityEnabled =
  import.meta.env.VITE_STREAMING_AVAILABILITY_ENABLED !== "false";

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

  const query = new URLSearchParams({
    mediaType,
    id,
    country: STREAMING_AVAILABILITY_COUNTRY,
    output_language: STREAMING_AVAILABILITY_LANGUAGE,
  });
  const response = await fetch(`${STREAMING_AVAILABILITY_API_BASE_URL}?${query.toString()}`);

  if (response.status === 204 || response.status === 404) {
    return null;
  }

  if (!response.ok) {
    let message = `Streaming availability request failed: ${response.status}`;
    try {
      const payload = await response.json();
      message = payload?.error || message;
    } catch {
      // Keep the status-based message when the response body is not JSON.
    }
    throw new Error(message);
  }

  const payload = await response.json();
  return normalizeAvailability(payload, mediaType, id);
}
