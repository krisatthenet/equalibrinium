import React, { useState, useEffect, useCallback } from 'react';
import { GoogleMap, useJsApiLoader, Marker, InfoWindow, Circle } from '@react-google-maps/api';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { MapPin, Star, Navigation } from 'lucide-react';
import { Button } from '@/components/ui/button';
import pb from '@/lib/pocketbaseClient.js';

const containerStyle = {
  width: '100%',
  height: '500px',
  borderRadius: '0.75rem'
};

const defaultCenter = {
  lat: 54.6872, // Vilnius default
  lng: 25.2797
};

const MapsIntegration = ({ contractors = [], tickets = [], radius, onLocationChange }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [map, setMap] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [selectedContractor, setSelectedContractor] = useState(null);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [locationError, setLocationError] = useState(false);

  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: 'AIzaSyAz3m8MF5oif2DmLltfypmhqKX4ey39spo'
  });

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const pos = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          setUserLocation(pos);
          if (onLocationChange) onLocationChange(pos);
        },
        () => {
          setLocationError(true);
        }
      );
    }
  }, []);

  const onLoad = useCallback(function callback(map) {
    setMap(map);
    if (userLocation) {
      map.panTo(userLocation);
    }
  }, [userLocation]);

  const onUnmount = useCallback(function callback(map) {
    setMap(null);
  }, []);

  const centerOnUser = () => {
    if (map && userLocation) {
      map.panTo(userLocation);
      map.setZoom(12);
    }
  };

  if (!isLoaded) return <div className="w-full h-[500px] bg-muted rounded-xl animate-pulse flex items-center justify-center">Loading Map...</div>;

  return (
    <div className="relative w-full rounded-xl overflow-hidden border border-border shadow-sm">
      <GoogleMap
        mapContainerStyle={containerStyle}
        center={userLocation || defaultCenter}
        zoom={11}
        onLoad={onLoad}
        onUnmount={onUnmount}
        options={{
          styles: [
            { elementType: "geometry", stylers: [{ color: "#242f3e" }] },
            { elementType: "labels.text.stroke", stylers: [{ color: "#242f3e" }] },
            { elementType: "labels.text.fill", stylers: [{ color: "#746855" }] },
            {
              featureType: "administrative.locality",
              elementType: "labels.text.fill",
              stylers: [{ color: "#d59563" }],
            },
            {
              featureType: "poi",
              elementType: "labels.text.fill",
              stylers: [{ color: "#d59563" }],
            },
            {
              featureType: "poi.park",
              elementType: "geometry",
              stylers: [{ color: "#263c3f" }],
            },
            {
              featureType: "poi.park",
              elementType: "labels.text.fill",
              stylers: [{ color: "#6b9a76" }],
            },
            {
              featureType: "road",
              elementType: "geometry",
              stylers: [{ color: "#38414e" }],
            },
            {
              featureType: "road",
              elementType: "geometry.stroke",
              stylers: [{ color: "#212a37" }],
            },
            {
              featureType: "road",
              elementType: "labels.text.fill",
              stylers: [{ color: "#9ca5b3" }],
            },
            {
              featureType: "road.highway",
              elementType: "geometry",
              stylers: [{ color: "#746855" }],
            },
            {
              featureType: "road.highway",
              elementType: "geometry.stroke",
              stylers: [{ color: "#1f2835" }],
            },
            {
              featureType: "road.highway",
              elementType: "labels.text.fill",
              stylers: [{ color: "#f3d19c" }],
            },
            {
              featureType: "water",
              elementType: "geometry",
              stylers: [{ color: "#17263c" }],
            },
            {
              featureType: "water",
              elementType: "labels.text.fill",
              stylers: [{ color: "#515c6d" }],
            },
            {
              featureType: "water",
              elementType: "labels.text.stroke",
              stylers: [{ color: "#17263c" }],
            },
          ],
          disableDefaultUI: false,
          zoomControl: true,
        }}
      >
        {userLocation && (
          <>
            <Marker
              position={userLocation}
              icon={{
                path: window.google.maps.SymbolPath.CIRCLE,
                scale: 8,
                fillColor: "#3b82f6",
                fillOpacity: 1,
                strokeColor: "#ffffff",
                strokeWeight: 2,
              }}
              title={t('map.my_location')}
            />
            {radius && radius !== 'any' && (
              <Circle
                center={userLocation}
                radius={parseInt(radius) * 1000}
                options={{
                  fillColor: "#3b82f6",
                  fillOpacity: 0.1,
                  strokeColor: "#3b82f6",
                  strokeOpacity: 0.3,
                  strokeWeight: 1,
                }}
              />
            )}
          </>
        )}

        {/* Contractor Markers */}
        {contractors.map((contractor) => {
          if (!contractor.latitude || !contractor.longitude) return null;
          
          const position = { lat: contractor.latitude, lng: contractor.longitude };
          const isPromoted = contractor.isPromoted;
          
          return (
            <Marker
              key={`contractor-${contractor.id}`}
              position={position}
              onClick={() => {
                setSelectedContractor(contractor);
                setSelectedTicket(null);
              }}
              icon={{
                path: window.google.maps.SymbolPath.BACKWARD_CLOSED_ARROW,
                scale: 6,
                fillColor: isPromoted ? "#fbc706" : "#10b981", // Green for regular contractors
                fillOpacity: 1,
                strokeColor: "#ffffff",
                strokeWeight: 2,
              }}
            />
          );
        })}

        {/* Ticket Markers */}
        {tickets.map((ticket) => {
          if (!ticket.latitude || !ticket.longitude) return null;
          
          const position = { lat: ticket.latitude, lng: ticket.longitude };
          
          return (
            <Marker
              key={`ticket-${ticket.id}`}
              position={position}
              onClick={() => {
                setSelectedTicket(ticket);
                setSelectedContractor(null);
              }}
              icon={{
                path: window.google.maps.SymbolPath.CIRCLE,
                scale: 7,
                fillColor: "#3b82f6", // Blue for tickets
                fillOpacity: 1,
                strokeColor: "#ffffff",
                strokeWeight: 2,
              }}
            />
          );
        })}

        {/* Contractor InfoWindow */}
        {selectedContractor && (
          <InfoWindow
            position={{ lat: selectedContractor.latitude, lng: selectedContractor.longitude }}
            onCloseClick={() => setSelectedContractor(null)}
          >
            <div className="p-2 max-w-[200px] text-black">
              <h3 className="font-bold text-lg mb-1">{selectedContractor.name}</h3>
              {selectedContractor.isPromoted && (
                <span className="inline-block bg-primary/20 text-primary text-xs px-2 py-1 rounded-full mb-2 font-semibold">
                  {t('map.promoted')}
                </span>
              )}
              <div className="flex items-center gap-1 mb-1">
                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                <span className="font-medium">{selectedContractor.rating?.toFixed(1) || '0.0'}</span>
                <span className="text-xs text-gray-500">({selectedContractor.reviewCount || 0})</span>
              </div>
              {selectedContractor.hourlyRate && (
                <p className="font-semibold text-primary mb-3">€{selectedContractor.hourlyRate}/h</p>
              )}
              <Button 
                size="sm" 
                className="w-full bg-primary text-black hover:bg-primary/90"
                onClick={() => navigate(`/contractor/${selectedContractor.id}`)}
              >
                {t('map.view_profile')}
              </Button>
            </div>
          </InfoWindow>
        )}

        {/* Ticket InfoWindow */}
        {selectedTicket && (
          <InfoWindow
            position={{ lat: selectedTicket.latitude, lng: selectedTicket.longitude }}
            onCloseClick={() => setSelectedTicket(null)}
          >
            <div className="p-2 max-w-[200px] text-black">
              <h3 className="font-bold text-lg mb-1">{selectedTicket.expand?.categoryId?.name || 'Service Request'}</h3>
              <p className="text-sm text-gray-600 mb-2 line-clamp-2">{selectedTicket.description}</p>
              {selectedTicket.budget && (
                <p className="font-semibold text-blue-600 mb-3">Budget: €{selectedTicket.budget}</p>
              )}
              <Button 
                size="sm" 
                className="w-full bg-blue-600 text-white hover:bg-blue-700"
                onClick={() => navigate(`/auction-ticket/${selectedTicket.id}`)}
              >
                {t('auction.view_details')}
              </Button>
            </div>
          </InfoWindow>
        )}
      </GoogleMap>

      <Button 
        variant="secondary" 
        size="icon" 
        className="absolute bottom-6 right-6 shadow-lg rounded-full bg-background hover:bg-muted"
        onClick={centerOnUser}
        title={t('map.my_location')}
      >
        <Navigation className="h-5 w-5 text-primary" />
      </Button>
    </div>
  );
};

export default MapsIntegration;