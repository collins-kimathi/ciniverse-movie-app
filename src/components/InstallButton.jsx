export default function InstallButton({ canInstall, onInstall }) {
  if (!canInstall) {
    return null;
  }

  return (
    <button type="button" className="install-btn" onClick={onInstall}>
      Install App
    </button>
  );
}
