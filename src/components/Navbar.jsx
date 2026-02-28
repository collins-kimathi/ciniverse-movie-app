import SearchBar from "./SearchBar";
import InstallButton from "./InstallButton";
import { appConfig } from "../config/appConfig";

const navBtnBase =
  "cursor-pointer rounded-full border px-3 py-1.5 text-sm font-medium transition";

export default function Navbar({
  navigate,
  onSearch,
  activePage,
  canInstall = false,
  onInstall = () => {},
}) {
  const navButtonClass = (isActive) =>
    `${navBtnBase} ${
      isActive
        ? "border-[rgba(229,9,20,0.45)] bg-[rgba(229,9,20,0.22)] text-[var(--text)]"
        : "border-transparent bg-transparent text-[var(--muted)] hover:border-[rgba(229,9,20,0.35)] hover:bg-[rgba(229,9,20,0.16)] hover:text-[var(--text)]"
    }`;

  return (
    <nav className="sticky top-0 z-[100] flex flex-wrap items-center gap-3 border-b border-white/8 bg-gradient-to-b from-black/92 to-black/35 px-3 py-3 backdrop-blur md:gap-5 md:px-10 md:py-4">
      <button
        type="button"
        className="cursor-pointer bg-transparent text-xl font-extrabold tracking-[0.08em] text-[var(--brand)] md:text-2xl"
        onClick={() => navigate("home")}
      >
        {appConfig.siteName.toUpperCase()}
      </button>

      <div className="order-3 flex w-full gap-2 overflow-x-auto whitespace-nowrap pb-1 md:order-none md:w-auto md:pb-0">
        <button
          type="button"
          className={navButtonClass(activePage === "home")}
          onClick={() => navigate("home")}
        >
          Home
        </button>
        <button
          type="button"
          className={navButtonClass(activePage === "popular")}
          onClick={() => navigate("popular")}
        >
          Popular
        </button>
        <button
          type="button"
          className={navButtonClass(activePage === "shows")}
          onClick={() => navigate("shows")}
        >
          Shows
        </button>
        <button
          type="button"
          className={navButtonClass(activePage === "anime")}
          onClick={() => navigate("anime")}
        >
          Anime
        </button>
        <button
          type="button"
          className={navButtonClass(activePage === "my-list")}
          onClick={() => navigate("my-list")}
        >
          My List
        </button>
      </div>

      <div className="ml-auto flex items-center gap-2">
        <InstallButton canInstall={canInstall} onInstall={onInstall} />
        <SearchBar onSearch={onSearch} />
      </div>
    </nav>
  );
}
