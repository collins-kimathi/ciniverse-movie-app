// Utility helpers for filters.
export function applyFilters(movies, filters) {
  return movies.filter((movie) => {
    const release = movie.release_date || movie.first_air_date || "";
    const year = Number(release.slice(0, 4));
    const rating = Number(movie.vote_average || 0);
    const lang = (movie.original_language || "").toLowerCase();

    if (filters.year === "2020s" && (!year || year < 2020)) {
      return false;
    }
    if (filters.year === "2010s" && (!year || year < 2010 || year > 2019)) {
      return false;
    }
    if (filters.year === "2000s" && (!year || year < 2000 || year > 2009)) {
      return false;
    }
    if (rating < filters.minRating) {
      return false;
    }
    if (filters.language !== "all" && lang !== filters.language) {
      return false;
    }

    return true;
  });
}
