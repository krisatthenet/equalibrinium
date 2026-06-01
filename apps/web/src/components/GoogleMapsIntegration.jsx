import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Navigation } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MarkerClusterer } from '@googlemaps/markerclusterer';
import { installMapsBootstrap } from '@/hooks/useGoogleMaps.js';

const ORANGE   = '#f97316';
const BLUE     = '#3b82f6';
const MAP_ID   = import.meta.env.VITE_GOOGLE_MAPS_MAP_ID || 'e7c94480b5619333d266cc00';
const LT_CENTER = { lat: 55.1694, lng: 23.8813 };
const LT_BOUNDS = { north: 56.45, south: 53.89, east: 26.85, west: 20.95 };

/** Poll for a truthy value with a timeout */
function waitUntil(getValue, intervalMs = 50, timeoutMs = 15000) {
  return new Promise((resolve, reject) => {
    const v = getValue();
    if (v) return resolve(v);
    const start = Date.now();
    const id = setInterval(() => {
      const val = getValue();
      if (val) { clearInterval(id); resolve(val); }
      else if (Date.now() - start > timeoutMs) { clearInterval(id); reject(new Error('waitUntil timeout')); }
    }, intervalMs);
  });
}

const GoogleMapsIntegration = ({ tickets = [], radius, onLocationChange }) => {
  const { t }    = useTranslation();
  const navigate = useNavigate();
  const gmpRef   = useRef(null);

  // Stable refs for map state — avoids re-running effects on every render
  const innerMapRef  = useRef(null);
  const AMERef       = useRef(null); // AdvancedMarkerElement class
  const infoWinRef   = useRef(null);
  const markersRef   = useRef([]);
  const clustererRef = useRef(null);
  const userPinRef   = useRef(null);
  const circleRef    = useRef(null);

  const [mapReady, setMapReady]       = useState(false);
  const [userLocation, setUserLocation] = useState(null);

  // ── Geolocation ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      pos => {
        const p = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setUserLocation(p);
        onLocationChange?.(p);
      },
      err => console.warn('Geolocation error:', err),
    );
  }, [onLocationChange]);

  // ── Map initialisation (Google's importLibrary pattern) ──────────────────
  useEffect(() => {
    installMapsBootstrap();

    async function init() {
      try {
        // Load marker + maps libraries in parallel (Google's recommended approach)
        const [{ AdvancedMarkerElement }, { InfoWindow }] = await Promise.all([
          window.google.maps.importLibrary('marker'),
          window.google.maps.importLibrary('maps'),
        ]);

        AMERef.current    = AdvancedMarkerElement;
        infoWinRef.current = new InfoWindow();

        // gmp-map exposes innerMap asynchronously after it upgrades
        const innerMap = await waitUntil(() => gmpRef.current?.innerMap);
        innerMapRef.current = innerMap;

        // Apply options on innerMap (Google's example pattern)
        innerMap.setOptions({ mapTypeControl: false });
        if (userLocation) innerMap.setCenter(userLocation);
        innerMap.setZoom(userLocation ? 11 : 7);

        setMapReady(true);
      } catch (err) {
        console.error('Map init failed:', err);
      }
    }

    init();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Ticket markers + clusterer ───────────────────────────────────────────
  useEffect(() => {
    const map = innerMapRef.current;
    const AME = AMERef.current;
    if (!mapReady || !map || !AME) return;

    // Tear down previous markers
    markersRef.current.forEach(m => { m.map = null; });
    markersRef.current = [];
    clustererRef.current?.clearMarkers();

    const { PinElement } = window.google.maps.marker;
    const geocoder = new window.google.maps.Geocoder();
    const newMarkers = [];

    const placeMarker = (ticket, lat, lng) => {
      const catName = ticket.expand?.categoryId?.name || 'Other';
      const pin = new PinElement({ background: ORANGE, borderColor: '#fff', glyphColor: '#fff' }).element;

      const marker = new AME({ position: { lat, lng }, map, title: catName, content: pin });

      marker.addListener('click', () => {
        infoWinRef.current.setContent(`
          <div style="font-family:system-ui,sans-serif;padding:14px 16px;min-width:220px;max-width:260px;background:#1e293b;color:#f1f5f9;border-radius:12px;box-shadow:0 8px 24px rgba(0,0,0,0.4);">
            <div style="display:flex;align-items:center;gap:8px;margin-bottom:10px;">
              <div style="width:10px;height:10px;border-radius:50%;background:${ORANGE};flex-shrink:0;"></div>
              <div style="font-size:12px;color:#94a3b8;font-weight:500;">${catName}</div>
            </div>
            <p style="font-size:13px;color:#94a3b8;margin-bottom:10px;line-height:1.5;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;">${ticket.description || ''}</p>
            ${ticket.budget
              ? `<div style="font-weight:600;color:#34d399;font-size:14px;margin-bottom:8px;">Budget: €${ticket.budget}</div>`
              : '<div style="font-size:12px;color:#64748b;margin-bottom:8px;">Open to offers</div>'}
            ${ticket.location ? `<div style="font-size:12px;color:#64748b;margin-bottom:10px;">📍 ${ticket.location}</div>` : ''}
            <button onclick="window.location.href='/auction-ticket/${ticket.id}'"
              style="width:100%;background:${ORANGE};color:#fff;border:none;padding:8px 12px;border-radius:8px;cursor:pointer;font-weight:600;font-size:13px;">
              View Request →
            </button>
          </div>
        `);
        infoWinRef.current.open(map, marker);
      });

      return marker;
    };

    tickets.forEach(ticket => {
      const lat = Number(ticket.latitude);
      const lng = Number(ticket.longitude);
      if (lat !== 0 || lng !== 0) {
        newMarkers.push(placeMarker(ticket, lat, lng));
      } else if (ticket.location) {
        geocoder.geocode({ address: ticket.location }, (results, status) => {
          if (status === 'OK' && results[0]) {
            const pos = results[0].geometry.location;
            const m = placeMarker(ticket, pos.lat(), pos.lng());
            markersRef.current.push(m);
            clustererRef.current?.addMarkers([m]);
          }
        });
      }
    });

    markersRef.current = newMarkers;
    clustererRef.current = new MarkerClusterer({ map, markers: newMarkers });
  }, [mapReady, tickets]);

  // ── User location marker + radius circle ─────────────────────────────────
  useEffect(() => {
    const map = innerMapRef.current;
    const AME = AMERef.current;
    if (!mapReady || !map || !AME || !userLocation) return;

    const { PinElement } = window.google.maps.marker;

    if (!userPinRef.current) {
      const pin = new PinElement({ background: BLUE, borderColor: '#fff', glyphColor: '#fff' }).element;
      userPinRef.current = new AME({ position: userLocation, map, title: 'My Location', content: pin });
    } else {
      userPinRef.current.position = userLocation;
    }

    circleRef.current?.setMap(null);
    if (radius && radius !== 'any') {
      circleRef.current = new window.google.maps.Circle({
        strokeColor: BLUE, strokeOpacity: 0.3, strokeWeight: 1,
        fillColor: BLUE, fillOpacity: 0.08,
        map, center: userLocation, radius: parseInt(radius) * 1000,
      });
    }
  }, [mapReady, userLocation, radius]);

  // ── Controls ─────────────────────────────────────────────────────────────
  const centerOnUser = () => {
    if (innerMapRef.current && userLocation) {
      innerMapRef.current.panTo(userLocation);
      innerMapRef.current.setZoom(12);
    }
  };

  const fitLithuania = () => {
    if (!innerMapRef.current || !window.google) return;
    innerMapRef.current.fitBounds(new window.google.maps.LatLngBounds(
      { lat: LT_BOUNDS.south, lng: LT_BOUNDS.west },
      { lat: LT_BOUNDS.north, lng: LT_BOUNDS.east },
    ));
  };

  return (
    <div style={{ isolation: 'isolate', position: 'relative', zIndex: 0 }}>
      <div className="relative w-full rounded-xl overflow-hidden border border-border shadow-sm">
        <gmp-map
          ref={gmpRef}
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
