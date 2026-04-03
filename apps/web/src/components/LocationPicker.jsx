import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { MapPin } from 'lucide-react';
import { useGoogleMaps } from '@/hooks/useGoogleMaps.js';
import PlacesAutocompleteInput from '@/components/PlacesAutocompleteInput.jsx';

const LocationPicker = ({ initialLocation, onLocationSelect, onSave }) => {
  const { t } = useTranslation();
  const mapRef = useRef(null);
  const { isLoaded, initMap } = useGoogleMaps();
  const [mapInstance, setMapInstance] = useState(null);
  const [markerInstance, setMarkerInstance] = useState(null);
  const [markerPos, setMarkerPos] = useState(initialLocation || null);
  const [address, setAddress] = useState(initialLocation?.address || '');

  const defaultCenter = { lat: 54.6872, lng: 25.2797 };

  useEffect(() => {
    if (isLoaded && mapRef.current && !mapInstance) {
      const map = initMap(mapRef.current, {
        center: markerPos || defaultCenter,
        zoom: markerPos ? 14 : 11,
        disableDefaultUI: false,
        styles: [
          { elementType: "geometry", stylers: [{ color: "#242f3e" }] },
          { elementType: "labels.text.stroke", stylers: [{ color: "#242f3e" }] },
          { elementType: "labels.text.fill", stylers: [{ color: "#746855" }] },
          { featureType: "water", elementType: "geometry", stylers: [{ color: "#17263c" }] }
        ]
      });

      map.addListener('click', (e) => {
        const newPos = { lat: e.latLng.lat(), lng: e.latLng.lng() };
        updateMarkerAndAddress(newPos, map);
      });

      setMapInstance(map);
    }
  }, [isLoaded, initMap, mapInstance]);

  useEffect(() => {
    if (mapInstance && markerPos && !markerInstance) {
      const m = new window.google.maps.Marker({
        position: markerPos,
        map: mapInstance,
        icon: {
          path: window.google.maps.SymbolPath.BACKWARD_CLOSED_ARROW,
          scale: 6,
          fillColor: "#fbc706",
          fillOpacity: 1,
          strokeColor: "#ffffff",
          strokeWeight: 2,
        }
      });
      setMarkerInstance(m);
    } else if (markerInstance && markerPos) {
      markerInstance.setPosition(markerPos);
    }
  }, [mapInstance, markerPos, markerInstance]);

  const updateMarkerAndAddress = (pos, map) => {
    setMarkerPos(pos);
    if (map) map.panTo(pos);

    if (window.google && window.google.maps) {
      const geocoder = new window.google.maps.Geocoder();
      geocoder.geocode({ location: pos }, (results, status) => {
        let locationName = '';
        if (status === 'OK' && results[0]) {
          locationName = results[0].formatted_address;
          setAddress(locationName);
        }
        if (onLocationSelect) {
          onLocationSelect({ ...pos, address: locationName });
        }
      });
    }
  };

  const handlePlaceSelect = (placeDetails) => {
    const pos = { lat: placeDetails.lat, lng: placeDetails.lng };
    setMarkerPos(pos);
    setAddress(placeDetails.address);
    if (mapInstance) {
      mapInstance.panTo(pos);
      mapInstance.setZoom(15);
    }
    if (onLocationSelect) {
      onLocationSelect({ ...pos, address: placeDetails.address });
    }
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (onSave && markerPos) {
      onSave({ ...markerPos, address });
    }
  };

  if (!isLoaded) return <div className="w-full h-[300px] bg-muted rounded-lg animate-pulse flex items-center justify-center">Loading Map...</div>;

  return (
    <div className="space-y-4">
      <PlacesAutocompleteInput 
        placeholder="Search for a location..."
        onSelectPlace={handlePlaceSelect}
        className="bg-input border-border text-foreground rounded-lg"
      />

      <div className="border border-border rounded-lg overflow-hidden relative">
        <div ref={mapRef} className="w-full h-[300px]" />
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