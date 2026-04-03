import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Home, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

const NotFoundPage = () => {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background text-foreground px-4">
      <div className="text-center max-w-md">
        <h1 className="text-9xl font-bold text-primary mb-4 leading-none">404</h1>
        <h2 className="text-2xl font-semibold mb-3">
          {t('not_found.title', 'Page Not Found')}
        </h2>
        <p className="text-muted-foreground mb-10">
          {t('not_found.description', "The page you're looking for doesn't exist or has been moved.")}
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button
            variant="outline"
            onClick={() => window.history.back()}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            {t('not_found.go_back', 'Go Back')}
          </Button>
          <Button asChild className="flex items-center gap-2 bg-primary text-primary-foreground hover:bg-primary/90">
            <Link to="/">
              <Home className="h-4 w-4" />
              {t('not_found.home', 'Return to Home')}
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default NotFoundPage;
