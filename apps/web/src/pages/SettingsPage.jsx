import React, { useState, useEffect, useRef } from 'react';
import { Helmet } from 'react-helmet';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts/AuthContext.jsx';
import pb from '@/lib/pocketbaseClient';
import apiServerClient from '@/lib/apiServerClient.js';
import { useToast } from '@/hooks/use-toast';
import {
  User, CreditCard, Shield, Camera, Loader2, CheckCircle2, ExternalLink
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import Header from '@/components/Header.jsx';
import Footer from '@/components/Footer.jsx';
import PasswordChangeModal from '@/components/PasswordChangeModal.jsx';
import ProfessionSelector from '@/components/ProfessionSelector.jsx';
import LocationPicker from '@/components/LocationPicker.jsx';
import PlacesAutocompleteInput from '@/components/PlacesAutocompleteInput.jsx';

const SettingsPage = () => {
  const { t } = useTranslation();
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const fileInputRef = useRef(null);

  // Profile State
  const [profileLoading, setProfileLoading] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [avatarFile, setAvatarFile] = useState(null);
  const [clientLocationId, setClientLocationId] = useState(null);
  const [clientLocation, setClientLocation] = useState(null);
  const [profileData, setProfileData] = useState({
    name: currentUser?.name || '',
    phone: currentUser?.phone || '',
    location: currentUser?.location || '',
    bio: currentUser?.bio || '',
    profession: currentUser?.profession || '',
    hourlyRate: currentUser?.hourlyRate || '',
    instagramHandle: currentUser?.instagramHandle || '',
    youtubeChannel: currentUser?.youtubeChannel || '',
    tiktokHandle: currentUser?.tiktokHandle || '',
    contentNiche: currentUser?.contentNiche || '',
    influencerBio: currentUser?.influencerBio || ''
  });

  // Payout State (contractors only)
  const [stripeConnectStatus, setStripeConnectStatus] = useState({
    accountId: currentUser?.stripeAccountId || null,
    onboarded: currentUser?.stripeOnboarded || false,
  });
  const [stripeConnectLoading, setStripeConnectLoading] = useState(false);
  const [contractorBalance, setContractorBalance] = useState(Number(currentUser?.balance) || 0);
  const [payoutLoading, setPayoutLoading] = useState(false);

  // Account State
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const loadAvatar = () => {
    if (currentUser?.avatar) {
      setAvatarPreview(pb.files.getUrl(currentUser, currentUser.avatar));
    }
  };

  useEffect(() => {
    loadAvatar();

    const fetchClientLocation = async () => {
      if (currentUser?.userType === 'client') {
        try {
          const records = await pb.collection('client_locations').getList(1, 1, {
            filter: `clientId = "${currentUser.id}"`,
            $autoCancel: false
          });
          if (records.items.length > 0) {
            const loc = records.items[0];
            setClientLocationId(loc.id);
            setClientLocation({ lat: loc.latitude, lng: loc.longitude, address: loc.address });
          }
        } catch (err) {
          console.error('Error fetching client location:', err);
        }
      }
    };

    fetchClientLocation();
  }, [currentUser]);

  // --- Profile Handlers ---
  const handleProfileChange = (e) => {
    setProfileData({ ...profileData, [e.target.name]: e.target.value });
  };

  const handleProfessionChange = (value) => {
    setProfileData({ ...profileData, profession: value });
  };

  const handleLocationSelect = (placeDetails) => {
    setProfileData({ ...profileData, location: placeDetails.address });
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setProfileLoading(true);
    try {
      const formData = new FormData();
      formData.append('name', profileData.name);
      formData.append('phone', profileData.phone);
      formData.append('location', profileData.location);
      
      if (currentUser.userType === 'influencer') {
        formData.append('instagramHandle', profileData.instagramHandle);
        formData.append('youtubeChannel', profileData.youtubeChannel);
        formData.append('tiktokHandle', profileData.tiktokHandle);
        formData.append('contentNiche', profileData.contentNiche);
        formData.append('influencerBio', profileData.influencerBio);
      }

      if (avatarFile) {
        formData.append('avatar', avatarFile);
      }

      if (currentUser.userType === 'contractor') {
        formData.append('bio', profileData.bio);
        formData.append('profession', profileData.profession);
        if (profileData.hourlyRate) formData.append('hourlyRate', profileData.hourlyRate);
        // Geocode location to coordinates
        if (profileData.location && window.google?.maps?.Geocoder) {
          try {
            const geocoder = new window.google.maps.Geocoder();
            await new Promise((resolve) => {
              geocoder.geocode({ address: profileData.location }, (results, status) => {
                if (status === 'OK' && results[0]) {
                  formData.append('latitude', results[0].geometry.location.lat());
                  formData.append('longitude', results[0].geometry.location.lng());
                }
                resolve();
              });
            });
          } catch (_) {}
        }
      }

      await pb.collection('users').update(currentUser.id, formData, { $autoCancel: false });

      toast({ title: "Profile Updated", description: "Your profile has been saved successfully." });
    } catch (error) {
      console.error('Profile update error:', error);
      toast({ title: "Update Failed", description: "Could not save profile changes.", variant: "destructive" });
    } finally {
      setProfileLoading(false);
    }
  };

  const handleSaveClientLocation = async (pos) => {
    try {
      if (clientLocationId) {
        await pb.collection('client_locations').update(clientLocationId, {
          latitude: pos.lat,
          longitude: pos.lng,
          address: pos.address || `${pos.lat}, ${pos.lng}`
        }, { $autoCancel: false });
      } else {
        const record = await pb.collection('client_locations').create({
          clientId: currentUser.id,
          latitude: pos.lat,
          longitude: pos.lng,
          address: pos.address || `${pos.lat}, ${pos.lng}`
        }, { $autoCancel: false });
        setClientLocationId(record.id);
      }
      setClientLocation({ lat: pos.lat, lng: pos.lng, address: pos.address });
      toast({ title: "Success", description: t('auction.default_location_saved') });
    } catch (error) {
      console.error('Error saving client location:', error);
      toast({ title: "Error", description: "Failed to save default location.", variant: "destructive" });
    }
  };

  // --- Payout Handler ---
  const handleRequestPayout = async () => {
    if (contractorBalance <= 0) return;
    setPayoutLoading(true);
    try {
      const res = await apiServerClient.fetch('/stripe/request-payout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser.id, amount: contractorBalance }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Payout failed');
      setContractorBalance(data.remaining || 0);
      toast({ title: 'Payout requested!', description: `€${contractorBalance.toFixed(2)} is being transferred to your Stripe account.` });
    } catch (err) {
      toast({ title: 'Payout failed', description: err.message, variant: 'destructive' });
    } finally {
      setPayoutLoading(false);
    }
  };

  // --- Stripe Connect Handlers ---
  const handleStripeConnect = async () => {
    setStripeConnectLoading(true);
    try {
      const res = await apiServerClient.fetch('/stripe/onboard-contractor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser.id }),
      });
      if (!res.ok) throw new Error('Failed to start Stripe onboarding');
      const { url } = await res.json();
      window.location.href = url;
    } catch (err) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
      setStripeConnectLoading(false);
    }
  };

  const handleStripeOpenDashboard = async () => {
    setStripeConnectLoading(true);
    try {
      const res = await apiServerClient.fetch(`/stripe/contractor-dashboard?userId=${currentUser.id}`);
      if (!res.ok) throw new Error('Failed to open Stripe dashboard');
      const { url } = await res.json();
      window.open(url, '_blank');
    } catch (err) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setStripeConnectLoading(false);
    }
  };

  // Finalize Stripe onboarding on return from Stripe
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('stripe_return') === '1' && currentUser) {
      apiServerClient.fetch('/stripe/finalize-onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser.id }),
      }).then(r => r.json()).then(data => {
        setStripeConnectStatus({ accountId: data.accountId, onboarded: data.onboarded });
        if (data.onboarded) {
          toast({ title: 'Stripe Connected!', description: 'Your Stripe account is ready to receive payments.' });
        }
        window.history.replaceState({}, '', '/settings');
      }).catch(console.error);
    }
  }, [currentUser]);

  // --- Account Handlers ---
  const handleDeleteAccount = async () => {
    setDeleteLoading(true);
    try {
      await pb.collection('users').delete(currentUser.id, { $autoCancel: false });
      toast({ title: "Account Deleted", description: "Your account has been permanently removed." });
      logout();
      navigate('/');
    } catch (error) {
      console.error('Delete account error:', error);
      toast({ title: "Error", description: "Could not delete account.", variant: "destructive" });
      setDeleteLoading(false);
      setIsDeleteModalOpen(false);
    }
  };


  return (
    <>
      <Helmet>
        <title>{t('settings.title')} - Bee Marketplace</title>
      </Helmet>

      <div className="min-h-screen flex flex-col bg-background">
        <Header />

        <main className="flex-1 py-12">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mb-8">
              <Button variant="ghost" asChild className="mb-4 -ml-2 text-muted-foreground hover:text-foreground">
                <Link to={
                  currentUser?.userType === 'contractor'
                    ? '/dashboard/contractor'
                    : currentUser?.userType === 'influencer'
                    ? '/dashboard/influencer'
                    : '/dashboard/client'
                }>
                  {t('settings.back_dashboard')}
                </Link>
              </Button>
              <h1 className="text-3xl font-bold text-foreground">{t('settings.title')}</h1>
              <p className="text-muted-foreground mt-2">{t('settings.subtitle')}</p>
            </div>

            <Tabs defaultValue="profile" className="space-y-6">
              <TabsList className="bg-card border border-border p-1 rounded-xl">
                <TabsTrigger value="profile" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-lg">
                  <User className="w-4 h-4 mr-2" /> {t('settings.tab_profile')}
                </TabsTrigger>
                <TabsTrigger value="payment" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-lg">
                  <CreditCard className="w-4 h-4 mr-2" /> {t('settings.tab_payment')}
                </TabsTrigger>
                <TabsTrigger value="account" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-lg">
                  <Shield className="w-4 h-4 mr-2" /> {t('settings.tab_account')}
                </TabsTrigger>
              </TabsList>

              {/* PROFILE TAB */}
              <TabsContent value="profile">
                <Card className="bg-card border-border rounded-2xl">
                  <CardHeader>
                    <CardTitle>{t('settings.public_profile')}</CardTitle>
                    <CardDescription>{t('settings.public_desc')}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleSaveProfile} className="space-y-6">
                      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 p-4 bg-muted/30 rounded-xl border border-border">
                        <div 
                          className="relative w-24 h-24 rounded-full bg-muted flex items-center justify-center overflow-hidden cursor-pointer group border-2 border-dashed border-border hover:border-primary transition-colors shrink-0"
                          onClick={handleAvatarClick}
                        >
                          {avatarPreview ? (
                            <img src={avatarPreview} alt="Avatar preview" className="w-full h-full object-cover" />
                          ) : (
                            <User className="w-10 h-10 text-muted-foreground" />
                          )}
                          <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <Camera className="w-6 h-6 text-white" />
                          </div>
                        </div>
                        <div className="flex-1">
                          <h3 className="font-medium text-foreground">{t('settings.profile_pic')}</h3>
                          <p className="text-sm text-muted-foreground mb-3">Upload a custom image or generate a unique AI avatar.</p>
                          <div className="flex flex-wrap gap-2">
                            <Button type="button" variant="outline" size="sm" onClick={handleAvatarClick} className="rounded-lg">
                              <Camera className="w-4 h-4 mr-2" />
                              Upload Custom
                            </Button>
                          </div>
                          <input 
                            type="file" 
                            ref={fileInputRef} 
                            onChange={handleAvatarChange} 
                            accept="image/*" 
                            className="hidden" 
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <Label htmlFor="name">{t('settings.display_name')}</Label>
                          <Input 
                            id="name" name="name" value={profileData.name} onChange={handleProfileChange}
                            className="bg-input border-border text-foreground rounded-lg" required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="phone">{t('auth.phone')}</Label>
                          <Input 
                            id="phone" name="phone" value={profileData.phone} onChange={handleProfileChange}
                            className="bg-input border-border text-foreground rounded-lg"
                          />
                        </div>
                        
                        <div className="space-y-2 md:col-span-2">
                          <Label htmlFor="location">{t('auth.location')}</Label>
                          <PlacesAutocompleteInput 
                            value={profileData.location}
                            onChange={(val) => setProfileData({ ...profileData, location: val })}
                            onSelectPlace={handleLocationSelect}
                            placeholder="Search for your city or address..."
                            className="bg-input border-border text-foreground rounded-lg"
                          />
                        </div>
                        
                        {currentUser?.userType === 'contractor' && (
                          <>
                            <div className="space-y-2 md:col-span-2">
                              <Label htmlFor="profession">{t('settings.profession')}</Label>
                              <ProfessionSelector
                                value={profileData.profession}
                                onChange={handleProfessionChange}
                                required={true}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="hourlyRate">Hourly Rate (€)</Label>
                              <Input
                                id="hourlyRate" name="hourlyRate" type="number" min="0"
                                value={profileData.hourlyRate} onChange={handleProfileChange}
                                className="bg-input border-border text-foreground rounded-lg"
                                placeholder="e.g. 25"
                              />
                            </div>
                            <div className="space-y-2 md:col-span-2">
                              <Label htmlFor="bio">{t('settings.bio')}</Label>
                              <Textarea
                                id="bio" name="bio" value={profileData.bio} onChange={handleProfileChange}
                                className="bg-input border-border text-foreground min-h-[120px] rounded-lg"
                                placeholder={t('settings.bio_placeholder')}
                              />
                            </div>
                          </>
                        )}

                        {currentUser?.userType === 'influencer' && (
                          <>
                            <div className="space-y-2">
                              <Label htmlFor="instagramHandle">{t('auth.instagram')}</Label>
                              <Input 
                                id="instagramHandle" name="instagramHandle" value={profileData.instagramHandle} onChange={handleProfileChange}
                                className="bg-input border-border text-foreground rounded-lg" placeholder="@username"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="youtubeChannel">{t('auth.youtube')}</Label>
                              <Input 
                                id="youtubeChannel" name="youtubeChannel" value={profileData.youtubeChannel} onChange={handleProfileChange}
                                className="bg-input border-border text-foreground rounded-lg" placeholder="Channel URL"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="tiktokHandle">{t('auth.tiktok')}</Label>
                              <Input 
                                id="tiktokHandle" name="tiktokHandle" value={profileData.tiktokHandle} onChange={handleProfileChange}
                                className="bg-input border-border text-foreground rounded-lg" placeholder="@username"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="contentNiche">{t('auth.niche')}</Label>
                              <Input 
                                id="contentNiche" name="contentNiche" value={profileData.contentNiche} onChange={handleProfileChange}
                                className="bg-input border-border text-foreground rounded-lg" placeholder="e.g. Tech, Beauty"
                              />
                            </div>
                            <div className="space-y-2 md:col-span-2">
                              <Label htmlFor="influencerBio">{t('auth.bio')}</Label>
                              <Textarea 
                                id="influencerBio" name="influencerBio" value={profileData.influencerBio} onChange={handleProfileChange}
                                className="bg-input border-border text-foreground min-h-[120px] rounded-lg" 
                                placeholder="Tell brands about your audience..."
                              />
                            </div>
                          </>
                        )}

                        {currentUser?.userType === 'client' && (
                          <div className="space-y-2 md:col-span-2 pt-4 border-t border-border">
                            <Label className="text-lg font-semibold">{t('auction.default_location')}</Label>
                            <p className="text-sm text-muted-foreground mb-4">Set your default location for faster request creation.</p>
                            <LocationPicker 
                              initialLocation={clientLocation}
                              onSave={handleSaveClientLocation}
                            />
                          </div>
                        )}
                      </div>

                      <Button type="submit" disabled={profileLoading} className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl">
                        {profileLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {t('settings.save_changes')}
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* PAYMENT TAB */}
              {/* PAYMENT TAB */}
              <TabsContent value="payment" className="space-y-6">
                {(currentUser?.userType === 'contractor') ? (
                  <Card className="bg-card border-border rounded-2xl">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <CreditCard className="w-5 h-5 text-primary" />
                        Payout Details
                      </CardTitle>
                      <CardDescription>
                        Connect your Stripe account to receive earnings from completed jobs.
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-start gap-3 p-4 mb-6 bg-primary/5 border border-primary/20 rounded-xl">
                        <span className="text-primary text-lg font-bold shrink-0">5%</span>
                        <p className="text-sm text-muted-foreground">
                          A <span className="font-semibold text-foreground">5% service fee</span> is deducted from each payout to cover platform operations and payment processing.
                        </p>
                      </div>
                      <div className="rounded-xl border border-border p-4 space-y-4">
                        {stripeConnectStatus.onboarded ? (
                          <>
                            <div className="flex items-center gap-2 text-green-500 font-medium">
                              <CheckCircle2 className="h-5 w-5" />
                              Stripe account connected
                            </div>
                            <p className="text-xs text-muted-foreground">
                              Payments will be transferred directly to your Stripe account (minus 5% platform fee).
                            </p>
                            <div className="flex items-center justify-between p-3 bg-muted/40 rounded-lg">
                              <div>
                                <p className="text-xs text-muted-foreground">Available balance</p>
                                <p className="text-2xl font-bold text-primary">€{contractorBalance.toFixed(2)}</p>
                              </div>
                              <Button
                                className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg"
                                onClick={handleRequestPayout}
                                disabled={payoutLoading || contractorBalance <= 0}
                              >
                                {payoutLoading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                                Withdraw to Stripe
                              </Button>
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              className="rounded-lg"
                              onClick={handleStripeOpenDashboard}
                              disabled={stripeConnectLoading}
                            >
                              {stripeConnectLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <ExternalLink className="h-4 w-4 mr-2" />}
                              Open Stripe Dashboard
                            </Button>
                          </>
                        ) : (
                          <>
                            <p className="text-sm text-muted-foreground">
                              Connect your Stripe account to receive payments directly after each completed job. Takes ~5 minutes.
                            </p>
                            <Button
                              className="bg-[#635BFF] hover:bg-[#5750e8] text-white rounded-lg w-full"
                              onClick={handleStripeConnect}
                              disabled={stripeConnectLoading}
                            >
                              {stripeConnectLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                              Connect with Stripe
                            </Button>
                          </>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <Card className="bg-card border-border rounded-2xl">
                    <CardContent className="flex flex-col items-center justify-center py-12 text-center space-y-3">
                      <CreditCard className="w-10 h-10 text-primary" />
                      <p className="font-medium text-foreground">Payments are handled securely via Stripe</p>
                      <p className="text-sm text-muted-foreground">Your card details are entered at checkout and managed by Stripe — nothing is stored here.</p>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              {/* ACCOUNT TAB */}
              <TabsContent value="account" className="space-y-6">
                <Card className="bg-card border-border rounded-2xl">
                  <CardHeader>
                    <CardTitle>{t('settings.account_info')}</CardTitle>
                    <CardDescription>{t('settings.account_desc')}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label>{t('settings.email_address')}</Label>
                        <Input value={currentUser?.email || ''} disabled className="bg-muted text-muted-foreground border-border rounded-lg" />
                        <p className="text-xs text-muted-foreground mt-1">{t('settings.email_note')}</p>
                      </div>
                      <div className="space-y-2">
                        <Label>{t('settings.account_type')}</Label>
                        <Input value={currentUser?.userType === 'contractor' ? 'Contractor / Professional' : currentUser?.userType === 'influencer' ? 'Influencer' : 'Client'} disabled className="bg-muted text-muted-foreground border-border capitalize rounded-lg" />
                      </div>
                    </div>

                    <div className="pt-6 border-t border-border">
                      <h4 className="font-medium mb-2">{t('settings.password')}</h4>
                      <p className="text-sm text-muted-foreground mb-4">{t('settings.password_desc')}</p>
                      <Button variant="outline" onClick={() => setIsPasswordModalOpen(true)} className="rounded-xl">
                        {t('settings.change_password')}
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-destructive/50 bg-destructive/5 rounded-2xl">
                  <CardHeader>
                    <CardTitle className="text-destructive">{t('settings.danger_zone')}</CardTitle>
                    <CardDescription>{t('settings.danger_desc')}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">
                      {t('settings.delete_note')}
                    </p>
                    <Button variant="destructive" onClick={() => setIsDeleteModalOpen(true)} className="rounded-xl">
                      {t('settings.delete_btn')}
                    </Button>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </main>

        <Footer />
      </div>

      <PasswordChangeModal isOpen={isPasswordModalOpen} onClose={() => setIsPasswordModalOpen(false)} />

      <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <DialogContent className="bg-card border-border rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-destructive">Delete Account</DialogTitle>
            <DialogDescription>
              Are you absolutely sure? This action cannot be undone. This will permanently delete your account and remove your data from our servers.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setIsDeleteModalOpen(false)} disabled={deleteLoading} className="rounded-xl">
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteAccount} disabled={deleteLoading} className="rounded-xl">
              {deleteLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Yes, delete my account
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default SettingsPage;