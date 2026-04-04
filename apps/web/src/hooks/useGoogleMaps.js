import { useState, useEffect, useCallback } from 'react';

export const useGoogleMaps = () => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [loadError, setLoadError] = useState(null);

  useEffect(() => {
    // Check if already loaded via index.html or previous dynamic load
    if (window.google && window.google.maps) {
      setIsLoaded(true);
      return;
    }

    const envKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
    const apiKey = (!envKey || envKey === 'YOUR_GOOGLE_MAPS_API_KEY')
      ? 'AIzaSyA73M8t4gfdSqBz3-tiHHo2YQdqXxw3B7c'
      : envKey;

    const existingScript = document.querySelector('script[src*="maps.googleapis.com/maps/api/js"]');
    if (existingScript) {
      existingScript.addEventListener('load', () => setIsLoaded(true));
      existingScript.addEventListener('error', (e) => setLoadError(e));
      return;
    }

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
    script.async = true;
    script.defer = true;
    script.onload = () => setIsLoaded(true);
    script.onerror = (err) => setLoadError(err);
    document.head.appendChild(script);
  }, []);

  const initMap = useCallback((mapElement, options) => {
    if (!isLoaded || !window.google) return null;
    return new window.google.maps.Map(mapElement, options);
  }, [isLoaded]);

  return { isLoaded, loadError, initMap };
};