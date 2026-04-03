import React, { useEffect, useRef, useState } from 'react';
import { useGoogleMaps } from '@/hooks/useGoogleMaps.js';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Navigation } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MarkerClusterer } from '@googlemaps/markerclusterer';
import pb from '@/lib/pocketbaseClient.js';

const GoogleMapsIntegration = ({ contractors = [], masters = [], tickets = [], radius, onLocationChange }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const mapRef = useRef(null);
  const { isLoaded, initMap } = useGoogleMaps();
  const [mapInstance, setMapInstance] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  
  const markersRef = useRef([]);
  const clustererRef = useRef(null);
  const infoWindowRef = useRef(null);
  const userMarkerRef = useRef(null);
  const radiusCircleRef = useRef(null);

  // Combine contractors and masters for backward compatibility
  const displayItems = contractors.length > 0 ? contractors : masters;

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const pos = { lat: position.coords.latitude, lng: position.coords.longitude };
          setUserLocation(pos);
          if (onLocationChange) onLocationChange(pos);
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
          { elementType: "geometry", stylers: [{ color: "#242f3e" }] },
          { elementType: "labels.text.stroke", stylers: [{ color: "#242f3e" }] },
          { elementType: "labels.text.fill", stylers: [{ color: "#746855" }] },
          { featureType: "water", elementType: "geometry", stylers: [{ color: "#17263c" }] }
        ]
      });
      setMapInstance(map);
      infoWindowRef.current = new window.google.maps.InfoWindow();
    }
  }, [isLoaded, initMap, mapInstance, userLocation]);

  useEffect(() => {
    if (!mapInstance || !window.google) return;

    // Clear existing markers and clusters
    markersRef.current.forEach(m => m.setMap(null));
    markersRef.current = [];
    if (clustererRef.current) {
      clustererRef.current.clearMarkers();
    }

    const newMarkers = [];

    // Add Contractor/Master Markers
    displayItems.forEach(item => {
      if (!item.latitude || !item.longitude) return;
      
      const marker = new window.google.maps.Marker({
        position: { lat: item.latitude, lng: item.longitude },
        map: mapInstance,
        title: item.name,
        icon: {
          path: window.google.maps.SymbolPath.BACKWARD_CLOSED_ARROW,
          scale: 6,
          fillColor: item.isPromoted ? "#fbc706" : "#10b981",
          fillOpacity: 1,
          strokeColor: "#ffffff",
          strokeWeight: 2,
        }
      });

      marker.addListener('click', () => {
        const content = `
          <div style="padding: 8px; max-width: 200px; color: #000;">
            <h3 style="font-weight: bold; font-size: 16px; margin-bottom: 4px;">${item.name}</h3>
            ${item.isPromoted ? `<span style="display: inline-block; background: #fef08a; color: #b45309; font-size: 12px; padding: 2px 8px; border-radius: 12px; margin-bottom: 8px; font-weight: 600;">${t('map.promoted')}</span>` : ''}
            <div style="display: flex; align-items: center; gap: 4px; margin-bottom: 8px;">
              <span style="color: #eab308;">★</span>
              <span style="font-weight: 500;">${item.rating?.toFixed(1) || '0.0'}</span>
              <span style="color: #6b7280; font-size: 12px;">(${item.reviewCount || 0})</span>
            </div>
            ${item.hourlyRate ? `<p style="font-weight: 600; color: #2563eb; margin-bottom: 12px;">€${item.hourlyRate}/h</p>` : ''}
            <button onclick="window.location.href='/contractor/${item.id}'" style="width: 100%; background: #2563eb; color: white; border: none; padding: 6px 12px; border-radius: 6px; cursor: pointer; font-weight: 500;">
              ${t('map.view_profile')}
            </button>
          </div>
        `;
        infoWindowRef.current.setContent(content);
        infoWindowRef.current.open(mapInstance, marker);
      });

      newMarkers.push(marker);
    });

    // Add Ticket Markers
    tickets.forEach(ticket => {
      if (!ticket.latitude || !ticket.longitude) return;
      
      const marker = new window.google.maps.Marker({
        position: { lat: ticket.latitude, lng: ticket.longitude },
        map: mapInstance,
        title: ticket.expand?.categoryId?.name || 'Request',
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          scale: 7,
          fillColor: "#3b82f6",
          fillOpacity: 1,
          strokeColor: "#ffffff",
          strokeWeight: 2,
        }
      });

      marker.addListener('click', () => {
        const content = `
          <div style="padding: 8px; max-width: 200px; color: #000;">
            <h3 style="font-weight: bold; font-size: 16px; margin-bottom: 4px;">${ticket.expand?.categoryId?.name || 'Service Request'}</h3>
            <p style="font-size: 14px; color: #4b5563; margin-bottom: 8px; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">${ticket.description}</p>
            ${ticket.budget ? `<p style="font-weight: 600; color: #2563eb; margin-bottom: 12px;">Budget: €${ticket.budget}</p>` : ''}
            <button onclick="window.location.href='/auction-ticket/${ticket.id}'" style="width: 100%; background: #2563eb; color: white; border: none; padding: 6px 12px; border-radius: 6px; cursor: pointer; font-weight: 500;">
              ${t('auction.view_details')}
            </button>
          </div>
        `;
        infoWindowRef.current.setContent(content);
        infoWindowRef.current.open(mapInstance, marker);
      });

      newMarkers.push(marker);
    });

    markersRef.current = newMarkers;

    // Initialize MarkerClusterer
    clustererRef.current = new MarkerClusterer({
      map: mapInstance,
      markers: newMarkers,
    });

  }, [mapInstance, displayItems, tickets, t]);

  // Handle User Location Marker & Radius
  useEffect(() => {
    if (!mapInstance || !window.google || !userLocation) return;

    if (!userMarkerRef.current) {
      userMarkerRef.current = new window.google.maps.Marker({
        position: userLocation,
        map: mapInstance,
        title: t('map.my_location'),
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          scale: 8,
          fillColor: "#3b82f6",
          fillOpacity: 1,
          strokeColor: "#ffffff",
          strokeWeight: 2,
        }
      });
    } else {
      userMarkerRef.current.setPosition(userLocation);
    }

    if (radiusCircleRef.current) {
      radiusCircleRef.current.setMap(null);
    }

    if (radius && radius !== 'any') {
      radiusCircleRef.current = new window.google.maps.Circle({
        strokeColor: "#3b82f6",
        strokeOpacity: 0.3,
        strokeWeight: 1,
        fillColor: "#3b82f6",
        fillOpacity: 0.1,
        map: mapInstance,
        center: userLocation,
        radius: parseInt(radius) * 1000
      });
    }
  }, [mapInstance, userLocation, radius, t]);

  const centerOnUser = () => {
    if (mapInstance && userLocation) {
      mapInstance.panTo(userLocation);
      mapInstance.setZoom(12);
    }
  };

  if (!isLoaded) {
    return <div className="w-full h-[500px] bg-muted rounded-xl animate-pulse flex items-center justify-center">Loading Map...</div>;
  }

  return (
    <div className="relative w-full rounded-xl overflow-hidden border border-border shadow-sm">
      <div ref={mapRef} className="w-full h-[500px]" />
      <Button 
        variant="secondary" 
        size="icon" 
        className="absolute bottom-6 right-6 shadow-lg rounded-full bg-background hover:bg-muted z-10"
        onClick={centerOnUser}
        title={t('map.my_location')}
      >
        <Navigation className="h-5 w-5 text-primary" />
      </Button>
    </div>
  );
};

export default GoogleMapsIntegration;