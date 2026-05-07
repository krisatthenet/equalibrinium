import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import pb from '@/lib/pocketbaseClient';
import { Star, MapPin, Mail, Phone, Heart, Briefcase } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import Header from '@/components/Header.jsx';
import Footer from '@/components/Footer.jsx';
import PlanBadge from '@/components/PlanBadge.jsx';

const MasterProfilePage = () => {
  const { t } = useTranslation();
  const { id } = useParams();
  const [master, setMaster] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [masterData, reviewsData] = await Promise.all([
          pb.collection('masters').getOne(id, { 
            expand: 'categories',
            $autoCancel: false 
          }),
          pb.collection('reviews').getList(1, 50, {
            filter: `masterId = "${id}"`,
            sort: '-createdAt',
            $autoCancel: false
          })
        ]);

        setMaster(masterData);
        setReviews(reviewsData.items);
      } catch (error) {
        console.error('Error fetching master profile:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  if (loading) {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-black py-12">
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

  if (!master) {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-black flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-4">{t('profile.not_found')}</h2>
            <Button asChild>
              <a href="/masters">{t('profile.back_search')}</a>
            </Button>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Helmet>
        <title>{`${master.name} - Bee Marketplace`}</title>
        <meta name="description" content={master.bio || `View ${master.name}'s profile and reviews on Bee marketplace.`} />
      </Helmet>

      <div className="min-h-screen flex flex-col bg-black">
        <Header />

        <div className="flex-1 py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-1">
                <Card className="bg-card border-border sticky top-24">
                  <CardContent className="p-6">
                    <div className="aspect-square bg-muted rounded-xl overflow-hidden mb-6">
                      {master.profilePicture ? (
                        <img 
                          src={pb.files.getUrl(master, master.profilePicture)} 
                          alt={master.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-primary/10">
                          <span className="text-6xl font-bold text-primary">
                            {master.name.charAt(0)}
                          </span>
                        </div>
                      )}
                    </div>

                    <h1 className="text-2xl font-bold mb-2">{master.name}</h1>

                    {(master.title || master.plan) && (
                      <div className="flex items-center gap-2 mb-2">
                        {master.title && <Badge variant="secondary">{master.title}</Badge>}
                        <PlanBadge plan={master.plan} />
                      </div>
                    )}

                    {master.profession && (
                      <Badge className="mb-4 bg-primary/20 text-primary hover:bg-primary/30 border-none">
                        <Briefcase className="w-3 h-3 mr-1" />
                        {t(`professions.${master.profession}`, { defaultValue: master.profession })}
                      </Badge>
                    )}

                    <div className="flex items-center gap-2 mb-4">
                      <div className="flex items-center gap-1">
                        <Star className="h-5 w-5 fill-primary text-primary" />
                        <span className="font-semibold text-lg">{master.rating?.toFixed(1) || '0.0'}</span>
                      </div>
                      <span className="text-muted-foreground">
                        ({master.reviewCount || 0} reviews)
                      </span>
                    </div>

                    {master.location && (
                      <div className="flex items-center gap-2 text-muted-foreground mb-4">
                        <MapPin className="h-4 w-4" />
                        <span>{master.location}</span>
                      </div>
                    )}


                    <Separator className="my-6" />

                    <div className="space-y-3">
                      <Button className="w-full bg-primary text-primary-foreground hover:bg-primary/90 transition-all duration-200 active:scale-[0.98]">
                        <Mail className="h-4 w-4 mr-2" />
                        {t('profile.request_service')}
                      </Button>
                      <Button variant="outline" className="w-full border-border hover:bg-muted transition-all duration-200">
                        <Heart className="h-4 w-4 mr-2" />
                        {t('profile.save_favorite')}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="lg:col-span-2 space-y-8">
                <Card className="bg-card border-border">
                  <CardHeader>
                    <CardTitle>{t('profile.about')}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground leading-relaxed">
                      {master.bio || 'No bio available.'}
                    </p>
                  </CardContent>
                </Card>

                {master.expand?.categories && master.expand.categories.length > 0 && (
                  <Card className="bg-card border-border">
                    <CardHeader>
                      <CardTitle>{t('profile.services')}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-2">
                        {master.expand.categories.map(category => (
                          <Badge key={category.id} variant="secondary" className="bg-primary/10 text-primary border-primary/20">
                            {category.name}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {master.latitude && master.longitude && (
                  <Card className="bg-card border-border">
                    <CardHeader>
                      <CardTitle>{t('profile.location')}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="aspect-video bg-muted rounded-lg overflow-hidden">
                        <iframe
                          width="100%"
                          height="100%"
                          frameBorder="0"
                          style={{ border: 0 }}
                          src={`https://www.google.com/maps/embed/v1/place?key=YOUR_API_KEY&q=${master.latitude},${master.longitude}`}
                          allowFullScreen
                          title="Master Location"
                        ></iframe>
                      </div>
                    </CardContent>
                  </Card>
                )}

                <Card className="bg-card border-border">
                  <CardHeader>
                    <CardTitle>{t('profile.reviews_title', { count: reviews.length })}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {reviews.length > 0 ? (
                      <div className="space-y-6">
                        {reviews.map(review => (
                          <div key={review.id} className="border-b border-border last:border-0 pb-6 last:pb-0">
                            <div className="flex items-center gap-2 mb-2">
                              <div className="flex">
                                {[...Array(5)].map((_, i) => (
                                  <Star
                                    key={i}
                                    className={`h-4 w-4 ${
                                      i < review.rating
                                        ? 'fill-primary text-primary'
                                        : 'text-muted-foreground'
                                    }`}
                                  />
                                ))}
                              </div>
                              <span className="text-sm text-muted-foreground">
                                {new Date(review.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                            {review.comment && (
                              <p className="text-muted-foreground">{review.comment}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-muted-foreground text-center py-8">{t('profile.no_reviews')}</p>
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

export default MasterProfilePage;