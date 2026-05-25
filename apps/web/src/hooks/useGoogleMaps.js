import { useState, useEffect, useCallback } from 'react';

const ECL_SRC = 'https://ajax.googleapis.com/ajax/libs/@googlemaps/extended-component-library/0.6.11/index.min.js';

// Singleton promise so ECL is only injected once regardless of how many
// components call useGoogleMaps concurrently.
let eclPromise = null;

function loadECL(apiKey) {
  if (eclPromise) return eclPromise;

  eclPromise = new Promise((resolve, reject) => {
    // Inject gmpx-api-loader — ECL upgrades it once the module parses.
    if (!document.querySelector('gmpx-api-loader')) {
      const apiLoader = document.createElement('gmpx-api-loader');
      apiLoader.setAttribute('key', apiKey);
      apiLoader.setAttribute('additional-library-names', 'places,marker');
      document.head.appendChild(apiLoader);
    }

    // Inject ECL module script.
    if (!document.querySelector(`script[src="${ECL_SRC}"]`)) {
      const script = document.createElement('script');
      script.type = 'module';
      script.src = ECL_SRC;
      document.head.appendChild(script);
    }

    // window.google.maps becomes available after gmpx-api-loader upgrades
    // and triggers Loader.load() internally. Poll until ready.
    let attempts = 0;
    const poll = setInterval(() => {
      if (window.google?.maps) {
        clearInterval(poll);
        resolve();
      } else if (++attempts > 150) {
        clearInterval(poll);
        reject(new Error('Google Maps failed to load within 15 s'));
      }
    }, 100);
  });

  return eclPromise;
}

export const useGoogleMaps = () => {
  const [isLoaded, setIsLoaded] = useState(!!(window.google?.maps));
  const [loadError, setLoadError] = useState(null);

  useEffect(() => {
    if (isLoaded) return;
    const envKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
    const apiKey = (!envKey || envKey === 'YOUR_GOOGLE_MAPS_API_KEY')
      ? 'AIzaSyA73M8t4gfdSqBz3-tiHHo2YQdqXxw3B7c'
      : envKey;

    loadECL(apiKey)
      .then(() => setIsLoaded(true))
      .catch((e) => setLoadError(e));
  }, [isLoaded]);

  // Kept for components that still create a map imperatively (GoogleMapsIntegration).
  const initMap = useCallback((mapElement, options) => {
    if (!isLoaded || !window.google) return null;
    return new window.google.maps.Map(mapElement, options);
  }, [isLoaded]);

  return { isLoaded, loadError, initMap };
};
