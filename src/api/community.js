const COMMUNITY_API_BASE_URL = (import.meta.env.VITE_COMMUNITY_API_BASE_URL || "").replace(
  /\/$/,
  ""
);
const SAME_ORIGIN_PREFIX = "/api/v1";
const EXTERNAL_PREFIXES = ["/v1", "/api/v1"];

function toNumberMap(value) {
  const counts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  if (!value || typeof value !== "object") {
    return counts;
  }
  Object.keys(counts).forEach((key) => {
    counts[key] = Number(value[key] || 0);
  });
  return counts;
}

function normalizeCommunityPayload(payload) {
  const notes = Array.isArray(payload?.notes) ? payload.notes : [];
  const totalRatings = Number(payload?.ratings?.totalRatings || 0);
  const averageRating = Number(payload?.ratings?.averageRating || 0);
  const ratingCounts = toNumberMap(payload?.ratings?.counts);
  return {
    notes,
    ratings: {
      totalRatings,
      averageRating,
      counts: ratingCounts,
    },
  };
}

function buildCandidateUrls(path) {
  if (!COMMUNITY_API_BASE_URL) {
    return [`${SAME_ORIGIN_PREFIX}${path}`];
  }
  return EXTERNAL_PREFIXES.map((prefix) => `${COMMUNITY_API_BASE_URL}${prefix}${path}`);
}

async function parseJson(response) {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

async function request(path, options = {}) {
  const urls = buildCandidateUrls(path);
  let lastError = new Error("Community service unavailable");

  for (let index = 0; index < urls.length; index += 1) {
    const url = urls[index];
    const hasFallback = index < urls.length - 1;

    try {
      const response = await fetch(url, {
        headers: {
          "Content-Type": "application/json",
          ...(options.headers || {}),
        },
        ...options,
      });
      const payload = await parseJson(response);

      if (response.ok) {
        return payload;
      }

      const message =
        (typeof payload?.error === "string" && payload.error) ||
        `Community API request failed: ${response.status}`;
      if (hasFallback && (response.status === 404 || response.status === 405)) {
        continue;
      }

      const error = new Error(message);
      error.status = response.status;
      throw error;
    } catch (error) {
      lastError = error instanceof Error ? error : lastError;
      if (hasFallback) {
        continue;
      }
      throw lastError;
    }
  }

  throw lastError;
}

export async function fetchCommunityData(id, mediaType = "movie") {
  const payload = await request(`/community/${mediaType}/${id}`);
  return normalizeCommunityPayload(payload);
}

export async function postCommunityNote({ id, mediaType = "movie", text, author }) {
  const payload = await request(`/community/${mediaType}/${id}/notes`, {
    method: "POST",
    body: JSON.stringify({ text, author }),
  });
  return normalizeCommunityPayload(payload);
}

export async function postCommunityRating({ id, mediaType = "movie", rating }) {
  const payload = await request(`/community/${mediaType}/${id}/ratings`, {
    method: "POST",
    body: JSON.stringify({ rating }),
  });
  return normalizeCommunityPayload(payload);
}
