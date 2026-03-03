// App configuration values for appConfig.
const env = import.meta.env || {};

export const appConfig = {
  siteName: env.VITE_SITE_NAME || "Ciniverse",
  siteUrl: env.VITE_SITE_URL || "https://ciniverse-movie-app.vercel.app",
  analyticsEnabled: (env.VITE_ANALYTICS_ENABLED || "true") === "true",
  installEnabled: (env.VITE_INSTALL_ENABLED || "true") === "true",
};

export const uiLabels = {
  watchFullMovie: "Watch Full Movie",
  hideFullMovie: "Hide Full Movie",
  loadingStream: "Loading Licensed Stream...",
};
