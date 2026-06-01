import React, { useEffect, useRef, useState } from 'react';
import { useGoogleMaps } from '@/hooks/useGoogleMaps.js';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Navigation } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MarkerClusterer } from '@googlemaps/markerclusterer';

const ORANGE = '#f97316';
const MAP_ID  = import.meta.env.VITE_GOOGLE_MAPS_MAP_ID || 'e7c94480b5619333d266cc00';

const LT_CENTER = { lat: 55.1694, lng: 23.8813 };
const LT_BOUNDS = { north: 56.45, south: 53.89, east: 26.85, west: 20.95 };

// Build a coloured dot using PinElement (requires marker library).
function makePinElement(color, scale = 1) {
  const PinElement = window.google.maps.marker.PinElement;
  return new PinElement({ background: color, borderColor: '#ffffff', glyphColor: '#ffffff', scale }).element;
}

const GoogleMapsIntegration = ({ tickets = [], radius, onLocationChange }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { isLoaded } = useGoogleMaps();
  const gmpMapRef = useRef(null);
  const [mapInstance, setMapInstance] = useState(null);
  const [userLocation, setUserLocation] = useState(null);

  const markersRef      = useRef([]);
  const clustererRef    = useRef(null);
  const infoWindowRef   = useRef(null);
  const userMarkerRef   = useRef(null);
  const radiusCircleRef = useRef(null);

  // Geolocation
  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const p = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setUserLocation(p);
        onLocationChange?.(p);
      },
      (err) => console.warn('Geolocation error:', err),
    );
  }, [onLocationChange]);

  // Wait for gmp-map web component to expose innerMap, then store it.
  useEffect(() => {
    if (!isLoaded) return;
    let id;
    const poll = () => {
      const inner = gmpMapRef.current?.innerMap;
      if (inner) {
        inner.setOptions({ gestureHandling: 'greedy', scrollwheel: true });
        if (userLocation) inner.setCenter(userLocation);
        inner.setZoom(userLocation ? 11 : 7);
        infoWindowRef.current = new window.google.maps.InfoWindow();
        setMapInstance(inner);
      } else {
        id = setTimeout(poll, 100);
      }
    };
    poll();
    return () => clearTimeout(id);
  }, [isLoaded]); // userLocation intentionally excluded — centering handled below

  // Ticket markers + clusterer
  useEffect(() => {
    if (!mapInstance || !window.google) return;

    // Tear down previous markers
    markersRef.current.forEach((m) => { m.map = null; });
    markersRef.current = [];
    clustererRef.current?.clearMarkers();

    const AdvancedMarkerElement = window.google.maps.marker.AdvancedMarkerElement;
    const geocoder = new window.google.maps.Geocoder();
    const newMarkers = [];

    const placeTicketMarker = (ticket, lat, lng) => {
      const catName = ticket.expand?.categoryId?.name || 'Other';
      const pin = makePinElement(ORANGE);

      const marker = new AdvancedMarkerElement({
        position: { lat, lng },
        map: mapInstance,
        title: catName,
        content: pin,
      });

      marker.addListener('click', () => {
        const content = `
          <div style="font-family:system-ui,sans-serif;padding:14px 16px;min-width:220px;max-width:260px;background:#1e293b;color:#f1f5f9;border-radius:12px;box-shadow:0 8px 24px rgba(0,0,0,0.4);">
            <div style="display:flex;align-items:center;gap:8px;margin-bottom:10px;">
              <div style="width:10px;height:10px;border-radius:50%;background:${ORANGE};flex-shrink:0;"></div>
              <div style="font-size:12px;color:#94a3b8;font-weight:500;">${catName}</div>
            </div>
            <p style="font-size:13px;color:#94a3b8;margin-bottom:10px;line-height:1.5;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;">${ticket.description || ''}</p>
            ${ticket.budget ? `<div style="font-weight:600;color:#34d399;font-size:14px;margin-bottom:8px;">Budget: €${ticket.budget}</div>` : '<div style="font-size:12px;color:#64748b;margin-bottom:8px;">Open to offers</div>'}
            ${ticket.location ? `<div style="font-size:12px;color:#64748b;margin-bottom:10px;">📍 ${ticket.location}</div>` : ''}
            <button onclick="window.location.href='/auction-ticket/${ticket.id}'" style="width:100%;background:${ORANGE};color:#fff;border:none;padding:8px 12px;border-radius:8px;cursor:pointer;font-weight:600;font-size:13px;">
              View Request →
            </button>
          </div>
        `;
        infoWindowRef.current.setContent(content);
        infoWindowRef.current.open(mapInstance, marker);
      });

      return marker;
    };

    tickets.forEach((ticket) => {
      const lat = Number(ticket.latitude);
      const lng = Number(ticket.longitude);
      if (lat !== 0 || lng !== 0) {
        newMarkers.push(placeTicketMarker(ticket, lat, lng));
      } else if (ticket.location) {
        geocoder.geocode({ address: ticket.location }, (results, status) => {
          if (status === 'OK' && results[0]) {
            const pos = results[0].geometry.location;
            const m = placeTicketMarker(ticket, pos.lat(), pos.lng());
            markersRef.current.push(m);
            clustererRef.current?.addMarkers([m]);
          }
        });
      }
    });

    markersRef.current = newMarkers;
    clustererRef.current = new MarkerClusterer({ map: mapInstance, markers: newMarkers });
  }, [mapInstance, tickets]);

  // User location marker + radius circle
  useEffect(() => {
    if (!mapInstance || !window.google || !userLocation) return;

    const AdvancedMarkerElement = window.google.maps.marker.AdvancedMarkerElement;

    if (!userMarkerRef.current) {
      userMarkerRef.current = new AdvancedMarkerElement({
        position: userLocation,
        map: mapInstance,
        title: 'My Location',
        content: makePinElement('#3b82f6'),
      });
    } else {
      userMarkerRef.current.position = userLocation;
    }

    radiusCircleRef.current?.setMap(null);
    if (radius && radius !== 'any') {
      radiusCircleRef.current = new window.google.maps.Circle({
        strokeColor: '#3b82f6',
        strokeOpacity: 0.3,
        strokeWeight: 1,
        fillColor: '#3b82f6',
        fillOpacity: 0.08,
        map: mapInstance,
        center: userLocation,
        radius: parseInt(radius) * 1000,
      });
    }
  }, [mapInstance, userLocation, radius]);

  const centerOnUser = () => {
    if (mapInstance && userLocation) { mapInstance.panTo(userLocation); mapInstance.setZoom(12); }
  };

  const fitLithuania = () => {
    if (!mapInstance || !window.google) return;
    mapInstance.fitBounds(new window.google.maps.LatLngBounds(
      { lat: LT_BOUNDS.south, lng: LT_BOUNDS.west },
      { lat: LT_BOUNDS.north, lng: LT_BOUNDS.east },
    ));
  };

  if (!isLoaded) {
    return (
      <div className="w-full h-[500px] bg-muted rounded-xl animate-pulse flex items-center justify-center text-muted-foreground">
        Loading Map…
      </div>
    );
  }

  return (
    <div style={{ isolation: 'isolate', position: 'relative', zIndex: 0 }}>
      <div className="relative w-full rounded-xl border border-border shadow-sm" style={{ overflow: 'clip' }}>
        <gmp-map
          ref={gmpMapRef}
          center={`${LT_CENTER.lat},${LT_CENTER.lng}`}
          zoom="7"
          map-id={MAP_ID}
          style={{ height: '600px', display: 'block' }}
        />

        <Button
          variant="secondary"
          size="icon"
          className="absolute bottom-6 right-6 shadow-lg rounded-full bg-background hover:bg-muted z-10"
          onClick={centerOnUser}
          title="My Location"
        >
          <Navigation className="h-5 w-5 text-primary" />
        </Button>

        <Button
          variant="secondary"
          size="sm"
          className="absolute bottom-6 right-16 shadow-lg rounded-full bg-background hover:bg-muted z-10 text-xs px-3 h-9"
          onClick={fitLithuania}
          title="View all Lithuania"
        >
          🇱🇹 Lithuania
        </Button>
      </div>
    </div>
  );
};

export default GoogleMapsIntegration;
