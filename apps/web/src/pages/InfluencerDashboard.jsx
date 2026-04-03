import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts/AuthContext.jsx';
import pb from '@/lib/pocketbaseClient.js';
import { Users, Megaphone, HeartHandshake as Handshake, Settings, Instagram, Youtube, Music } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Header from '@/components/Header.jsx';
import Footer from '@/components/Footer.jsx';

const InfluencerDashboard = () => {
  const { t } = useTranslation();
  const { currentUser } = useAuth();
  
  const totalFollowers = (currentUser?.instagramFollowers || 0) + 
                         (currentUser?.youtubeFollowers || 0) + 
                         (currentUser?.tiktokFollowers || 0);

  return (
    <>
      <Helmet>
        <title>{t('dashboard.influencer_title')} - Bee Marketplace</title>
      </Helmet>

      <div className="min-h-screen flex flex-col bg-background">
        <Header />

        <div className="flex-1 py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
              <div>
                <h1 className="text-4xl font-bold mb-2 text-foreground">{t('dashboard.influencer_title')}</h1>
                <p className="text-muted-foreground">{t('dashboard.welcome', { name: currentUser?.name || currentUser?.email })}</p>
              </div>
              <div className="flex gap-3">
                <Button variant="outline" asChild className="border-border hover:bg-muted rounded-xl">
                  <Link to={`/influencer/${currentUser?.id}`}>
                    <User className="h-4 w-4 mr-2" />
                    View Profile
                  </Link>
                </Button>
                <Button variant="outline" asChild className="border-border hover:bg-muted rounded-xl">
                  <Link to="/settings">
                    <Settings className="h-4 w-4 mr-2" />
                    {t('header.settings')}
                  </Link>
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <Card className="bg-card border-border rounded-2xl">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">{t('dashboard.total_followers')}</p>
                      <p className="text-3xl font-bold text-foreground">
                        {totalFollowers >= 1000 ? `${(totalFollowers / 1000).toFixed(1)}k` : totalFollowers}
                      </p>
                    </div>
                    <div className="p-3 bg-primary/10 rounded-xl">
                      <Users className="h-6 w-6 text-primary" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-card border-border rounded-2xl">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">{t('dashboard.active_collabs')}</p>
                      <p className="text-3xl font-bold text-foreground">0</p>
                    </div>
                    <div className="p-3 bg-blue-500/10 rounded-xl">
                      <Handshake className="h-6 w-6 text-blue-500" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-card border-border rounded-2xl">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">{t('dashboard.total_earnings')}</p>
                      <p className="text-3xl font-bold text-foreground">€0</p>
                    </div>
                    <div className="p-3 bg-green-500/10 rounded-xl">
                      <Megaphone className="h-6 w-6 text-green-500" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2">
                <Card className="bg-card border-border rounded-2xl h-full">
                  <CardHeader>
                    <CardTitle>{t('dashboard.partnerships')}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-16">
                      <Handshake className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-semibold mb-2 text-foreground">No active partnerships</h3>
                      <p className="text-muted-foreground mb-6">Brands will contact you here for collaboration opportunities.</p>
                      <Button asChild className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl">
                        <Link to="/settings">Update Profile to Attract Brands</Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="lg:col-span-1 space-y-6">
                <Card className="bg-card border-border rounded-2xl">
                  <CardHeader>
                    <CardTitle>Social Media Stats</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {currentUser?.instagramHandle && (
                      <div className="flex items-center justify-between p-3 bg-muted/30 rounded-xl border border-border">
                        <div className="flex items-center gap-3">
                          <Instagram className="h-5 w-5 text-pink-500" />
                          <span className="font-medium">{currentUser.instagramHandle}</span>
                        </div>
                        <span className="text-sm font-semibold">
                          {currentUser.instagramFollowers >= 1000 ? `${(currentUser.instagramFollowers / 1000).toFixed(1)}k` : currentUser.instagramFollowers}
                        </span>
                      </div>
                    )}
                    
                    {currentUser?.youtubeChannel && (
                      <div className="flex items-center justify-between p-3 bg-muted/30 rounded-xl border border-border">
                        <div className="flex items-center gap-3">
                          <Youtube className="h-5 w-5 text-red-500" />
                          <span className="font-medium truncate max-w-[120px]">{currentUser.youtubeChannel}</span>
                        </div>
                        <span className="text-sm font-semibold">
                          {currentUser.youtubeFollowers >= 1000 ? `${(currentUser.youtubeFollowers / 1000).toFixed(1)}k` : currentUser.youtubeFollowers}
                        </span>
                      </div>
                    )}

                    {currentUser?.tiktokHandle && (
                      <div className="flex items-center justify-between p-3 bg-muted/30 rounded-xl border border-border">
                        <div className="flex items-center gap-3">
                          <Music className="h-5 w-5 text-foreground" />
                          <span className="font-medium">{currentUser.tiktokHandle}</span>
                        </div>
                        <span className="text-sm font-semibold">
                          {currentUser.tiktokFollowers >= 1000 ? `${(currentUser.tiktokFollowers / 1000).toFixed(1)}k` : currentUser.tiktokFollowers}
                        </span>
                      </div>
                    )}

                    {!currentUser?.instagramHandle && !currentUser?.youtubeChannel && !currentUser?.tiktokHandle && (
                      <p className="text-sm text-muted-foreground text-center py-4">No social media accounts linked.</p>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>

        <Footer />
      </div>
    </>
  );
};

// Need to import User icon for the button
import { User } from 'lucide-react';

export default InfluencerDashboard;