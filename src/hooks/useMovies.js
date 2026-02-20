import { useEffect, useState } from "react";

export default function useMovies(loader, deps = [], options = {}) {
  const { enabled = true, initialData = [], errorMessage = "Failed to load movies." } = options;
  const [movies, setMovies] = useState(initialData);
  const [loading, setLoading] = useState(Boolean(enabled));
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function run() {
      if (!enabled) {
        setMovies(initialData);
        setLoading(false);
        setError("");
        return;
      }

      setLoading(true);
      setError("");

      try {
        const result = await loader();
        if (!cancelled) {
          setMovies(Array.isArray(result) ? result : []);
        }
      } catch {
        if (!cancelled) {
          setMovies([]);
          setError(errorMessage);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    run();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, ...deps]);

  return { movies, loading, error, setMovies };
}
