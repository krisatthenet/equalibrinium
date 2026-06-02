import React, { useState, useEffect, useRef } from 'react';
import { Helmet } from 'react-helmet';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts/AuthContext.jsx';
import pb from '@/lib/pocketbaseClient';
import apiServerClient from '@/lib/apiServerClient.js';
import { useToast } from '@/hooks/use-toast';
import {
  User, CreditCard, Shield, Camera, Loader2, CheckCircle2, ExternalLink,
  UploadCloud, X, FileText, Zap, Check, Minus, Gift, Copy, CheckCheck, Share2,
  GraduationCap, Clock
} from 'lucide-react';
import PlanBadge from '@/components/PlanBadge.jsx';
import { PLANS, PLAN_ORDER, formatLimit, getEffectivePlan, isInTrial, isVerifiedStudent } from '@/lib/plans';
import { useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const [subLoading, setSubLoading] = useState(false);
  const [cancelLoading, setCancelLoading] = useState(false);
  const fileInputRef = useRef(null);
  const workExamplesInputRef = useRef(null);
  const [workExampleFiles, setWorkExampleFiles] = useState([]);
  const [workExamplePreviews, setWorkExamplePreviews] = useState([]);
  const [existingWorkExamples, setExistingWorkExamples] = useState([]);
  const [removedWorkExamples, setRemovedWorkExamples] = useState([]);

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
    serviceRadius: currentUser?.serviceRadius || '',
    instagramHandle: currentUser?.instagramHandle || '',
    instagramFollowers: currentUser?.instagramFollowers ?? '',
    youtubeChannel: currentUser?.youtubeChannel || '',
    youtubeFollowers: currentUser?.youtubeFollowers ?? '',
    tiktokHandle: currentUser?.tiktokHandle || '',
    tiktokFollowers: currentUser?.tiktokFollowers ?? '',
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

  // Referral State
  const [referralStats, setReferralStats] = useState(null);
  const [referralStatsLoading, setReferralStatsLoading] = useState(true);
  const [referralCopied, setReferralCopied] = useState(false);

  const loadAvatar = () => {
    if (currentUser?.avatar) {
      setAvatarPreview(pb.files.getURL(currentUser, currentUser.avatar));
    }
  };

  useEffect(() => {
    const sub = searchParams.get('subscription');
    if (sub === 'success') toast({ title: 'Subscription activated!', description: 'Your plan has been upgraded.' });
    if (sub === 'cancel')  toast({ title: 'Checkout cancelled', description: 'No changes were made.' });

    // Fetch referral stats + history from the API
    if (currentUser?.id) {
      apiServerClient.fetch('/referrals/stats')
        .then(r => r.ok ? r.json() : null)
        .then(data => {
          if (data) setReferralStats(data);
        })
        .catch(() => {})
        .finally(() => setReferralStatsLoading(false));
    } else {
      setReferralStatsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAvatar();

    if (currentUser?.workExamples?.length) {
      setExistingWorkExamples(currentUser.workExamples);
    }

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

  const handleWorkExampleFiles = (newFiles) => {
    Array.from(newFiles).forEach(file => {
      if (file.size > 5 * 1024 * 1024) {
        toast({ title: "File too large", description: `${file.name} exceeds 5MB.`, variant: "destructive" });
        return;
      }
      if (!file.type.match(/(jpeg|png|gif|webp|pdf)$/i)) {
        toast({ title: "Invalid format", description: `${file.name} is not supported.`, variant: "destructive" });
        return;
      }
      setWorkExampleFiles(prev => [...prev, file]);
      if (file.type.startsWith('image/')) {
        setWorkExamplePreviews(prev => [...prev, { url: URL.createObjectURL(file), type: 'image', name: file.name }]);
      } else {
        setWorkExamplePreviews(prev => [...prev, { url: null, type: 'pdf', name: file.name }]);
      }
    });
  };

  const removeNewWorkExample = (index) => {
    setWorkExampleFiles(prev => prev.filter((_, i) => i !== index));
    setWorkExamplePreviews(prev => {
      const updated = [...prev];
      if (updated[index].url) URL.revokeObjectURL(updated[index].url);
      updated.splice(index, 1);
      return updated;
    });
  };

  const removeExistingWorkExample = (filename) => {
    setExistingWorkExamples(prev => prev.filter(f => f !== filename));
    setRemovedWorkExamples(prev => [...prev, filename]);
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
        formData.append('instagramFollowers', parseInt(profileData.instagramFollowers) || 0);
        formData.append('youtubeChannel', profileData.youtubeChannel);
        formData.append('youtubeFollowers', parseInt(profileData.youtubeFollowers) || 0);
        formData.append('tiktokHandle', profileData.tiktokHandle);
        formData.append('tiktokFollowers', parseInt(profileData.tiktokFollowers) || 0);
        formData.append('contentNiche', profileData.contentNiche);
        formData.append('influencerBio', profileData.influencerBio);
      }

      if (avatarFile) {
        formData.append('avatar', avatarFile);
      }

      if (currentUser.userType === 'contractor') {
        formData.append('bio', profileData.bio);
        formData.append('profession', profileData.profession);
        formData.append('serviceRadius', profileData.serviceRadius);
        workExampleFiles.forEach(file => formData.append('workExamples', file));
        removedWorkExamples.forEach(name => formData.append('workExamples-', name));
        // Geocode location to coordinates
        if (profileData.location && window.google?.maps?.Geocoder) {
          try {
            const geocoder = new window.google.maps.Geocoder();
            await Promise.race([
              new Promise((resolve) => {
                geocoder.geocode({ address: profileData.location }, (results, status) => {
                  if (status === 'OK' && results[0]) {
                    formData.append('latitude', results[0].geometry.location.lat());
                    formData.append('longitude', results[0].geometry.location.lng());
                  }
                  resolve();
                });
              }),
              new Promise((resolve) => setTimeout(resolve, 5000)),
            ]);
          } catch (_) {}
        }
      }

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 20000);
      const updated = await pb.collection('users').update(currentUser.id, formData, {
        $autoCancel: false,
        fetch: (url, opts) => fetch(url, { ...opts, signal: controller.signal }),
      }).finally(() => clearTimeout(timeout));

      setExistingWorkExamples(updated.workExamples || []);
      setWorkExampleFiles([]);
      setWorkExamplePreviews([]);
      setRemovedWorkExamples([]);
      toast({ title: "Profile Updated", description: "Your profile has been saved successfully." });
    } catch (error) {
      console.error('Profile update error:', error);
      if (error?.status === 404) {
        toast({ title: "Session expired", description: "Your account was not found. Please log in again.", variant: "destructive" });
        logout();
        navigate('/login');
        return;
      }
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
        body: JSON.stringify({ amount: contractorBalance }),
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

  // --- Subscription Handlers ---
  const handleUpgrade = async (plan, cycle = 'monthly') => {
    setSubLoading(true);
    try {
      const res = await apiServerClient.fetch('/stripe/create-subscription-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser.id, plan, cycle }),
      });
      let data = {};
      try { data = await res.json(); } catch { /* non-JSON response (e.g. 502) */ }
      if (!res.ok) throw new Error(data.error || 'Payment service unavailable. Please try again.');
      window.location.href = data.url;
    } catch (err) {
      toast({ title: 'Upgrade failed', description: err.message, variant: 'destructive' });
      setSubLoading(false);
    }
  };

  const handleCancelSubscription = async () => {
    if (!window.confirm('Cancel subscription? You keep access until the end of the billing period.')) return;
    setCancelLoading(true);
    try {
      const res = await apiServerClient.fetch('/stripe/cancel-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to cancel');
      toast({ title: 'Subscription cancelled', description: 'Access continues until the end of your billing period.' });
    } catch (err) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setCancelLoading(false);
    }
  };

  // --- Client Stripe Portal ---
  const [clientPortalLoading, setClientPortalLoading] = useState(false);
  const handleClientPortal = async () => {
    setClientPortalLoading(true);
    try {
      const res = await apiServerClient.fetch('/stripe/client-portal');
      let data = {};
      try { data = await res.json(); } catch { /* non-JSON */ }
      if (!res.ok) throw new Error(data.error || 'Could not open payment portal');
      window.location.href = data.url;
    } catch (err) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
      setClientPortalLoading(false);
    }
  };

  // --- Stripe Connect Handlers ---
  const handleStripeConnect = async () => {
    setStripeConnectLoading(true);
    try {
      const res = await apiServerClient.fetch('/stripe/onboard-contractor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      const text = await res.text();
      let data;
      try { data = JSON.parse(text); } catch { throw new Error(`Non-JSON (${res.status}): ${text.slice(0, 200)}`); }
      if (!res.ok || data.error) throw new Error(data.error || 'Failed to start Stripe onboarding');
      window.location.href = data.url;
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
        body: JSON.stringify({}),
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
        <title>{t('settings.title')} - WorkBee</title>
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
              <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0 pb-1">
              <TabsList className="bg-card border border-border p-1 rounded-xl whitespace-nowrap w-max sm:w-auto">
                <TabsTrigger value="profile" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-lg">
                  <User className="w-4 h-4 mr-2" /> {t('settings.tab_profile')}
                </TabsTrigger>
                {currentUser?.userType === 'contractor' && (
                  <TabsTrigger value="payment" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-lg">
                    <CreditCard className="w-4 h-4 mr-2" /> {t('settings.tab_payment')}
                  </TabsTrigger>
                )}
                <TabsTrigger value="plan" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-lg">
                  <Zap className="w-4 h-4 mr-2" /> {t('settings.tab_plan')}
                </TabsTrigger>
                <TabsTrigger value="account" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-lg">
                  <Shield className="w-4 h-4 mr-2" /> {t('settings.tab_account')}
                </TabsTrigger>
                <TabsTrigger value="referrals" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-lg">
                  <Gift className="w-4 h-4 mr-2" /> {t('settings.tab_referrals')}
                </TabsTrigger>
              </TabsList>
              </div>

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
                            <img src={avatarPreview} alt={t('settings.avatar_preview_alt')} className="w-full h-full object-cover" />
                          ) : (
                            <User className="w-10 h-10 text-muted-foreground" />
                          )}
                          <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <Camera className="w-6 h-6 text-white" />
                          </div>
                        </div>
                        <div className="flex-1">
                          <h3 className="font-medium text-foreground">{t('settings.profile_pic')}</h3>
                          <p className="text-sm text-muted-foreground mb-3">{t('settings.avatar_desc')}</p>
                          <div className="flex flex-wrap gap-2">
                            <Button type="button" variant="outline" size="sm" onClick={handleAvatarClick} className="rounded-lg">
                              <Camera className="w-4 h-4 mr-2" />
                              {t('settings.upload_custom')}
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
                            placeholder={t('settings.location_search_placeholder')}
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
                            <div className="space-y-2 md:col-span-2">
                              <Label htmlFor="bio">{t('settings.bio')}</Label>
                              <Textarea
                                id="bio" name="bio" value={profileData.bio} onChange={handleProfileChange}
                                className="bg-input border-border text-foreground min-h-[120px] rounded-lg"
                                placeholder={t('settings.bio_placeholder')}
                              />
                            </div>

                            <div className="space-y-2 md:col-span-2">
                              <Label>{t('settings_page.service_area')}</Label>
                              <p className="text-xs text-muted-foreground -mt-1">{t('settings_page.service_area_desc')}</p>
                              <Select
                                value={profileData.serviceRadius}
                                onValueChange={val => setProfileData({ ...profileData, serviceRadius: val })}
                              >
                                <SelectTrigger className="bg-input border-border text-foreground rounded-lg">
                                  <SelectValue placeholder={t('settings_page.service_area_placeholder')} />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="5">{t('settings.radius_within', { km: 5 })}</SelectItem>
                                  <SelectItem value="10">{t('settings.radius_within', { km: 10 })}</SelectItem>
                                  <SelectItem value="25">{t('settings.radius_within', { km: 25 })}</SelectItem>
                                  <SelectItem value="50">{t('settings.radius_within', { km: 50 })}</SelectItem>
                                  <SelectItem value="100">{t('settings.radius_within', { km: 100 })}</SelectItem>
                                  <SelectItem value="lithuania">{t('settings.radius_all_lithuania')}</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>

                            <div className="space-y-3 md:col-span-2">
                              <Label>{t('settings_page.work_examples')}</Label>
                              <p className="text-xs text-muted-foreground -mt-1">{t('settings_page.work_examples_desc')}</p>

                              {/* Existing examples */}
                              {existingWorkExamples.length > 0 && (
                                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                                  {existingWorkExamples.map(filename => {
                                    const url = pb.files.getURL(currentUser, filename);
                                    const isPdf = filename.endsWith('.pdf');
                                    return (
                                      <div key={filename} className="relative group aspect-square rounded-lg border border-border overflow-hidden bg-muted flex items-center justify-center">
                                        {isPdf ? (
                                          <div className="flex flex-col items-center p-2 text-center">
                                            <FileText className="h-7 w-7 text-primary mb-1" />
                                            <span className="text-xs text-muted-foreground truncate w-full px-1">{filename}</span>
                                          </div>
                                        ) : (
                                          <img src={url} alt={filename} className="w-full h-full object-cover" />
                                        )}
                                        <button
                                          type="button"
                                          onClick={() => removeExistingWorkExample(filename)}
                                          className="absolute top-1 right-1 bg-black/60 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive"
                                        >
                                          <X className="h-3 w-3" />
                                        </button>
                                      </div>
                                    );
                                  })}
                                </div>
                              )}

                              {/* New file previews */}
                              {workExamplePreviews.length > 0 && (
                                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                                  {workExamplePreviews.map((preview, i) => (
                                    <div key={i} className="relative group aspect-square rounded-lg border border-primary/40 overflow-hidden bg-muted flex items-center justify-center">
                                      {preview.type === 'image' ? (
                                        <img src={preview.url} alt={preview.name} className="w-full h-full object-cover" />
                                      ) : (
                                        <div className="flex flex-col items-center p-2 text-center">
                                          <FileText className="h-7 w-7 text-primary mb-1" />
                                          <span className="text-xs text-muted-foreground truncate w-full px-1">{preview.name}</span>
                                        </div>
                                      )}
                                      <button
                                        type="button"
                                        onClick={() => removeNewWorkExample(i)}
                                        className="absolute top-1 right-1 bg-black/60 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive"
                                      >
                                        <X className="h-3 w-3" />
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              )}

                              {/* Drop zone */}
                              <div
                                className="border-2 border-dashed border-border hover:border-primary/50 rounded-xl p-6 text-center cursor-pointer transition-colors hover:bg-muted/30"
                                onClick={() => workExamplesInputRef.current?.click()}
                              >
                                <UploadCloud className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                                <p className="text-sm font-medium text-foreground">{t('settings.drop_files')}</p>
                                <p className="text-xs text-muted-foreground mt-1">{t('settings.file_types_note')}</p>
                                <input
                                  type="file"
                                  ref={workExamplesInputRef}
                                  onChange={e => e.target.files?.length && handleWorkExampleFiles(e.target.files)}
                                  className="hidden"
                                  multiple
                                  accept="image/jpeg,image/png,image/gif,image/webp,application/pdf"
                                />
                              </div>
                            </div>
                          </>
                        )}

                        {currentUser?.userType === 'influencer' && (
                          <>
                            <div className="space-y-2">
                              <Label htmlFor="instagramHandle">{t('auth.instagram')}</Label>
                              <Input
                                id="instagramHandle" name="instagramHandle" value={profileData.instagramHandle} onChange={handleProfileChange}
                                className="bg-input border-border text-foreground rounded-lg" placeholder={t('settings.ph_username')}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="instagramFollowers">{t('auth.followers')} (Instagram)</Label>
                              <Input
                                id="instagramFollowers" name="instagramFollowers" type="number" min="0"
                                value={profileData.instagramFollowers} onChange={handleProfileChange}
                                className="bg-input border-border text-foreground rounded-lg" placeholder="0"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="youtubeChannel">{t('auth.youtube')}</Label>
                              <Input
                                id="youtubeChannel" name="youtubeChannel" value={profileData.youtubeChannel} onChange={handleProfileChange}
                                className="bg-input border-border text-foreground rounded-lg" placeholder={t('settings.ph_channel_url')}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="youtubeFollowers">{t('auth.followers')} (YouTube)</Label>
                              <Input
                                id="youtubeFollowers" name="youtubeFollowers" type="number" min="0"
                                value={profileData.youtubeFollowers} onChange={handleProfileChange}
                                className="bg-input border-border text-foreground rounded-lg" placeholder="0"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="tiktokHandle">{t('auth.tiktok')}</Label>
                              <Input
                                id="tiktokHandle" name="tiktokHandle" value={profileData.tiktokHandle} onChange={handleProfileChange}
                                className="bg-input border-border text-foreground rounded-lg" placeholder={t('settings.ph_username')}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="tiktokFollowers">{t('auth.followers')} (TikTok)</Label>
                              <Input
                                id="tiktokFollowers" name="tiktokFollowers" type="number" min="0"
                                value={profileData.tiktokFollowers} onChange={handleProfileChange}
                                className="bg-input border-border text-foreground rounded-lg" placeholder="0"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="contentNiche">{t('auth.niche')}</Label>
                              <Input
                                id="contentNiche" name="contentNiche" value={profileData.contentNiche} onChange={handleProfileChange}
                                className="bg-input border-border text-foreground rounded-lg" placeholder={t('settings.ph_niche')}
                              />
                            </div>
                            <div className="space-y-2 md:col-span-2">
                              <Label htmlFor="influencerBio">{t('auth.bio')}</Label>
                              <Textarea
                                id="influencerBio" name="influencerBio" value={profileData.influencerBio} onChange={handleProfileChange}
                                className="bg-input border-border text-foreground min-h-[120px] rounded-lg"
                                placeholder={t('settings.ph_audience')}
                              />
                            </div>
                          </>
                        )}

                        {currentUser?.userType === 'client' && (
                          <div className="space-y-2 md:col-span-2 pt-4 border-t border-border">
                            <Label className="text-lg font-semibold">{t('auction.default_location')}</Label>
                            <p className="text-sm text-muted-foreground mb-4">{t('settings.client_location_desc')}</p>
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
              <TabsContent value="payment" className="space-y-6">
                {currentUser?.userType === 'client' && (
                  <Card className="bg-card border-border rounded-2xl">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <CreditCard className="w-5 h-5 text-primary" />
                        {t('settings.tab_payment')}
                      </CardTitle>
                      <CardDescription>
                        {t('settings.pay_methods_desc')}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="rounded-xl border border-border p-4 space-y-4">
                        <p className="text-sm text-muted-foreground">
                          {t('settings.pay_secure_note')}
                        </p>
                        <Button
                          className="bg-[#635BFF] hover:bg-[#5750e8] text-white rounded-lg w-full"
                          onClick={handleClientPortal}
                          disabled={clientPortalLoading}
                        >
                          {clientPortalLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <ExternalLink className="h-4 w-4 mr-2" />}
                          {t('settings.open_payment_portal')}
                        </Button>
                        <p className="text-xs text-muted-foreground text-center">
                          {t('settings.payment_portal_redirect')}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                )}
                {currentUser?.userType === 'contractor' && (
                  <Card className="bg-card border-border rounded-2xl">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <CreditCard className="w-5 h-5 text-primary" />
                        {t('settings.payout_title')}
                      </CardTitle>
                      <CardDescription>
                        {t('settings.payout_desc')}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-start gap-3 p-4 mb-6 bg-primary/5 border border-primary/20 rounded-xl">
                        <span className="text-primary text-lg font-bold shrink-0">5%</span>
                        <p className="text-sm text-muted-foreground">
                          {t('settings.payout_fee_note')}
                        </p>
                      </div>
                      <div className="rounded-xl border border-border p-4 space-y-4">
                        {stripeConnectStatus.onboarded ? (
                          <>
                            <div className="flex items-center gap-2 text-green-500 font-medium">
                              <CheckCircle2 className="h-5 w-5" />
                              {t('settings.stripe_connected')}
                            </div>
                            <p className="text-xs text-muted-foreground">
                              {t('settings.stripe_connected_note')}
                            </p>
                            <div className="flex items-center justify-between p-3 bg-muted/40 rounded-lg">
                              <div>
                                <p className="text-xs text-muted-foreground">{t('settings.available_balance')}</p>
                                <p className="text-2xl font-bold text-primary">€{contractorBalance.toFixed(2)}</p>
                              </div>
                              <Button
                                className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg"
                                onClick={handleRequestPayout}
                                disabled={payoutLoading || contractorBalance <= 0}
                              >
                                {payoutLoading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                                {t('settings.withdraw_to_stripe')}
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
                              {t('settings.open_stripe_dashboard')}
                            </Button>
                          </>
                        ) : (
                          <>
                            <p className="text-sm text-muted-foreground">
                              {t('settings.stripe_connect_note')}
                            </p>
                            <Button
                              className="bg-[#635BFF] hover:bg-[#5750e8] text-white rounded-lg w-full"
                              onClick={handleStripeConnect}
                              disabled={stripeConnectLoading}
                            >
                              {stripeConnectLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                              {t('settings.connect_with_stripe')}
                            </Button>
                          </>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              {/* PLAN TAB */}
              <TabsContent value="plan" className="space-y-6">
                {(() => {
                  const currentPlan = getEffectivePlan(currentUser);
                  const inTrial = isInTrial(currentUser);
                  const studentVerified = isVerifiedStudent(currentUser);
                  const studentPending = currentUser?.isStudent && currentUser?.studentStatus === 'pending';
                  const uType = currentUser?.userType === 'client' ? 'client' : 'contractor';
                  const limits = PLANS[currentPlan]?.[uType] ?? PLANS.standard[uType];
                  return (
                    <>
                      {studentVerified && (
                        <Card className="bg-violet-500/5 border-violet-500/30 rounded-2xl">
                          <CardContent className="py-4 flex items-center gap-3">
                            <GraduationCap className="w-5 h-5 text-violet-500 shrink-0" />
                            <p className="text-sm text-foreground">
                              <span className="font-semibold">{t('settings.student_plan_active')}</span>{' '}
                              {t('settings.student_plan_desc')}
                            </p>
                          </CardContent>
                        </Card>
                      )}
                      {studentPending && (
                        <Card className="bg-muted/40 border-border rounded-2xl">
                          <CardContent className="py-4 flex items-center gap-3">
                            <Clock className="w-5 h-5 text-muted-foreground shrink-0" />
                            <p className="text-sm text-foreground">
                              <span className="font-semibold">{t('settings.student_pending')}</span>{' '}
                              {t('settings.student_pending_desc')}
                            </p>
                          </CardContent>
                        </Card>
                      )}
                      {inTrial && !studentVerified && (
                        <Card className="bg-primary/5 border-primary/30 rounded-2xl">
                          <CardContent className="py-4 flex items-center gap-3">
                            <Gift className="w-5 h-5 text-primary shrink-0" />
                            <p className="text-sm text-foreground">
                              <span className="font-semibold">{t('settings.launch_bonus_active')}</span>{' '}
                              {t('settings.launch_bonus_until', { date: new Date(currentUser.trialEndsAt).toLocaleDateString() })}
                            </p>
                          </CardContent>
                        </Card>
                      )}
                      <Card className="bg-card border-border rounded-2xl">
                        <CardHeader>
                          <CardTitle className="flex items-center gap-3">
                            <Zap className="w-5 h-5 text-primary" />
                            {t('settings.current_plan')}
                            <PlanBadge plan={currentPlan} isTrial={inTrial} />
                          </CardTitle>
                          <CardDescription>
                            {inTrial
                              ? t('settings.trial_ends', { date: new Date(currentUser.trialEndsAt).toLocaleDateString() })
                              : currentUser?.planExpiresAt
                              ? t('settings.renews', { date: new Date(currentUser.planExpiresAt).toLocaleDateString() })
                              : currentPlan === 'standard' ? t('settings.free_forever') : t('settings.no_subscription')}
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                            {uType === 'contractor' ? (
                              <>
                                <div className="rounded-xl bg-muted/40 border border-border p-4">
                                  <p className="text-2xl font-bold text-foreground">{formatLimit(limits.bidsPerMonth)}</p>
                                  <p className="text-xs text-muted-foreground mt-1">{t('settings.bids_per_month')}</p>
                                </div>
                                <div className="rounded-xl bg-muted/40 border border-border p-4">
                                  <p className="text-2xl font-bold text-foreground">{formatLimit(limits.activeBids)}</p>
                                  <p className="text-xs text-muted-foreground mt-1">{t('settings.active_bids')}</p>
                                </div>
                                <div className="rounded-xl bg-muted/40 border border-border p-4">
                                  <p className="text-2xl font-bold text-foreground">{formatLimit(limits.featuredSlots)}</p>
                                  <p className="text-xs text-muted-foreground mt-1">{t('settings.featured_slots')}</p>
                                </div>
                              </>
                            ) : (
                              <>
                                <div className="rounded-xl bg-muted/40 border border-border p-4">
                                  <p className="text-2xl font-bold text-foreground">{formatLimit(limits.ticketsPerMonth)}</p>
                                  <p className="text-xs text-muted-foreground mt-1">{t('settings.tickets_per_month')}</p>
                                </div>
                                <div className="rounded-xl bg-muted/40 border border-border p-4">
                                  <p className="text-2xl font-bold text-foreground">{formatLimit(limits.activeTickets)}</p>
                                  <p className="text-xs text-muted-foreground mt-1">{t('settings.active_tickets')}</p>
                                </div>
                                <div className="rounded-xl bg-muted/40 border border-border p-4">
                                  {limits.priorityMatching
                                    ? <Check className="w-6 h-6 text-primary" />
                                    : <Minus className="w-6 h-6 text-muted-foreground" />}
                                  <p className="text-xs text-muted-foreground mt-1">{t('settings.priority_matching')}</p>
                                </div>
                              </>
                            )}
                          </div>
                        </CardContent>
                      </Card>

                      <Card className="bg-card border-border rounded-2xl">
                        <CardHeader>
                          <CardTitle>{t('settings.upgrade_plan_title')}</CardTitle>
                          <CardDescription>{t('settings.upgrade_plan_desc')}</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                            {PLAN_ORDER.filter(k => k !== 'standard').map((key) => {
                              const plan = PLANS[key];
                              const price = plan.pricing[uType].monthly;
                              const isCurrent = key === currentPlan;
                              return (
                                <div key={key} className={`rounded-xl border p-4 flex flex-col gap-3 ${isCurrent ? 'border-primary bg-primary/5' : 'border-border'}`}>
                                  <div className="flex items-center justify-between">
                                    <span className={`inline-flex rounded-md border px-2 py-0.5 text-xs font-semibold ${plan.color}`}>{plan.label}</span>
                                    {isCurrent && <span className="text-xs text-primary font-medium">{t('settings.current_label')}</span>}
                                  </div>
                                  <p className="text-xl font-bold text-foreground">€{price}<span className="text-sm font-normal text-muted-foreground">{t('settings.per_month_short')}</span></p>
                                  <Button
                                    size="sm"
                                    variant={isCurrent ? 'outline' : 'default'}
                                    disabled={isCurrent || subLoading}
                                    className="w-full"
                                    onClick={() => !isCurrent && handleUpgrade(key)}
                                  >
                                    {subLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : isCurrent ? t('settings.current_plan_btn') : t('settings.upgrade_btn')}
                                  </Button>
                                </div>
                              );
                            })}
                          </div>
                          <div className="flex items-center justify-between mt-4">
                            <p className="text-xs text-muted-foreground">
                              {t('settings.billing_note')} <Link to="/pricing" className="underline underline-offset-2">{t('settings.see_full_comparison')}</Link>
                            </p>
                            {currentPlan !== 'standard' && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-xs text-muted-foreground hover:text-destructive"
                                disabled={cancelLoading}
                                onClick={handleCancelSubscription}
                              >
                                {cancelLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : t('settings.cancel_subscription')}
                              </Button>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    </>
                  );
                })()}
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
                        <Input value={currentUser?.userType === 'contractor' ? t('settings.account_type_contractor') : currentUser?.userType === 'influencer' ? t('settings.account_type_influencer') : t('settings.account_type_client')} disabled className="bg-muted text-muted-foreground border-border capitalize rounded-lg" />
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

              {/* REFERRALS TAB */}
              <TabsContent value="referrals" className="space-y-6">
                {/* How it works */}
                <Card className="bg-card border-border rounded-2xl">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Gift className="h-5 w-5 text-primary" /> {t('settings.referral_program')}
                    </CardTitle>
                    <CardDescription>{t('settings.referral_program_desc')}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="p-4 bg-primary/10 border border-primary/20 rounded-xl">
                        <p className="text-xs text-muted-foreground mb-1">{t('settings.you_earn_per_signup')}</p>
                        <p className="text-xl font-bold text-primary">{t('settings.you_earn_value')}</p>
                        <p className="text-xs text-muted-foreground mt-1">{t('settings.you_earn_note')}</p>
                      </div>
                      <div className="p-4 bg-muted/40 border border-border rounded-xl">
                        <p className="text-xs text-muted-foreground mb-1">{t('settings.friend_gets')}</p>
                        <p className="text-xl font-bold text-foreground">{t('settings.friend_gets_value')}</p>
                        <p className="text-xs text-muted-foreground mt-1">{t('settings.friend_gets_note')}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Referral link */}
                <Card className="bg-card border-border rounded-2xl">
                  <CardHeader>
                    <CardTitle>{t('settings.your_referral_link')}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {referralStatsLoading ? (
                      <div className="flex items-center gap-2 text-muted-foreground text-sm">
                        <Loader2 className="h-4 w-4 animate-spin" /> {t('settings.loading_referral_link')}
                      </div>
                    ) : referralStats ? (
                      <>
                        <div className="flex gap-2">
                          <Input
                            readOnly
                            value={referralStats.referralLink}
                            className="bg-input border-border text-foreground rounded-lg font-mono text-sm"
                          />
                          <Button
                            variant="outline"
                            className="shrink-0 rounded-lg"
                            onClick={() => {
                              navigator.clipboard.writeText(referralStats.referralLink);
                              setReferralCopied(true);
                              setTimeout(() => setReferralCopied(false), 2000);
                            }}
                          >
                            {referralCopied ? <CheckCheck className="h-4 w-4 text-primary" /> : <Copy className="h-4 w-4" />}
                          </Button>
                        </div>
                        <p className="text-xs text-muted-foreground mb-3">
                          {t('settings.your_code')} <span className="font-mono font-bold text-foreground">{referralStats.referralCode}</span>
                        </p>
                        {/* Share buttons */}
                        <div className="flex flex-wrap gap-2">
                          <a
                            href={`https://wa.me/?text=${encodeURIComponent('Join WorkBee — the marketplace for skilled contractors in Lithuania. Use my link: ' + referralStats.referralLink)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[#25D366]/10 hover:bg-[#25D366]/20 text-[#25D366] text-sm font-medium transition-colors border border-[#25D366]/20"
                          >
                            <Share2 className="h-3.5 w-3.5" /> WhatsApp
                          </a>
                          <a
                            href={`https://t.me/share/url?url=${encodeURIComponent(referralStats.referralLink)}&text=${encodeURIComponent('Join WorkBee — the marketplace for skilled contractors in Lithuania 🐝')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[#2AABEE]/10 hover:bg-[#2AABEE]/20 text-[#2AABEE] text-sm font-medium transition-colors border border-[#2AABEE]/20"
                          >
                            <Share2 className="h-3.5 w-3.5" /> Telegram
                          </a>
                        </div>
                      </>
                    ) : (
                      <p className="text-sm text-muted-foreground">{t('settings.could_not_load_link')}</p>
                    )}
                  </CardContent>
                </Card>

                {/* Stats + History */}
                <Card className="bg-card border-border rounded-2xl">
                  <CardHeader>
                    <CardTitle>{t('settings.your_referrals')}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-5">
                    {referralStatsLoading ? (
                      <div className="flex items-center gap-2 text-muted-foreground text-sm">
                        <Loader2 className="h-4 w-4 animate-spin" /> {t('settings.loading_stats')}
                      </div>
                    ) : referralStats ? (
                      <>
                        <div className="flex items-center gap-6">
                          <div className="text-center">
                            <p className="text-3xl font-bold text-primary">{referralStats.totalReferrals}</p>
                            <p className="text-xs text-muted-foreground mt-1">{t('settings.people_referred')}</p>
                          </div>
                          <div className="h-12 w-px bg-border" />
                          <div className="text-center">
                            <p className="text-3xl font-bold text-foreground">€{referralStats.totalEarned ?? referralStats.totalReferrals * 10}</p>
                            <p className="text-xs text-muted-foreground mt-1">{t('settings.credits_earned')}</p>
                          </div>
                        </div>

                        {referralStats.history?.length > 0 && (
                          <div className="border border-border rounded-xl overflow-hidden">
                            <div className="grid grid-cols-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground px-4 py-2 bg-muted/30 border-b border-border">
                              <span>{t('settings.col_name')}</span><span className="text-center">{t('settings.col_date')}</span><span className="text-right">{t('settings.col_earned')}</span>
                            </div>
                            {referralStats.history.map(r => (
                              <div key={r.id} className="grid grid-cols-3 text-sm px-4 py-2.5 border-b border-border last:border-0 hover:bg-muted/20 transition-colors">
                                <span className="font-medium text-foreground truncate">{r.name}</span>
                                <span className="text-center text-muted-foreground">{new Date(r.date).toLocaleDateString()}</span>
                                <span className="text-right font-semibold text-green-500">+€{r.earned}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </>
                    ) : (
                      <p className="text-sm text-muted-foreground">{t('settings.could_not_load_stats')}</p>
                    )}
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
            <DialogTitle className="text-destructive">{t('settings.delete_btn')}</DialogTitle>
            <DialogDescription>
              {t('settings.delete_confirm_desc')}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setIsDeleteModalOpen(false)} disabled={deleteLoading} className="rounded-xl">
              {t('settings.cancel')}
            </Button>
            <Button variant="destructive" onClick={handleDeleteAccount} disabled={deleteLoading} className="rounded-xl">
              {deleteLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t('settings.delete_confirm_btn')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default SettingsPage;