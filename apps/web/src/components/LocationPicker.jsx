import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { MapPin } from 'lucide-react';
import { useGoogleMaps } from '@/hooks/useGoogleMaps.js';

const MAP_ID = import.meta.env.VITE_GOOGLE_MAPS_MAP_ID || 'e7c94480b5619333d266cc00';
const DEFAULT_CENTER = '54.6872,25.2797';

const LocationPicker = ({ initialLocation, onLocationSelect, onSave }) => {
  const { t } = useTranslation();
  const { isLoaded } = useGoogleMaps();
  const gmpMapRef  = useRef(null);
  const markerRef  = useRef(null);
  const pickerRef  = useRef(null);
  const [markerPos, setMarkerPos] = useState(initialLocation || null);
  const [address,   setAddress]   = useState(initialLocation?.address || '');

  // Set initial marker when map inner map is ready.
  useEffect(() => {
    if (!isLoaded || !initialLocation) return;
    const trySet = () => {
      const m = markerRef.current;
      const map = gmpMapRef.current;
      if (!m || !map) return false;
      m.position = { lat: initialLocation.lat, lng: initialLocation.lng };
      map.center = { lat: initialLocation.lat, lng: initialLocation.lng };
      map.zoom = 14;
      return true;
    };
    if (!trySet()) {
      const id = setInterval(() => { if (trySet()) clearInterval(id); }, 100);
      return () => clearInterval(id);
    }
  }, [isLoaded, initialLocation]);

  // gmpx-place-picker → gmpx-placechange
  useEffect(() => {
    const picker = pickerRef.current;
    if (!isLoaded || !picker) return;

    const onPlaceChange = () => {
      const place = picker.value;
      if (!place?.location) return;

      const lat = typeof place.location.lat === 'function' ? place.location.lat() : place.location.lat;
      const lng = typeof place.location.lng === 'function' ? place.location.lng() : place.location.lng;
      const addr = place.formattedAddress || place.displayName || '';

      setMarkerPos({ lat, lng });
      setAddress(addr);

      const map = gmpMapRef.current;
      if (map) {
        if (place.viewport) map.innerMap?.fitBounds(place.viewport);
        else { map.center = place.location; map.zoom = 17; }
      }
      if (markerRef.current) markerRef.current.position = place.location;
      onLocationSelect?.({ lat, lng, address: addr });
    };

    picker.addEventListener('gmpx-placechange', onPlaceChange);
    return () => picker.removeEventListener('gmpx-placechange', onPlaceChange);
  }, [isLoaded, onLocationSelect]);

  // Click-on-map to drop a pin.
  useEffect(() => {
    if (!isLoaded) return;
    let listener;
    const attach = () => {
      const inner = gmpMapRef.current?.innerMap;
      if (!inner) return false;
      listener = inner.addListener('click', (e) => {
        const lat = e.latLng.lat();
        const lng = e.latLng.lng();
        setMarkerPos({ lat, lng });
        if (markerRef.current) markerRef.current.position = { lat, lng };

        new window.google.maps.Geocoder().geocode({ location: { lat, lng } }, (results, status) => {
          const addr = status === 'OK' && results[0] ? results[0].formatted_address : '';
          setAddress(addr);
          onLocationSelect?.({ lat, lng, address: addr });
        });
      });
      return true;
    };
    if (!attach()) {
      const id = setInterval(() => { if (attach()) clearInterval(id); }, 200);
      return () => { clearInterval(id); listener?.remove(); };
    }
    return () => listener?.remove();
  }, [isLoaded, onLocationSelect]);

  const handleSave = (e) => {
    e.preventDefault();
    if (onSave && markerPos) onSave({ ...markerPos, address });
  };

  if (!isLoaded) {
    return (
      <div className="w-full h-[300px] bg-muted rounded-lg animate-pulse flex items-center justify-center text-muted-foreground">
        Loading Map…
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <gmpx-place-picker
        ref={pickerRef}
        placeholder="Search for a location…"
        style={{ width: '100%', display: 'block' }}
      />

      <div className="border border-border rounded-lg overflow-hidden">
        <gmp-map
          ref={gmpMapRef}
          center={markerPos ? `${markerPos.lat},${markerPos.lng}` : DEFAULT_CENTER}
          zoom={markerPos ? '14' : '11'}
          map-id={MAP_ID}
          style={{ height: '300px', display: 'block' }}
        >
          <gmp-advanced-marker ref={markerRef} />
        </gmp-map>
      </div>

      <div className="flex items-center justify-between bg-muted/30 p-3 rounded-lg border border-border">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <MapPin className="h-4 w-4 text-primary shrink-0" />
          {markerPos ? (
            <span className="truncate max-w-[200px] sm:max-w-xs">
              {address || `${t('location.selected')}: ${markerPos.lat.toFixed(4)}, ${markerPos.lng.toFixed(4)}`}
            </span>
          ) : (
            <span>{t('location.click_prompt')}</span>
          )}
        </div>
        {onSave && (
          <Button
            type="button"
            size="sm"
            onClick={handleSave}
            disabled={!markerPos}
            className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg"
          >
            {t('location.save')}
          </Button>
        )}
      </div>
    </div>
  );
};

export default LocationPicker;
