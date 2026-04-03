import React from 'react';
import { Helmet } from 'react-helmet';
import Header from '@/components/Header.jsx';
import Footer from '@/components/Footer.jsx';
import GoogleMapsLocatorPlus from '@/components/GoogleMapsLocatorPlus.jsx';

const LocatorPage = () => {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Helmet>
        <title>Store Locator - Equalibrinium Community</title>
        <meta name="description" content="Find our partner stores and locations near you." />
      </Helmet>
      
      <Header />
      
      <main className="flex-1 py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-foreground mb-4">Find Us</h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Locate our partner stores, offices, and service centers near you using our interactive map.
            </p>
          </div>
          
          <GoogleMapsLocatorPlus />
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default LocatorPage;