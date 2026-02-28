import { appConfig } from "../config/appConfig";

const EVENTS_KEY = "ciniverse.analytics_events";
const MAX_EVENTS = 300;

function readEvents() {
  try {
    const raw = window.localStorage.getItem(EVENTS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function writeEvents(events) {
  try {
    window.localStorage.setItem(EVENTS_KEY, JSON.stringify(events.slice(-MAX_EVENTS)));
  } catch {
    // Ignore persistence issues.
  }
}

export function trackEvent(name, payload = {}) {
  if (!appConfig.analyticsEnabled || typeof window === "undefined") {
    return;
  }

  const event = {
    name,
    payload,
    ts: new Date().toISOString(),
  };
  const events = readEvents();
  events.push(event);
  writeEvents(events);

  // Useful during local development.
  // eslint-disable-next-line no-console
  console.info("[analytics]", event);
}
