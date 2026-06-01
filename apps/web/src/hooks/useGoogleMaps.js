import { useState, useEffect } from 'react';

const API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY
  || 'AIzaSyA73M8t4gfdSqBz3-tiHHo2YQdqXxw3B7c';

/**
 * Install Google's official Maps bootstrap loader (runs once globally).
 * Sets up google.maps.importLibrary() without fetching the full API yet.
 * The actual Maps JS is only downloaded when importLibrary() is first called.
 */
export function installMapsBootstrap() {
  if (window.google?.maps?.importLibrary) return;
  /* eslint-disable */
  (g=>{var h,a,k,p="The Google Maps JavaScript API",c="google",l="importLibrary",q="__ib__",m=document,b=window;b=b[c]||(b[c]={});var d=b.maps||(b.maps={}),r=new Set,e=new URLSearchParams,u=()=>h||(h=new Promise(async(f,n)=>{await (a=m.createElement("script"));e.set("libraries",[...r]+"");for(k in g)e.set(k.replace(/[A-Z]/g,t=>"_"+t[0].toLowerCase()),g[k]);e.set("callback",c+".maps."+q);a.src=`https://maps.${c}apis.com/maps/api/js?`+e;d[q]=f;a.onerror=()=>h=n(Error(p+" could not load."));a.nonce=m.querySelector("script[nonce]")?.nonce||"";m.head.append(a)}));d[l]?console.warn(p+" only loads once. Ignoring:",g):d[l]=(f,...n)=>r.add(f)&&u().then(()=>d[l](f,...n))})({key: API_KEY, v: "weekly"});
  /* eslint-enable */
}

/**
 * Loads the Maps Places library (needed for autocomplete components).
 * Returns { isLoaded, loadError }.
 */
export const useGoogleMaps = () => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [loadError, setLoadError] = useState(null);

  useEffect(() => {
    if (window.google?.maps?.places) { setIsLoaded(true); return; }

    installMapsBootstrap();

    window.google.maps.importLibrary('places')
      .then(() => setIsLoaded(true))
      .catch(e => setLoadError(e));
  }, []);

  return { isLoaded, loadError };
};
