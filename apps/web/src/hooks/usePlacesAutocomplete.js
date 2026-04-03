import { useState, useEffect, useCallback, useRef } from 'react';
import { useGoogleMaps } from './useGoogleMaps.js';

export const usePlacesAutocomplete = () => {
  const { isLoaded } = useGoogleMaps();
  const [autocompleteService, setAutocompleteService] = useState(null);
  const [placesService, setPlacesService] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const debounceTimeout = useRef(null);

  useEffect(() => {
    if (isLoaded && window.google && window.google.maps && window.google.maps.places) {
      setAutocompleteService(new window.google.maps.places.AutocompleteService());
      // PlacesService requires a map or a dummy div element
      setPlacesService(new window.google.maps.places.PlacesService(document.createElement('div')));
    }
  }, [isLoaded]);

  const fetchSuggestions = useCallback((input) => {
    if (!autocompleteService || !input) {
      setSuggestions([]);
      return;
    }

    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current);
    }

    debounceTimeout.current = setTimeout(() => {
      autocompleteService.getPlacePredictions({ input }, (predictions, status) => {
        if (status === window.google.maps.places.PlacesServiceStatus.OK && predictions) {
          setSuggestions(predictions);
        } else {
          setSuggestions([]);
        }
      });
    }, 300); // 300ms debounce
  }, [autocompleteService]);

  const getPlaceDetails = useCallback((placeId) => {
    return new Promise((resolve, reject) => {
      if (!placesService) {
        reject(new Error('Places service not initialized'));
        return;
      }
      placesService.getDetails({ placeId, fields: ['formatted_address', 'geometry'] }, (place, status) => {
        if (status === window.google.maps.places.PlacesServiceStatus.OK && place) {
          resolve({
            address: place.formatted_address,
            lat: place.geometry.location.lat(),
            lng: place.geometry.location.lng()
          });
        } else {
          reject(new Error('Failed to fetch place details'));
        }
      });
    });
  }, [placesService]);

  const clearSuggestions = useCallback(() => {
    setSuggestions([]);
  }, []);

  return { 
    isReady: isLoaded && !!autocompleteService,
    suggestions, 
    fetchSuggestions, 
    getPlaceDetails, 
    clearSuggestions 
  };
};