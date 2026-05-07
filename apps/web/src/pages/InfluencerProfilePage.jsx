import React, { useState, useEffect } from 'react';
import { PageMeta } from '@/components/PageMeta.jsx';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import pb from '@/lib/pocketbaseClient';
import { getUserImageUrl } from '@/lib/userImage';
import { Mail, Instagram, Youtube, Music, Users, Megaphone, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import Header from '@/components/Header.jsx';
import Footer from '@/components/Footer.jsx';
import PlanBadge from '@/components/PlanBadge.jsx';

const InfluencerProfilePage = () => {
  const { t } = useTranslation();
  const { id } = useParams();
  const [influencer, setInfluencer] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchInfluencer = async () => {
      try {
        const data = await pb.collection('users').getOne(id, { $autoCancel: false });
        if (data.userType === 'influencer') {
          setInfluencer(data);
        }
      } catch (error) {
        console.error('Error fetching influencer profile:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchInfluencer();
  }, [id]);

  if (loading) {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-background py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-1">
                <Skeleton className="h-96 rounded-2xl" />
              </div>
              <div className="lg:col-span-2 space-y-4">
                <Skeleton className="h-12 w-3/4" />
                <Skeleton className="h-24" />
                <Skeleton className="h-64" />
              </div>
            </div>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  if (!influencer) {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-4">{t('profile.not_found')}</h2>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  const totalFollowers = (influencer.instagramFollowers || 0) + 
                         (influencer.youtubeFollowers || 0) + 
                         (influencer.tiktokFollowers || 0);

  const avatarUrl = getUserImageUrl(influencer, { thumb: '400x400' });

  return (
    <>
      <PageMeta
        title={`${influencer.name} - WorkBee`}
        description={influencer.influencerBio || `View ${influencer.name}'s influencer profile on WorkBee.`}
        image={avatarUrl || undefined}
      />

      <div className="min-h-screen flex flex-col bg-background">
        <Header />

        <div className="flex-1 py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-1">
                <Card className="bg-card border-border sticky top-24 rounded-2xl overflow-hidden">
                  <CardContent className="p-6">
                    <div className="aspect-square bg-muted rounded-xl overflow-hidden mb-6 border border-border">
                      {avatarUrl ? (
                        <img 
                          src={avatarUrl} 
                          alt={influencer.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-primary/10">
                          <User className="w-24 h-24 text-primary/50" />
                        </div>
                      )}
                    </div>

                    <h1 className="text-2xl font-bold mb-2">{influencer.name}</h1>

                    {(influencer.title || influencer.plan) && (
                      <div className="flex items-center gap-2 mb-2">
                        {influencer.title && <Badge variant="secondary">{influencer.title}</Badge>}
                        <PlanBadge plan={influencer.plan} />
                      </div>
                    )}

                    {influencer.contentNiche && (
                      <Badge className="mb-4 bg-primary/20 text-primary hover:bg-primary/30 border-none px-3 py-1">
                        <Megaphone className="w-3 h-3 mr-1" />
                        {influencer.contentNiche}
                      </Badge>
                    )}

                    <div className="flex items-center gap-2 mb-6">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Users className="h-5 w-5" />
                        <span className="font-semibold text-foreground">
                          {totalFollowers >= 1000 ? `${(totalFollowers / 1000).toFixed(1)}k` : totalFollowers}
                        </span>
                        <span>Total Audience</span>
                      </div>
                    </div>

                    <Separator className="my-6" />

                    <Button className="w-full bg-primary text-primary-foreground hover:bg-primary/90 transition-all duration-200 active:scale-[0.98] rounded-xl">
                      <Mail className="h-4 w-4 mr-2" />
                      {t('profile.contact_collab')}
                    </Button>
                  </CardContent>
                </Card>
              </div>

              <div className="lg:col-span-2 space-y-8">
                <Card className="bg-card border-border rounded-2xl">
                  <CardHeader>
                    <CardTitle>{t('profile.about')}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
                      {influencer.influencerBio || 'No bio available.'}
                    </p>
                  </CardContent>
                </Card>

                <Card className="bg-card border-border rounded-2xl">
                  <CardHeader>
                    <CardTitle>{t('profile.social_links')}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {influencer.instagramHandle && (
                        <div className="flex items-center justify-between p-4 bg-muted/30 rounded-xl border border-border">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-pink-500/10 rounded-lg">
                              <Instagram className="h-6 w-6 text-pink-500" />
                            </div>
                            <div>
                              <p className="font-medium text-foreground">{influencer.instagramHandle}</p>
                              <p className="text-sm text-muted-foreground">Instagram</p>
                            </div>
                          </div>
                          <span className="font-bold text-lg">
                            {influencer.instagramFollowers >= 1000 ? `${(influencer.instagramFollowers / 1000).toFixed(1)}k` : influencer.instagramFollowers}
                          </span>
                        </div>
                      )}

                      {influencer.youtubeChannel && (
                        <div className="flex items-center justify-between p-4 bg-muted/30 rounded-xl border border-border">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-red-500/10 rounded-lg">
                              <Youtube className="h-6 w-6 text-red-500" />
                            </div>
                            <div>
                              <p className="font-medium text-foreground truncate max-w-[100px]">{influencer.youtubeChannel}</p>
                              <p className="text-sm text-muted-foreground">YouTube</p>
                            </div>
                          </div>
                          <span className="font-bold text-lg">
                            {influencer.youtubeFollowers >= 1000 ? `${(influencer.youtubeFollowers / 1000).toFixed(1)}k` : influencer.youtubeFollowers}
                          </span>
                        </div>
                      )}

                      {influencer.tiktokHandle && (
                        <div className="flex items-center justify-between p-4 bg-muted/30 rounded-xl border border-border">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-foreground/10 rounded-lg">
                              <Music className="h-6 w-6 text-foreground" />
                            </div>
                            <div>
                              <p className="font-medium text-foreground">{influencer.tiktokHandle}</p>
                              <p className="text-sm text-muted-foreground">TikTok</p>
                            </div>
                          </div>
                          <span className="font-bold text-lg">
                            {influencer.tiktokFollowers >= 1000 ? `${(influencer.tiktokFollowers / 1000).toFixed(1)}k` : influencer.tiktokFollowers}
                          </span>
                        </div>
                      )}
                    </div>
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

export default InfluencerProfilePage;