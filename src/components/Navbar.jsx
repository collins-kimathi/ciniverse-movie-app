import SearchBar from "./SearchBar";
import InstallButton from "./InstallButton";
import { appConfig } from "../config/appConfig";

export default function Navbar({
  navigate,
  onSearch,
  activePage,
  canInstall = false,
  onInstall = () => {},
}) {
  return (
    <nav className="navbar">
      <button type="button" className="logo" onClick={() => navigate("home")}>
        {appConfig.siteName.toUpperCase()}
      </button>
      <div className="nav-links">
        <button
          type="button"
          className={activePage === "home" ? "active" : ""}
          onClick={() => navigate("home")}
        >
          Home
        </button>
        <button
          type="button"
          className={activePage === "popular" ? "active" : ""}
          onClick={() => navigate("popular")}
        >
          Popular
        </button>
        <button
          type="button"
          className={activePage === "shows" ? "active" : ""}
          onClick={() => navigate("shows")}
        >
          Shows
        </button>
        <button
          type="button"
          className={activePage === "anime" ? "active" : ""}
          onClick={() => navigate("anime")}
        >
          Anime
        </button>
        <button
          type="button"
          className={activePage === "my-list" ? "active" : ""}
          onClick={() => navigate("my-list")}
        >
          My List
        </button>
      </div>
      <InstallButton canInstall={canInstall} onInstall={onInstall} />
      <SearchBar onSearch={onSearch} />
    </nav>
  );
}
