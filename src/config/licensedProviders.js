// App configuration values for licensedProviders.
const DEFAULT_LICENSED_PROVIDERS = [
  { name: "Netflix", url: "https://www.netflix.com" },
  { name: "Prime Video", url: "https://www.primevideo.com" },
  { name: "Disney+", url: "https://www.disneyplus.com" },
  { name: "Apple TV+", url: "https://tv.apple.com" },
];

function parseProviderEntry(entry) {
  const [namePart, urlPart] = entry.split("|").map((part) => part.trim());
  if (!namePart) {
    return null;
  }

  return {
    name: namePart,
    url: urlPart || "",
  };
}

function parseProvidersFromEnv() {
  const raw = import.meta.env.VITE_LICENSED_PROVIDERS || "";
  if (!raw.trim()) {
    return [];
  }

  return raw
    .split(",")
    .map((entry) => parseProviderEntry(entry))
    .filter(Boolean);
}

export const licensedProviders = (() => {
  const fromEnv = parseProvidersFromEnv();
  return fromEnv.length ? fromEnv : DEFAULT_LICENSED_PROVIDERS;
})();
