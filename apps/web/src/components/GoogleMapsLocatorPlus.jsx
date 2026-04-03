import React, { useState } from 'react';
import { Loader2 } from 'lucide-react';

const GoogleMapsLocatorPlus = () => {
  const [loading, setLoading] = useState(true);

  return (
    <div className="relative w-full h-[700px] rounded-2xl overflow-hidden border border-border shadow-lg bg-card">
      {loading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-muted/50 z-10">
          <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
          <p className="text-muted-foreground font-medium">Loading Store Locator...</p>
        </div>
      )}
      <iframe
        src="https://storage.googleapis.com/maps-solutions-1dfa2rzx5k/locator-plus/23dz/locator-plus.html"
        width="100%"
        height="100%"
        style={{ border: 0 }}
        loading="lazy"
        onLoad={() => setLoading(false)}
        title="Google Maps Locator Plus"
        className="w-full h-full"
      />
    </div>
  );
};

export default GoogleMapsLocatorPlus;