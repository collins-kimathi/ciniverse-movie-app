import SearchBar from "./SearchBar";
import InstallButton from "./InstallButton";
import { appConfig } from "../config/appConfig";
import { useState } from "react";

export default function Navbar({
  navigate,
  onSearch,
  activePage,
  canInstall = false,
  onInstall = () => {},
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  function go(nextPage) {
    navigate(nextPage);
    setMobileMenuOpen(false);
  }

  return (
    <nav className="navbar">
      <button type="button" className="logo" onClick={() => go("home")}>
        {appConfig.siteName.toUpperCase()}
      </button>
      <button
        type="button"
        className="mobile-menu-toggle"
        aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
        onClick={() => setMobileMenuOpen((prev) => !prev)}
      >
        <svg aria-hidden="true" viewBox="0 0 24 24" width="16" height="16">
          {mobileMenuOpen ? (
            <path
              d="M18.3 5.71 12 12l6.3 6.29-1.41 1.41L10.59 13.4 4.3 19.7 2.89 18.3 9.17 12 2.9 5.71 4.3 4.3l6.29 6.29 6.3-6.29z"
              fill="currentColor"
            />
          ) : (
            <path d="M3 6h18v2H3zm0 5h18v2H3zm0 5h18v2H3z" fill="currentColor" />
          )}
        </svg>
      </button>
      <div className={`nav-links ${mobileMenuOpen ? "mobile-open" : ""}`}>
        <button
          type="button"
          className={activePage === "home" ? "active" : ""}
          onClick={() => go("home")}
        >
          Home
        </button>
        <button
          type="button"
          className={activePage === "popular" ? "active" : ""}
          onClick={() => go("popular")}
        >
          Popular
        </button>
        <button
          type="button"
          className={activePage === "shows" ? "active" : ""}
          onClick={() => go("shows")}
        >
          Shows
        </button>
        <button
          type="button"
          className={activePage === "anime" ? "active" : ""}
          onClick={() => go("anime")}
        >
          Anime
        </button>
        <button
          type="button"
          className={activePage === "my-list" ? "active" : ""}
          onClick={() => go("my-list")}
        >
          My List
        </button>
      </div>
      <InstallButton canInstall={canInstall} onInstall={onInstall} />
      <SearchBar onSearch={onSearch} />
    </nav>
  );
}
