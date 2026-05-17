// UI component: Navbar.
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

  // Keep navigation behavior consistent between desktop and mobile menu states.
  function go(nextPage) {
    navigate(nextPage);
    setMobileMenuOpen(false);
  }

  return (
    <nav className="navbar">
      <button type="button" className="logo" onClick={() => go("home")}>
        <span className="logo-mark" aria-hidden="true">
          <span>C</span>
        </span>
        <span>{appConfig.siteName}</span>
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
          <svg aria-hidden="true" viewBox="0 0 24 24">
            <path
              d="M3 10.8 12 3l9 7.8V21h-6v-6H9v6H3z"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinejoin="round"
            />
          </svg>
          Home
        </button>
        <button
          type="button"
          className={activePage === "popular" ? "active" : ""}
          onClick={() => go("popular")}
        >
          <svg aria-hidden="true" viewBox="0 0 24 24">
            <path
              d="m8 8-4 4 4 4m8-8 4 4-4 4"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          Popular
        </button>
        <button
          type="button"
          className={activePage === "shows" ? "active" : ""}
          onClick={() => go("shows")}
        >
          <svg aria-hidden="true" viewBox="0 0 24 24">
            <path
              d="M4 5h16v14H4zM12 5v14M4 12h16"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinejoin="round"
            />
          </svg>
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
