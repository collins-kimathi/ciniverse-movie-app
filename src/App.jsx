import { useEffect, useState } from "react";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import Home from "./pages/Home";
import Popular from "./pages/Popular";
import Anime from "./pages/Anime";
import Shows from "./pages/Shows";
import GenreDetail from "./pages/GenreDetail";
import MyList from "./pages/MyList";
import Search from "./pages/Search";

export default function App() {
  const [page, setPage] = useState("home");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedGenre, setSelectedGenre] = useState(null);
  const [installEvent, setInstallEvent] = useState(null);

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
    setPage(nextPage);
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
      setPage("home");
      return;
    }

    setSearchQuery(cleanQuery);
    setPage("search");
  };

  return (
    <div className="app-shell">
      {/* Navbar controls page navigation and search input. */}
      <Navbar
        navigate={navigate}
        onSearch={handleSearch}
        activePage={page}
        canInstall={Boolean(installEvent)}
        onInstall={onInstall}
      />
      {page === "home" && (
        <Home
          onOpenGenre={(genre) => {
            setSelectedGenre(genre);
            setPage("genre");
          }}
        />
      )}
      {page === "popular" && <Popular />}
      {page === "shows" && <Shows />}
      {page === "anime" && <Anime />}
      {page === "my-list" && <MyList />}
      {page === "genre" && selectedGenre ? (
        <GenreDetail genreTitle={selectedGenre.title} genreId={selectedGenre.genreId} />
      ) : null}
      {page === "search" && <Search query={searchQuery} />}
      <Footer />
    </div>
  );
}
