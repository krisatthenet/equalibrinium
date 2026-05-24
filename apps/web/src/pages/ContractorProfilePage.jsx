import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { PageMeta } from '@/components/PageMeta.jsx';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts/AuthContext.jsx';
import pb from '@/lib/pocketbaseClient';
import { getUserImageUrl } from '@/lib/userImage';
import { Star, Heart, Briefcase, User, Send, FileText, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import Header from '@/components/Header.jsx';
import Footer from '@/components/Footer.jsx';
import AuctionTicketForm from '@/components/AuctionTicketForm.jsx';
import PlanBadge from '@/components/PlanBadge.jsx';
import { getEffectivePlan, isInTrial } from '@/lib/plans';

const ContractorProfilePage = () => {
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser, isAuthenticated } = useAuth();
  const { toast } = useToast();

  const [contractor, setContractor] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isFavourite, setIsFavourite] = useState(false);
  const [favouriteId, setFavouriteId] = useState(null);
  const [favLoading, setFavLoading] = useState(false);
  const [requestOpen, setRequestOpen] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [userData, reviewsData] = await Promise.all([
          pb.collection('users').getOne(id, {
            expand: 'categories',
            $autoCancel: false
          }),
          pb.collection('reviews').getList(1, 50, {
            filter: `contractorId = "${id}"`,
            sort: '-created',
            $autoCancel: false
          })
        ]);
        setContractor(userData);
        setReviews(reviewsData.items);

        // Track profile view — skip if the viewer is the profile owner
        if (!currentUser || currentUser.id !== id) {
          pb.collection('users').update(id, { 'profileViews+': 1 }, { $autoCancel: false }).catch(() => {});
        }
      } catch (error) {
        console.error('Error fetching contractor profile:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  useEffect(() => {
    if (!isAuthenticated || !currentUser) return;
    const checkFavourite = async () => {
      try {
        const result = await pb.collection('favourites').getList(1, 1, {
          filter: `userId = "${currentUser.id}" && contractorId = "${id}"`,
          $autoCancel: false
        });
        if (result.items.length > 0) {
          setIsFavourite(true);
          setFavouriteId(result.items[0].id);
        }
      } catch (_) {}
    };
    checkFavourite();
  }, [isAuthenticated, currentUser, id]);

  const handleToggleFavourite = async () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    setFavLoading(true);
    try {
      if (isFavourite && favouriteId) {
        await pb.collection('favourites').delete(favouriteId, { $autoCancel: false });
        setIsFavourite(false);
        setFavouriteId(null);
        toast({ title: 'Removed from favourites' });
      } else {
        const rec = await pb.collection('favourites').create({
          userId: currentUser.id,
          contractorId: id,
        }, { $autoCancel: false });
        setIsFavourite(true);
        setFavouriteId(rec.id);
        toast({ title: 'Saved to favourites' });
      }
    } catch (err) {
      toast({ title: 'Error', description: 'Could not update favourites.', variant: 'destructive' });
    } finally {
      setFavLoading(false);
    }
  };

  const handleRequestService = () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    setRequestOpen(true);
  };

  if (loading) {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-background py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-1"><Skeleton className="h-96 rounded-2xl" /></div>
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

  if (!contractor) {
    navigate('/register');
    return null;
  }

  return (
    <>
      <PageMeta
        title={`${contractor.name} - WorkBee`}
        description={contractor.bio || `View ${contractor.name}'s profile and reviews on WorkBee.`}
        image={getUserImageUrl(contractor) || undefined}
      />
      <Helmet>
        <script type="application/ld+json">{JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'Person',
          name: contractor.name,
          ...(contractor.bio && { description: contractor.bio }),
          url: `https://workbee.space/contractor/${contractor.id}`,
          ...(getUserImageUrl(contractor) && { image: getUserImageUrl(contractor) }),
          ...(reviews.length > 0 && {
            aggregateRating: {
              '@type': 'AggregateRating',
              ratingValue: (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1),
              reviewCount: reviews.length,
            },
          }),
          ...(contractor.expand?.categories?.length && {
            knowsAbout: contractor.expand.categories.map(c => c.name),
          }),
        })}</script>
      </Helmet>

      <div className="min-h-screen flex flex-col bg-background">
        <Header />

        <div className="flex-1 py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-1">
                <Card className="bg-card border-border sticky top-24 rounded-2xl overflow-hidden">
                  <CardContent className="p-6">
                    <div className="aspect-square bg-muted rounded-xl overflow-hidden mb-6 border border-border">
                      {(() => {
                        const src = getUserImageUrl(contractor, { thumb: '400x400' });
                        return src ? (
                          <img src={src} alt={contractor.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-primary/10">
                            <User className="w-24 h-24 text-primary/50" />
                          </div>
                        );
                      })()}
                    </div>

                    <h1 className="text-2xl font-bold mb-2">{contractor.name}</h1>

                    {(contractor.title || contractor.plan || isInTrial(contractor)) && (
                      <div className="flex items-center gap-2 mb-2">
                        {contractor.title && <Badge variant="secondary">{contractor.title}</Badge>}
                        <PlanBadge plan={getEffectivePlan(contractor)} isTrial={isInTrial(contractor)} />
                      </div>
                    )}

                    {contractor.profession && (
                      <Badge className="mb-4 bg-primary/20 text-primary hover:bg-primary/30 border-none">
                        <Briefcase className="w-3 h-3 mr-1" />
                        {t(`professions.${contractor.profession}`, { defaultValue: contractor.profession })}
                      </Badge>
                    )}

                    {reviews.length > 0 && (() => {
                      const avg = reviews.reduce((s, r) => s + r.rating, 0) / reviews.length;
                      return (
                        <div className="flex items-center gap-2 mb-6">
                          <div className="flex items-center gap-1">
                            <Star className="h-5 w-5 fill-primary text-primary" />
                            <span className="font-semibold text-lg">{avg.toFixed(1)}</span>
                          </div>
                          <span className="text-muted-foreground">({reviews.length} reviews)</span>
                        </div>
                      );
                    })()}


                    <Separator className="my-6" />

                    <div className="space-y-3">
                      <Button
                        className="w-full bg-primary text-primary-foreground hover:bg-primary/90 transition-all duration-200 active:scale-[0.98] rounded-xl"
                        onClick={handleRequestService}
                      >
                        <Send className="h-4 w-4 mr-2" />
                        {t('profile.request_service')}
                      </Button>
                      <Button
                        variant="outline"
                        className={`w-full transition-all duration-200 rounded-xl ${isFavourite ? 'border-rose-500 text-rose-500 hover:bg-rose-500/10' : 'border-border hover:bg-muted'}`}
                        onClick={handleToggleFavourite}
                        disabled={favLoading}
                      >
                        <Heart className={`h-4 w-4 mr-2 ${isFavourite ? 'fill-rose-500 text-rose-500' : ''}`} />
                        {isFavourite ? 'Saved to Favourites' : t('profile.save_favorite')}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="lg:col-span-2 space-y-8">
                <Card className="bg-card border-border rounded-2xl">
                  <CardHeader><CardTitle>{t('profile.about')}</CardTitle></CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground leading-relaxed">
                      {contractor.bio || 'No bio available.'}
                    </p>
                  </CardContent>
                </Card>

                {contractor.expand?.categories && contractor.expand.categories.length > 0 && (
                  <Card className="bg-card border-border rounded-2xl">
                    <CardHeader><CardTitle>{t('profile.services')}</CardTitle></CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-2">
                        {contractor.expand.categories.map(category => (
                          <Badge key={category.id} variant="secondary" className="bg-primary/10 text-primary border-primary/20 px-3 py-1">
                            {category.name}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {contractor.workExamples?.length > 0 && (
                  <Card className="bg-card border-border rounded-2xl">
                    <CardHeader><CardTitle>Work Examples</CardTitle></CardHeader>
                    <CardContent>
                      <WorkExamplesGallery contractor={contractor} />
                    </CardContent>
                  </Card>
                )}

                <Card className="bg-card border-border rounded-2xl">
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
                                    className={`h-4 w-4 ${i < review.rating ? 'fill-primary text-primary' : 'text-muted-foreground'}`}
                                  />
                                ))}
                              </div>
                              <span className="text-sm text-muted-foreground">
                                {new Date(review.created).toLocaleDateString()}
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

      {/* Request Service Dialog */}
      <Dialog open={requestOpen} onOpenChange={setRequestOpen}>
        <DialogContent className="bg-card border-border max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Request Service from {contractor.name}</DialogTitle>
          </DialogHeader>
          <AuctionTicketForm
            assignedContractorId={id}
            assignedContractorName={contractor.name}
            onSuccess={() => {
              setRequestOpen(false);
              toast({ title: 'Request sent!', description: `${contractor.name} will be notified of your request.` });
            }}
            onCancel={() => setRequestOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </>
  );
};

const WorkExamplesGallery = ({ contractor }) => {
  const [lightbox, setLightbox] = useState(null);

  const images = contractor.workExamples.filter(f => f.match(/\.(jpg|jpeg|png|gif|webp)$/i));
  const pdfs = contractor.workExamples.filter(f => f.match(/\.pdf$/i));

  return (
    <>
      {images.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
          {images.map(filename => {
            const url = pb.files.getURL(contractor, filename);
            return (
              <div
                key={filename}
                className="aspect-square rounded-xl overflow-hidden border border-border cursor-pointer hover:opacity-90 transition-opacity bg-muted"
                onClick={() => setLightbox(url)}
              >
                <img src={url} alt={filename} className="w-full h-full object-cover" />
              </div>
            );
          })}
        </div>
      )}

      {pdfs.length > 0 && (
        <div className="space-y-2">
          {pdfs.map(filename => (
            <a
              key={filename}
              href={pb.files.getURL(contractor, filename)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-3 rounded-xl border border-border hover:bg-muted/50 transition-colors"
            >
              <FileText className="h-5 w-5 text-primary shrink-0" />
              <span className="text-sm text-foreground truncate">{filename}</span>
            </a>
          ))}
        </div>
      )}

      {lightbox && (
        <div
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
          onClick={() => setLightbox(null)}
        >
          <div className="relative max-w-full max-h-full" onClick={e => e.stopPropagation()}>
            <button
              className="absolute -top-3 -right-3 text-white border-2 border-white rounded-full p-1 bg-black/60 hover:bg-black/90 transition-colors z-10"
              onClick={() => setLightbox(null)}
            >
              <X className="h-4 w-4" />
            </button>
            <img
              src={lightbox}
              alt="Work example"
              className="max-w-full max-h-[85vh] rounded-xl object-contain"
            />
          </div>
        </div>
      )}
    </>
  );
};

export default ContractorProfilePage;
