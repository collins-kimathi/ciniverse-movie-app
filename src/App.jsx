import { useState } from "react";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import Home from "./pages/Home";
import Popular from "./pages/Popular";
import Anime from "./pages/Anime";
import Search from "./pages/Search";

export default function App() {
  const [page, setPage] = useState("home");
  const [searchQuery, setSearchQuery] = useState("");

  // Switch between top-level app pages.
  const navigate = (nextPage) => {
    setPage(nextPage);
  };

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
      <Navbar navigate={navigate} onSearch={handleSearch} activePage={page} />
      {page === "home" && <Home />}
      {page === "popular" && <Popular />}
      {page === "anime" && <Anime />}
      {page === "search" && <Search query={searchQuery} />}
      <Footer />
    </div>
  );
}
