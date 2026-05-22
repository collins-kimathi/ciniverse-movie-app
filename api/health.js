// Health check endpoint for deployment monitoring.
export default function handler(_req, res) {
  res.status(200).json({
    ok: true,
    services: {
      tmdb: Boolean(process.env.TMDB_BEARER_TOKEN || process.env.TMDB_API_KEY),
      playback: Boolean(process.env.PLAYBACK_API_BASE_URL),
      streamingAvailability: Boolean(process.env.STREAMING_AVAILABILITY_API_KEY),
      communityStore: Boolean(
        process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
      ),
    },
  });
}

