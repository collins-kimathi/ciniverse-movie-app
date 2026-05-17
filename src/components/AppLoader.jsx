// UI component: full-page loading screen.
export default function AppLoader() {
  return (
    <main className="app-loader" aria-live="polite" aria-busy="true">
      <div className="cine-loader" aria-hidden="true" />
    </main>
  );
}
