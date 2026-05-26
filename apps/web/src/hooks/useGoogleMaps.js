import { useState, useEffect, useCallback } from 'react';

let mapsPromise = null;

function loadMaps(apiKey) {
  if (window.google?.maps?.places) return Promise.resolve();
  if (mapsPromise) return mapsPromise;

  mapsPromise = new Promise((resolve, reject) => {
    const callbackName = '__googleMapsLoaded';
    window[callbackName] = () => {
      delete window[callbackName];
      resolve();
    };

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places,marker&callback=${callbackName}`;
    script.async = true;
    script.defer = true;
    script.onerror = () => {
      mapsPromise = null; // allow retry on next mount
      reject(new Error('Google Maps script failed to load'));
    };
    document.head.appendChild(script);
  });

  return mapsPromise;
}

export const useGoogleMaps = () => {
  const [isLoaded, setIsLoaded] = useState(!!(window.google?.maps?.places));
  const [loadError, setLoadError] = useState(null);

  useEffect(() => {
    if (isLoaded) return;

    const envKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
    const apiKey = (!envKey || envKey === 'YOUR_GOOGLE_MAPS_API_KEY')
      ? 'AIzaSyA73M8t4gfdSqBz3-tiHHo2YQdqXxw3B7c'
      : envKey;

    loadMaps(apiKey)
      .then(() => setIsLoaded(true))
      .catch((e) => setLoadError(e));
  }, [isLoaded]);

  const initMap = useCallback((mapElement, options) => {
    if (!isLoaded || !window.google) return null;
    return new window.google.maps.Map(mapElement, options);
  }, [isLoaded]);

  return { isLoaded, loadError, initMap };
};
