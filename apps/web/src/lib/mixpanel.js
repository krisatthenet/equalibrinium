import mixpanel from 'mixpanel-browser';

const TOKEN = import.meta.env.VITE_MIXPANEL_TOKEN || '7c2fbafefffaf5caa2b94529c4e82d83';
let initialized = false;

function hasConsent() {
  return localStorage.getItem('cookieConsent') === 'accepted';
}

export function initMixpanel() {
  if (initialized || !hasConsent()) return;
  mixpanel.init(TOKEN, { persistence: 'localStorage', track_pageview: false });
  initialized = true;
  mixpanel.track_pageview();
}

export function trackPageView() {
  if (!initialized) return;
  mixpanel.track_pageview();
}

export function identify(userId, profileProps = {}) {
  if (!initialized) return;
  mixpanel.identify(userId);
  if (Object.keys(profileProps).length > 0) {
    mixpanel.people.set(profileProps);
  }
}

export function track(event, props = {}) {
  if (!initialized) return;
  mixpanel.track(event, { platform: 'web', ...props });
}

export function reset() {
  if (!initialized) return;
  mixpanel.reset();
}
