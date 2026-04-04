import React, { useEffect, useRef, useState } from 'react';
import { useGoogleMaps } from '@/hooks/useGoogleMaps.js';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Navigation } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MarkerClusterer } from '@googlemaps/markerclusterer';

// Palette: index maps to a category
const PALETTE = [
  '#f59e0b', '#3b82f6', '#10b981', '#ef4444',
  '#8b5cf6', '#f97316', '#ec4899', '#06b6d4',
  '#84cc16', '#6366f1', '#14b8a6', '#e11d48',
];

const GoogleMapsIntegration = ({
  contractors = [],
  masters = [],
  tickets = [],
  categories = [],
  radius,
  onLocationChange,
}) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const mapRef = useRef(null);
  const { isLoaded, initMap } = useGoogleMaps();
  const [mapInstance, setMapInstance] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [legend, setLegend] = useState([]);

  const markersRef = useRef([]);
  const clustererRef = useRef(null);
  const infoWindowRef = useRef(null);
  const userMarkerRef = useRef(null);
  const radiusCircleRef = useRef(null);

  const displayItems = contractors.length > 0 ? contractors : masters;

  // Build a colour map: categoryId → hex
  const catColorMap = {};
  categories.forEach((cat, i) => {
    catColorMap[cat.id] = PALETTE[i % PALETTE.length];
  });

  const getCategoryColor = (categoryId) =>
    catColorMap[categoryId] || '#94a3b8';

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const p = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          setUserLocation(p);
          if (onLocationChange) onLocationChange(p);
        },
        (err) => console.warn('Geolocation error:', err)
      );
    }
  }, [onLocationChange]);

  useEffect(() => {
    if (isLoaded && mapRef.current && !mapInstance) {
      const map = initMap(mapRef.current, {
        center: userLocation || { lat: 54.6872, lng: 25.2797 },
        zoom: 11,
        disableDefaultUI: false,
        styles: [
          { elementType: 'geometry', stylers: [{ color: '#1e293b' }] },
          { elementType: 'labels.text.stroke', stylers: [{ color: '#1e293b' }] },
          { elementType: 'labels.text.fill', stylers: [{ color: '#94a3b8' }] },
          { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#334155' }] },
          { featureType: 'road', elementType: 'labels.text.fill', stylers: [{ color: '#64748b' }] },
          { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#0f172a' }] },
          { featureType: 'poi', elementType: 'geometry', stylers: [{ color: '#1e293b' }] },
          { featureType: 'transit', elementType: 'geometry', stylers: [{ color: '#1e293b' }] },
          { featureType: 'administrative', elementType: 'geometry', stylers: [{ color: '#334155' }] },
        ],
      });
      setMapInstance(map);
      infoWindowRef.current = new window.google.maps.InfoWindow();
    }
  }, [isLoaded, initMap, mapInstance, userLocation]);

  useEffect(() => {
    if (!mapInstance || !window.google) return;

    markersRef.current.forEach(m => m.setMap(null));
    markersRef.current = [];
    if (clustererRef.current) clustererRef.current.clearMarkers();

    const newMarkers = [];
    const legendEntries = [];

    // Contractor markers — arrow shape
    displayItems.forEach(item => {
      if (!item.latitude || !item.longitude) return;
      const color = item.isPromoted ? '#f59e0b' : '#10b981';

      const marker = new window.google.maps.Marker({
        position: { lat: item.latitude, lng: item.longitude },
        map: mapInstance,
        title: item.name,
        icon: {
          path: window.google.maps.SymbolPath.BACKWARD_CLOSED_ARROW,
          scale: 7,
          fillColor: color,
          fillOpacity: 1,
          strokeColor: '#ffffff',
          strokeWeight: 2,
        },
      });

      marker.addListener('click', () => {
        const stars = '★'.repeat(Math.round(item.rating || 0)) + '☆'.repeat(5 - Math.round(item.rating || 0));
        const content = `
          <div style="font-family:system-ui,sans-serif;padding:14px 16px;min-width:220px;max-width:260px;background:#1e293b;color:#f1f5f9;border-radius:12px;box-shadow:0 8px 24px rgba(0,0,0,0.4);">
            <div style="display:flex;align-items:center;gap:10px;margin-bottom:10px;">
              <div style="width:38px;height:38px;border-radius:50%;background:${color}22;border:2px solid ${color};display:flex;align-items:center;justify-content:center;font-size:18px;flex-shrink:0;">👤</div>
              <div>
                <div style="font-weight:700;font-size:15px;color:#f1f5f9;">${item.name}</div>
                ${item.profession ? `<div style="font-size:12px;color:#94a3b8;">${item.profession}</div>` : ''}
              </div>
            </div>
            ${item.isPromoted ? `<div style="display:inline-block;background:#fef08a22;color:#fbbf24;font-size:11px;padding:2px 10px;border-radius:99px;border:1px solid #fbbf2444;margin-bottom:8px;font-weight:600;">⭐ Promoted</div>` : ''}
            <div style="display:flex;align-items:center;gap:6px;margin-bottom:8px;">
              <span style="color:#fbbf24;font-size:14px;">${stars}</span>
              <span style="font-size:13px;color:#94a3b8;">(${item.reviewCount || 0})</span>
            </div>
            ${item.hourlyRate ? `<div style="font-weight:600;color:#60a5fa;font-size:14px;margin-bottom:10px;">€${item.hourlyRate}/hr</div>` : ''}
            ${item.location ? `<div style="font-size:12px;color:#64748b;margin-bottom:10px;">📍 ${item.location}</div>` : ''}
            <button onclick="window.location.href='/contractor/${item.id}'" style="width:100%;background:${color};color:#fff;border:none;padding:8px 12px;border-radius:8px;cursor:pointer;font-weight:600;font-size:13px;">
              View Profile →
            </button>
          </div>
        `;
        infoWindowRef.current.setContent(content);
        infoWindowRef.current.open(mapInstance, marker);
      });

      newMarkers.push(marker);
    });

    // Ticket markers — circle, colored by category
    const seenCategories = new Set();
    const geocoder = new window.google.maps.Geocoder();

    const placeTicketMarker = (ticket, lat, lng) => {
      const catId = ticket.categoryId;
      const color = getCategoryColor(catId);
      const catName = ticket.expand?.categoryId?.name || 'Request';

      if (!seenCategories.has(catId)) {
        seenCategories.add(catId);
        legendEntries.push({ color, label: catName });
        setLegend([...legendEntries]);
      }

      const marker = new window.google.maps.Marker({
        position: { lat, lng },
        map: mapInstance,
        title: catName,
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          scale: 9,
          fillColor: color,
          fillOpacity: 0.9,
          strokeColor: '#ffffff',
          strokeWeight: 2.5,
        },
      });

      marker.addListener('click', () => {
        const content = `
          <div style="font-family:system-ui,sans-serif;padding:14px 16px;min-width:220px;max-width:260px;background:#1e293b;color:#f1f5f9;border-radius:12px;box-shadow:0 8px 24px rgba(0,0,0,0.4);">
            <div style="display:flex;align-items:center;gap:8px;margin-bottom:10px;">
              <div style="width:10px;height:10px;border-radius:50%;background:${color};flex-shrink:0;"></div>
              <div style="font-size:12px;color:#94a3b8;font-weight:500;">${catName}</div>
            </div>
            <div style="font-weight:700;font-size:15px;color:#f1f5f9;margin-bottom:8px;line-height:1.4;">${ticket.expand?.categoryId?.name || 'Service Request'}</div>
            <p style="font-size:13px;color:#94a3b8;margin-bottom:10px;line-height:1.5;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;">${ticket.description || ''}</p>
            ${ticket.budget ? `<div style="font-weight:600;color:#34d399;font-size:14px;margin-bottom:8px;">Budget: €${ticket.budget}</div>` : '<div style="font-size:12px;color:#64748b;margin-bottom:8px;">Open to offers</div>'}
            ${ticket.location ? `<div style="font-size:12px;color:#64748b;margin-bottom:10px;">📍 ${ticket.location}</div>` : ''}
            <button onclick="window.location.href='/auction-ticket/${ticket.id}'" style="width:100%;background:${color};color:#fff;border:none;padding:8px 12px;border-radius:8px;cursor:pointer;font-weight:600;font-size:13px;">
              View Request →
            </button>
          </div>
        `;
        infoWindowRef.current.setContent(content);
        infoWindowRef.current.open(mapInstance, marker);
      });

      return marker;
    };

    tickets.forEach(ticket => {
      const lat = Number(ticket.latitude);
      const lng = Number(ticket.longitude);

      if (lat !== 0 || lng !== 0) {
        // Has real coordinates — place immediately
        newMarkers.push(placeTicketMarker(ticket, lat, lng));
      } else if (ticket.location) {
        // No coordinates — geocode location string asynchronously
        geocoder.geocode({ address: ticket.location }, (results, status) => {
          if (status === 'OK' && results[0]) {
            const pos = results[0].geometry.location;
            const marker = placeTicketMarker(ticket, pos.lat(), pos.lng());
            markersRef.current.push(marker);
            clustererRef.current?.addMarkers([marker]);
          }
        });
      }
    });

    setLegend(legendEntries);
    markersRef.current = newMarkers;

    clustererRef.current = new MarkerClusterer({
      map: mapInstance,
      markers: newMarkers,
    });
  }, [mapInstance, displayItems, tickets, categories]);

  // User location marker & radius circle
  useEffect(() => {
    if (!mapInstance || !window.google || !userLocation) return;

    if (!userMarkerRef.current) {
      userMarkerRef.current = new window.google.maps.Marker({
        position: userLocation,
        map: mapInstance,
        title: 'My Location',
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          scale: 9,
          fillColor: '#3b82f6',
          fillOpacity: 1,
          strokeColor: '#ffffff',
          strokeWeight: 3,
        },
      });
    } else {
      userMarkerRef.current.setPosition(userLocation);
    }

    if (radiusCircleRef.current) radiusCircleRef.current.setMap(null);

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
    if (mapInstance && userLocation) {
      mapInstance.panTo(userLocation);
      mapInstance.setZoom(12);
    }
  };

  if (!isLoaded) {
    return (
      <div className="w-full h-[500px] bg-muted rounded-xl animate-pulse flex items-center justify-center text-muted-foreground">
        Loading Map...
      </div>
    );
  }

  return (
    <div style={{ isolation: 'isolate', position: 'relative', zIndex: 0 }}>
    <div className="relative w-full rounded-xl overflow-hidden border border-border shadow-sm">
      <div ref={mapRef} className="w-full h-[600px]" />

      {/* My location button */}
      <Button
        variant="secondary"
        size="icon"
        className="absolute bottom-6 right-6 shadow-lg rounded-full bg-background hover:bg-muted z-10"
        onClick={centerOnUser}
        title="My Location"
      >
        <Navigation className="h-5 w-5 text-primary" />
      </Button>

      {/* Category legend */}
      {legend.length > 0 && (
        <div className="absolute bottom-6 left-4 bg-card/90 backdrop-blur-sm border border-border rounded-xl p-3 z-10 max-w-[200px] shadow-lg">
          <p className="text-xs font-semibold text-foreground mb-2">Categories</p>
          <div className="space-y-1.5">
            {legend.map(entry => (
              <div key={entry.label} className="flex items-center gap-2">
                <span
                  className="inline-block w-3 h-3 rounded-full shrink-0"
                  style={{ background: entry.color }}
                />
                <span className="text-xs text-muted-foreground truncate">{entry.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Marker type legend */}
      <div className="absolute top-4 left-4 bg-card/90 backdrop-blur-sm border border-border rounded-xl px-3 py-2 z-10 shadow-lg flex items-center gap-4">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <span className="inline-block w-3 h-3 rounded-full bg-emerald-500" />
          Contractors
        </div>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <span className="inline-block w-3 h-3 rounded-full bg-blue-500" />
          Requests
        </div>
      </div>
    </div>
    </div>
  );
};

export default GoogleMapsIntegration;
