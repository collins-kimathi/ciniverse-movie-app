import { useCallback, useEffect, useState } from "react";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import Home from "./pages/Home";
import Popular from "./pages/Popular";
import Anime from "./pages/Anime";
import Shows from "./pages/Shows";
import GenreDetail from "./pages/GenreDetail";
import MyList from "./pages/MyList";
import Search from "./pages/Search";
import { trackEvent } from "./utils/analytics";
import { GENRE_SECTIONS } from "./config/genres";
import { appConfig } from "./config/appConfig";

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
      const genre = GENRE_SECTIONS.find((section) => section.genreId === genreId);
      if (genre) {
        const watch = query.get("watch");
        const mediaType = query.get("type") === "tv" ? "tv" : "movie";
        setWatchTarget(watch ? { id: Number(watch), mediaType } : null);
        setSelectedGenre(genre);
        setPage("genre");
        return;
      }
    }

    if (pathPart === "/popular" || pathPart === "/shows" || pathPart === "/anime" || pathPart === "/my-list") {
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
    window.history.pushState({}, "", `/search?q=${encodeURIComponent(cleanQuery)}`);
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
      {page === "home" && (
        <Home
          watchTarget={watchTarget}
          onConsumeWatchTarget={() => setWatchTarget(null)}
          onOpenGenre={(genre) => {
            window.history.pushState(
              {},
              "",
              `/genre/${genre.genreId}?title=${encodeURIComponent(genre.title)}`
            );
            parseRoute();
            trackEvent("open_genre", genre);
          }}
        />
      )}
      {page === "popular" && (
        <Popular watchTarget={watchTarget} onConsumeWatchTarget={() => setWatchTarget(null)} />
      )}
      {page === "shows" && (
        <Shows watchTarget={watchTarget} onConsumeWatchTarget={() => setWatchTarget(null)} />
      )}
      {page === "anime" && (
        <Anime watchTarget={watchTarget} onConsumeWatchTarget={() => setWatchTarget(null)} />
      )}
      {page === "my-list" && (
        <MyList watchTarget={watchTarget} onConsumeWatchTarget={() => setWatchTarget(null)} />
      )}
      {page === "genre" && selectedGenre ? (
        <GenreDetail
          genreTitle={selectedGenre.title}
          genreId={selectedGenre.genreId}
          watchTarget={watchTarget}
          onConsumeWatchTarget={() => setWatchTarget(null)}
        />
      ) : null}
      {page === "search" && (
        <Search
          query={searchQuery}
          watchTarget={watchTarget}
          onConsumeWatchTarget={() => setWatchTarget(null)}
        />
      )}
      <Footer />
    </div>
  );
}
