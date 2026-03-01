const COMMUNITY_API_BASE_URL = (import.meta.env.VITE_COMMUNITY_API_BASE_URL || "").replace(
  /\/$/,
  ""
);

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

async function request(path, options = {}) {
  const url = COMMUNITY_API_BASE_URL ? `${COMMUNITY_API_BASE_URL}${path}` : path;
  const response = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    ...options,
  });

  if (!response.ok) {
    throw new Error(`Community API request failed: ${response.status}`);
  }

  return response.json();
}

export async function fetchCommunityData(id, mediaType = "movie") {
  const payload = await request(`/v1/community/${mediaType}/${id}`);
  return normalizeCommunityPayload(payload);
}

export async function postCommunityNote({ id, mediaType = "movie", text, author }) {
  const payload = await request(`/v1/community/${mediaType}/${id}/notes`, {
    method: "POST",
    body: JSON.stringify({ text, author }),
  });
  return normalizeCommunityPayload(payload);
}

export async function postCommunityRating({ id, mediaType = "movie", rating }) {
  const payload = await request(`/v1/community/${mediaType}/${id}/ratings`, {
    method: "POST",
    body: JSON.stringify({ rating }),
  });
  return normalizeCommunityPayload(payload);
}
