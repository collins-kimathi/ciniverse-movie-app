export default function InstallButton({ canInstall, onInstall }) {
  if (!canInstall) {
    return null;
  }

  return (
    <button
      type="button"
      className="hidden cursor-pointer rounded-full border border-white/25 bg-white/10 px-3 py-2 text-sm font-semibold text-[var(--text)] transition hover:bg-white/20 md:block"
      onClick={onInstall}
    >
      Install App
    </button>
  );
}
