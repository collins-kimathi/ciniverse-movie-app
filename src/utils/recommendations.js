function mediaKey(item) {
  const mediaType = item?.mediaType === "tv" ? "tv" : "movie";
  return `${mediaType}:${item?.id}`;
}

export function buildRecommendationSeeds(continueWatching = [], myList = [], limit = 5) {
  const seeds = [];
  const seen = new Set();

  for (const item of [...continueWatching, ...myList]) {
    if (!item?.id) {
      continue;
    }
    const key = mediaKey(item);
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    seeds.push({ ...item, mediaType: item.mediaType === "tv" ? "tv" : "movie" });
    if (seeds.length >= limit) {
      break;
    }
  }

  return seeds;
}

export function rankSimilarRecommendations(similarGroups = [], seeds = [], limit = 24) {
  const seedKeys = new Set(
    seeds.filter((item) => item?.id).map((item) => mediaKey(item))
  );
  const byKey = new Map();

  for (const group of similarGroups) {
    const seedMedia = group?.seed?.mediaType === "tv" ? "tv" : "movie";
    const items = Array.isArray(group?.items) ? group.items : [];

    items.forEach((item, index) => {
      if (!item?.id) {
        return;
      }

      const mediaType = item.mediaType === "tv" ? "tv" : seedMedia;
      const key = `${mediaType}:${item.id}`;

      if (seedKeys.has(key)) {
        return;
      }

      const existing = byKey.get(key) || {
        ...item,
        mediaType,
        _score: 0,
        _hits: 0,
      };

      // Favor titles repeated across multiple seeds and those ranked earlier in each list.
      existing._score += Math.max(40 - index, 1);
      existing._hits += 1;
      byKey.set(key, existing);
    });
  }

  return Array.from(byKey.values())
    .sort((a, b) => {
      if (b._hits !== a._hits) {
        return b._hits - a._hits;
      }
      if (b._score !== a._score) {
        return b._score - a._score;
      }
      if ((b.vote_average || 0) !== (a.vote_average || 0)) {
        return (b.vote_average || 0) - (a.vote_average || 0);
      }
      return (b.popularity || 0) - (a.popularity || 0);
    })
    .slice(0, limit)
    .map((item) => {
      const movie = { ...item };
      delete movie._score;
      delete movie._hits;
      return movie;
    });
}
