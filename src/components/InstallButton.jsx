// UI component: InstallButton.
export default function InstallButton({ canInstall, onInstall }) {
  // Hide install CTA when browser/PWA install prompt is unavailable.
  if (!canInstall) {
    return null;
  }

  return (
    <button type="button" className="install-btn" onClick={onInstall}>
      <svg aria-hidden="true" viewBox="0 0 24 24" width="16" height="16">
        <path
          d="M12 3v11m0 0-4-4m4 4 4-4M5 15v3a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-3"
          fill="none"
          stroke="currentColor"
          strokeWidth="3.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <span className="install-btn-text">Install App</span>
    </button>
  );
}
