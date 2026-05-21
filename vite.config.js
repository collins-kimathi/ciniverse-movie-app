// Vite build and dev server configuration.
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

const TMDB_BASE_URL = "https://api.themoviedb.org/3"
const ALLOWED_TMDB_PATH_PATTERN = /^\/[a-z0-9_/-]+(?:\?[a-z0-9_.,/%=&:-]+)?$/i
const STREAMING_AVAILABILITY_BASE_URL = "https://streaming-availability.p.rapidapi.com"

function sendJson(res, status, payload) {
  res.statusCode = status
  res.setHeader("Content-Type", "application/json")
  res.end(JSON.stringify(payload))
}

function createTmdbDevProxy(env) {
  const tmdbApiKey = env.TMDB_API_KEY || env.VITE_TMDB_API_KEY || ""
  const tmdbBearerToken = env.TMDB_BEARER_TOKEN || env.VITE_TMDB_BEARER_TOKEN || ""

  return {
    name: "tmdb-dev-proxy",
    configureServer(server) {
      server.middlewares.use("/api/tmdb", async (req, res) => {
        if (req.method !== "GET") {
          sendJson(res, 405, { error: "Method not allowed" })
          return
        }

        if (!tmdbBearerToken && !tmdbApiKey) {
          sendJson(res, 500, {
            error:
              "TMDB credentials are not configured. Add TMDB_BEARER_TOKEN to .env.local and restart the dev server.",
          })
          return
        }

        const requestUrl = new URL(req.url || "", "http://localhost")
        const path = requestUrl.searchParams.get("path") || ""
        if (!ALLOWED_TMDB_PATH_PATTERN.test(path)) {
          sendJson(res, 422, { error: "Invalid TMDB path" })
          return
        }

        const separator = path.includes("?") ? "&" : "?"
        const tmdbUrl = tmdbBearerToken
          ? `${TMDB_BASE_URL}${path}`
          : `${TMDB_BASE_URL}${path}${separator}api_key=${tmdbApiKey}`
        const headers = tmdbBearerToken
          ? { accept: "application/json", Authorization: `Bearer ${tmdbBearerToken}` }
          : { accept: "application/json" }

        try {
          const response = await fetch(tmdbUrl, { headers })
          const text = await response.text()
          res.statusCode = response.status
          res.setHeader("Content-Type", response.headers.get("Content-Type") || "application/json")
          res.end(text || JSON.stringify({ error: "TMDB returned an empty response" }))
        } catch (error) {
          sendJson(res, 502, { error: error?.message || "TMDB proxy request failed" })
        }
      })
    },
  }
}

function createStreamingAvailabilityDevProxy(env) {
  const apiKey = env.STREAMING_AVAILABILITY_API_KEY || ""
  const apiHost = env.STREAMING_AVAILABILITY_API_HOST || "streaming-availability.p.rapidapi.com"
  const baseUrl = env.STREAMING_AVAILABILITY_BASE_URL || STREAMING_AVAILABILITY_BASE_URL

  return {
    name: "streaming-availability-dev-proxy",
    configureServer(server) {
      server.middlewares.use("/api/streaming-availability", async (req, res) => {
        if (req.method !== "GET") {
          sendJson(res, 405, { error: "Method not allowed" })
          return
        }

        if (!apiKey) {
          res.statusCode = 204
          res.end()
          return
        }

        const requestUrl = new URL(req.url || "", "http://localhost")
        const mediaType = requestUrl.searchParams.get("mediaType") === "tv" ? "tv" : "movie"
        const id = Number(requestUrl.searchParams.get("id"))
        const country = (requestUrl.searchParams.get("country") || "us").toLowerCase()
        const outputLanguage = requestUrl.searchParams.get("output_language") || "en"

        if (!Number.isFinite(id) || id <= 0 || !/^[a-z]{2}$/.test(country)) {
          sendJson(res, 422, { error: "Invalid mediaType, id, or country" })
          return
        }

        const showId = encodeURIComponent(`${mediaType}/${id}`)
        const query = new URLSearchParams({ country, output_language: outputLanguage })

        try {
          const response = await fetch(`${baseUrl}/shows/${showId}?${query.toString()}`, {
            headers: {
              accept: "application/json",
              "X-RapidAPI-Key": apiKey,
              "X-RapidAPI-Host": apiHost,
            },
          })
          const text = await response.text()
          res.statusCode = response.status
          res.setHeader("Content-Type", response.headers.get("Content-Type") || "application/json")
          res.end(text)
        } catch (error) {
          sendJson(res, 502, { error: error?.message || "Streaming availability request failed" })
        }
      })
    },
  }
}

function createPlaybackDevProxy(env) {
  const baseUrl = (env.PLAYBACK_API_BASE_URL || "").replace(/\/$/, "")
  const apiKey = env.PLAYBACK_API_KEY || ""

  return {
    name: "playback-dev-proxy",
    configureServer(server) {
      server.middlewares.use("/api/playback", async (req, res) => {
        if (req.method !== "GET") {
          sendJson(res, 405, { error: "Method not allowed" })
          return
        }

        if (!baseUrl) {
          res.statusCode = 204
          res.end()
          return
        }

        const requestUrl = new URL(req.url || "", "http://localhost")
        const movieId = Number(requestUrl.searchParams.get("movieId"))
        if (!Number.isFinite(movieId) || movieId <= 0) {
          sendJson(res, 422, { error: "Invalid movieId" })
          return
        }

        const headers = apiKey
          ? { accept: "application/json", "x-api-key": apiKey }
          : { accept: "application/json" }

        try {
          const response = await fetch(`${baseUrl}/v1/playback/movie/${movieId}`, {
            headers,
          })
          const text = await response.text()
          res.statusCode = response.status
          res.setHeader("Content-Type", response.headers.get("Content-Type") || "application/json")
          res.end(text)
        } catch (error) {
          sendJson(res, 502, { error: error?.message || "Playback request failed" })
        }
      })
    },
  }
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "")

  return {
    plugins: [
      react(),
      createTmdbDevProxy(env),
      createStreamingAvailabilityDevProxy(env),
      createPlaybackDevProxy(env),
    ],
  }
})
