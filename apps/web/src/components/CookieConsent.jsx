import React, { useState, useEffect } from 'react';
import { initMixpanel } from '@/lib/mixpanel';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Cookie } from 'lucide-react';

const CookieConsent = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem('cookieConsent');
    if (!consent) {
      setIsVisible(true);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('cookieConsent', 'accepted');
    initMixpanel();
    setIsVisible(false);
  };

  const handleReject = () => {
    localStorage.setItem('cookieConsent', 'rejected');
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-4 right-4 z-[100] w-[calc(100%-2rem)] sm:w-full max-w-sm">
      <Card className="bg-card border-border shadow-2xl shadow-black/50">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Cookie className="h-5 w-5 text-primary" />
            Slapukų naudojimas
          </CardTitle>
        </CardHeader>
        <CardContent className="pb-4">
          <p className="text-sm text-muted-foreground leading-relaxed">
            Mes naudojame slapukus siekdami užtikrinti geriausią patirtį mūsų svetainėje, 
            analizuoti srautą ir personalizuoti turinį. Daugiau informacijos rasite mūsų{' '}
            <Link to="/cookie-policy" className="text-primary hover:underline font-medium">
              Slapukų politikoje
            </Link>.
          </p>
        </CardContent>
        <CardFooter className="flex gap-2 pt-0">
          <Button 
            variant="outline" 
            className="flex-1 border-border hover:bg-muted"
            onClick={handleReject}
          >
            Atmesti
          </Button>
          <Button 
            className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
            onClick={handleAccept}
          >
            Sutikti visus
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default CookieConsent;