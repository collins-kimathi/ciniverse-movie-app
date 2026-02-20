import SearchBar from "./SearchBar";

export default function Navbar({ navigate, onSearch, activePage }) {
  return (
    <nav className="navbar">
      <button type="button" className="logo" onClick={() => navigate("home")}>
        CINIVERSE
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
      </div>
      <SearchBar onSearch={onSearch} />
    </nav>
  );
}
