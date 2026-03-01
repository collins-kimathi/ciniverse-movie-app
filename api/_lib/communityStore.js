const DEFAULT_COUNTS = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };

function keyOf(mediaType, id) {
  return `community:${mediaType}:${id}`;
}

function getUpstashConfig() {
  const url = process.env.UPSTASH_REDIS_REST_URL || "";
  const token = process.env.UPSTASH_REDIS_REST_TOKEN || "";
  return url && token ? { url: url.replace(/\/$/, ""), token } : null;
}

async function upstashCommand(args) {
  const config = getUpstashConfig();
  if (!config) {
    return null;
  }
  try {
    const response = await fetch(`${config.url}/pipeline`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify([args]),
    });
    if (!response.ok) {
      return null;
    }
    const payload = await response.json();
    return payload?.[0]?.result ?? null;
  } catch {
    // Fallback to in-memory store when Upstash is unavailable.
    return null;
  }
}

const inMemoryStore = globalThis.__ciniverseCommunityStore || new Map();
globalThis.__ciniverseCommunityStore = inMemoryStore;

function emptyEntry(mediaType, id) {
  return {
    mediaType,
    id,
    notes: [],
    ratings: {
      totalRatings: 0,
      sumRatings: 0,
      counts: { ...DEFAULT_COUNTS },
    },
    updatedAt: new Date().toISOString(),
  };
}

export async function readEntry(mediaType, id) {
  const key = keyOf(mediaType, id);
  const upstashValue = await upstashCommand(["GET", key]);
  if (typeof upstashValue === "string") {
    try {
      const parsed = JSON.parse(upstashValue);
      return parsed && typeof parsed === "object" ? parsed : emptyEntry(mediaType, id);
    } catch {
      return emptyEntry(mediaType, id);
    }
  }
  if (inMemoryStore.has(key)) {
    return inMemoryStore.get(key);
  }
  return emptyEntry(mediaType, id);
}

export async function writeEntry(mediaType, id, entry) {
  const key = keyOf(mediaType, id);
  const payload = JSON.stringify(entry);
  const wroteToUpstash = await upstashCommand(["SET", key, payload]);
  if (wroteToUpstash === null) {
    inMemoryStore.set(key, entry);
  }
  return entry;
}

export function toPublicEntry(entry) {
  const totalRatings = Number(entry?.ratings?.totalRatings || 0);
  const sumRatings = Number(entry?.ratings?.sumRatings || 0);
  const averageRating = totalRatings > 0 ? Number((sumRatings / totalRatings).toFixed(2)) : 0;
  return {
    notes: Array.isArray(entry?.notes) ? entry.notes : [],
    ratings: {
      totalRatings,
      averageRating,
      counts: entry?.ratings?.counts || { ...DEFAULT_COUNTS },
    },
    updatedAt: entry?.updatedAt || new Date().toISOString(),
  };
}
