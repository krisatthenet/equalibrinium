import React, { useState, useEffect, useRef } from 'react';
import { usePlacesAutocomplete } from '@/hooks/usePlacesAutocomplete.js';
import { Input } from '@/components/ui/input';
import { MapPin, Loader2 } from 'lucide-react';

const PlacesAutocompleteInput = ({ value, onChange, onSelectPlace, placeholder, className, required }) => {
  const { isReady, suggestions, fetchSuggestions, getPlaceDetails, clearSuggestions } = usePlacesAutocomplete();
  const [inputValue, setInputValue] = useState(value || '');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const wrapperRef = useRef(null);

  useEffect(() => {
    setInputValue(value || '');
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = (e) => {
    const val = e.target.value;
    setInputValue(val);
    onChange?.(val);
    
    if (val.length > 2) {
      fetchSuggestions(val);
      setShowSuggestions(true);
    } else {
      clearSuggestions();
      setShowSuggestions(false);
    }
  };

  const handleSelect = async (placeId, description) => {
    setInputValue(description);
    onChange?.(description);
    setShowSuggestions(false);
    clearSuggestions();
    
    if (onSelectPlace) {
      setLoadingDetails(true);
      try {
        const details = await getPlaceDetails(placeId);
        onSelectPlace(details);
      } catch (err) {
        console.error('Error fetching place details:', err);
      } finally {
        setLoadingDetails(false);
      }
    }
  };

  return (
    <div className="relative w-full" ref={wrapperRef}>
      <div className="relative">
        <Input 
          value={inputValue} 
          onChange={handleInputChange} 
          placeholder={isReady ? placeholder : "Loading maps..."} 
          className={className}
          disabled={!isReady || loadingDetails}
          required={required}
        />
        {loadingDetails && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
        )}
      </div>
      
      {showSuggestions && suggestions.length > 0 && (
        <ul className="absolute z-50 w-full bg-card border border-border rounded-lg shadow-lg mt-1 max-h-60 overflow-auto py-1">
          {suggestions.map((s) => (
            <li 
              key={s.place_id} 
              className="px-4 py-2.5 hover:bg-muted cursor-pointer flex items-start gap-3 text-sm transition-colors" 
              onClick={() => handleSelect(s.place_id, s.description)}
            >
              <MapPin className="h-4 w-4 text-primary mt-0.5 shrink-0" />
              <span className="text-foreground">{s.description}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default PlacesAutocompleteInput;