import { Suspense, lazy, useCallback, useEffect, useState } from "react";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import { trackEvent } from "./utils/analytics";
import { GENRE_SECTIONS } from "./config/genres";
import { appConfig } from "./config/appConfig";

const HomePage = lazy(() => import("./pages/Home"));
const PopularPage = lazy(() => import("./pages/Popular"));
const AnimePage = lazy(() => import("./pages/Anime"));
const ShowsPage = lazy(() => import("./pages/Shows"));
const GenreDetailPage = lazy(() => import("./pages/GenreDetail"));
const MyListPage = lazy(() => import("./pages/MyList"));
const SearchPage = lazy(() => import("./pages/Search"));

export default function App() {
  const [page, setPage] = useState("home");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedGenre, setSelectedGenre] = useState(null);
  const [installEvent, setInstallEvent] = useState(null);
  const [watchTarget, setWatchTarget] = useState(null);

  const parseRoute = useCallback(() => {
    if (window.location.hash.startsWith("#/")) {
      const migratedPath = window.location.hash.slice(1);
      window.history.replaceState({}, "", migratedPath);
    }

    const pathPart = window.location.pathname || "/home";
    const query = new URLSearchParams(window.location.search || "");

    if (pathPart.startsWith("/search")) {
      const q = query.get("q") || "";
      setSearchQuery(q);
      const watch = query.get("watch");
      const mediaType = query.get("type") === "tv" ? "tv" : "movie";
      setWatchTarget(watch ? { id: Number(watch), mediaType } : null);
      setPage("search");
      return;
    }

    if (pathPart.startsWith("/genre/")) {
      const genreId = Number(pathPart.split("/")[2]);
      const genre = GENRE_SECTIONS.find(
        (section) => section.genreId === genreId,
      );
      if (genre) {
        const watch = query.get("watch");
        const mediaType = query.get("type") === "tv" ? "tv" : "movie";
        setWatchTarget(watch ? { id: Number(watch), mediaType } : null);
        setSelectedGenre(genre);
        setPage("genre");
        return;
      }
    }

    if (
      pathPart === "/popular" ||
      pathPart === "/shows" ||
      pathPart === "/anime" ||
      pathPart === "/my-list"
    ) {
      const watch = query.get("watch");
      const mediaType = query.get("type") === "tv" ? "tv" : "movie";
      setWatchTarget(watch ? { id: Number(watch), mediaType } : null);
      setPage(pathPart.slice(1));
      return;
    }

    const watch = query.get("watch");
    const mediaType = query.get("type") === "tv" ? "tv" : "movie";
    setWatchTarget(watch ? { id: Number(watch), mediaType } : null);
    setPage("home");
  }, []);

  useEffect(() => {
    parseRoute();
    window.addEventListener("popstate", parseRoute);
    return () => {
      window.removeEventListener("popstate", parseRoute);
    };
  }, [parseRoute]);

  useEffect(() => {
    function onBeforeInstallPrompt(event) {
      event.preventDefault();
      setInstallEvent(event);
    }

    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    };
  }, []);

  useEffect(() => {
    const baseUrl = (appConfig.siteUrl || "https://ciniverse.top").replace(
      /\/$/,
      "",
    );
    const searchPart = searchQuery
      ? `?q=${encodeURIComponent(searchQuery)}`
      : "";
    const pathByPage = {
      home: "/home",
      popular: "/popular",
      shows: "/shows",
      anime: "/anime",
      "my-list": "/my-list",
      search: `/search${searchPart}`,
      genre: selectedGenre ? `/genre/${selectedGenre.genreId}` : "/home",
    };
    const titleByPage = {
      home: "Ciniverse ",
      popular: "Popular Movies | Ciniverse",
      shows: "Popular Shows | Ciniverse",
      anime: "Anime Movies | Ciniverse",
      "my-list": "My List | Ciniverse",
      search: searchQuery
        ? `Search: ${searchQuery} | Ciniverse`
        : "Search | Ciniverse",
      genre: selectedGenre
        ? `${selectedGenre.title} Movies | Ciniverse`
        : "Genre Movies | Ciniverse",
    };
    const descByPage = {
      home: "Ciniverse is where you discover titles, watch trailers, rate what you watched, and publish ReelNotes for others to read.",
      popular: "Explore popular movies trending worldwide on Ciniverse.",
      shows: "Discover popular TV shows and start watching on Ciniverse.",
      anime:
        "Browse top anime movies and discover your next favorite on Ciniverse.",
      "my-list":
        "Manage your saved movies and shows, plus your personal ReelNotes picks.",
      search: searchQuery
        ? `Search results for ${searchQuery} on Ciniverse ReelNotes.`
        : "Search movies, trailers, ratings, and ReelNotes on Ciniverse.",
      genre: selectedGenre
        ? `Explore ${selectedGenre.title} movies on Ciniverse.`
        : "Explore movies by genre on Ciniverse.",
    };

    const path = pathByPage[page] || "/home";
    const title = titleByPage[page] || titleByPage.home;
    const description = descByPage[page] || descByPage.home;
    const absoluteUrl = `${baseUrl}${path}`;

    document.title = title;
    const descriptionMeta = document.querySelector("meta[name='description']");
    if (descriptionMeta) {
      descriptionMeta.setAttribute("content", description);
    }
    const ogTitle = document.querySelector("meta[property='og:title']");
    if (ogTitle) {
      ogTitle.setAttribute("content", title);
    }
    const ogDescription = document.querySelector(
      "meta[property='og:description']",
    );
    if (ogDescription) {
      ogDescription.setAttribute("content", description);
    }
    const ogUrl = document.querySelector("meta[property='og:url']");
    if (ogUrl) {
      ogUrl.setAttribute("content", absoluteUrl);
    }
    const twitterTitle = document.querySelector("meta[name='twitter:title']");
    if (twitterTitle) {
      twitterTitle.setAttribute("content", title);
    }
    const twitterDescription = document.querySelector(
      "meta[name='twitter:description']",
    );
    if (twitterDescription) {
      twitterDescription.setAttribute("content", description);
    }
    const canonical = document.querySelector("link[rel='canonical']");
    if (canonical) {
      canonical.setAttribute("href", absoluteUrl);
    }

    trackEvent("page_view", { page, path });
  }, [page, searchQuery, selectedGenre]);

  // Switch between top-level app pages.
  const navigate = (nextPage) => {
    window.history.pushState({}, "", `/${nextPage}`);
    parseRoute();
    trackEvent("navigate", { page: nextPage });
  };

  async function onInstall() {
    if (!installEvent) {
      return;
    }
    installEvent.prompt();
    await installEvent.userChoice;
    setInstallEvent(null);
  }

  // Route to search page only when query has useful text.
  const handleSearch = (query) => {
    const cleanQuery = query.trim();

    if (!cleanQuery) {
      setSearchQuery("");
      window.history.pushState({}, "", "/home");
      parseRoute();
      return;
    }

    setSearchQuery(cleanQuery);
    window.history.pushState(
      {},
      "",
      `/search?q=${encodeURIComponent(cleanQuery)}`,
    );
    parseRoute();
  };

  return (
    <div className="app-shell">
      {/* Navbar controls page navigation and search input. */}
      <Navbar
        navigate={navigate}
        onSearch={handleSearch}
        activePage={page}
        canInstall={appConfig.installEnabled && Boolean(installEvent)}
        onInstall={onInstall}
      />
      <Suspense
        fallback={
          <main className="main">
            <p className="status-line">Loading page...</p>
          </main>
        }
      >
        {page === "home" && (
          <HomePage
            watchTarget={watchTarget}
            onConsumeWatchTarget={() => setWatchTarget(null)}
            onOpenGenre={(genre) => {
              window.history.pushState(
                {},
                "",
                `/genre/${genre.genreId}?title=${encodeURIComponent(genre.title)}`,
              );
              parseRoute();
              trackEvent("open_genre", genre);
            }}
          />
        )}
        {page === "popular" && (
          <PopularPage
            watchTarget={watchTarget}
            onConsumeWatchTarget={() => setWatchTarget(null)}
          />
        )}
        {page === "shows" && (
          <ShowsPage
            watchTarget={watchTarget}
            onConsumeWatchTarget={() => setWatchTarget(null)}
          />
        )}
        {page === "anime" && (
          <AnimePage
            watchTarget={watchTarget}
            onConsumeWatchTarget={() => setWatchTarget(null)}
          />
        )}
        {page === "my-list" && (
          <MyListPage
            watchTarget={watchTarget}
            onConsumeWatchTarget={() => setWatchTarget(null)}
          />
        )}
        {page === "genre" && selectedGenre ? (
          <GenreDetailPage
            genreTitle={selectedGenre.title}
            genreId={selectedGenre.genreId}
            watchTarget={watchTarget}
            onConsumeWatchTarget={() => setWatchTarget(null)}
          />
        ) : null}
        {page === "search" && (
          <SearchPage
            query={searchQuery}
            watchTarget={watchTarget}
            onConsumeWatchTarget={() => setWatchTarget(null)}
          />
        )}
      </Suspense>
      <Footer />
    </div>
  );
}
