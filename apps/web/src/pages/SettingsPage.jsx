import React, { useState, useEffect, useRef } from 'react';
import { Helmet } from 'react-helmet';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts/AuthContext.jsx';
import pb from '@/lib/pocketbaseClient';
import { useToast } from '@/hooks/use-toast';
import { 
  User, CreditCard, Shield, Camera, Loader2, Trash2, Plus, CheckCircle2, XCircle, Sparkles 
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
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
import ImageRegenerationModal from '@/components/ImageRegenerationModal.jsx';

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
  const [contractorRecordId, setContractorRecordId] = useState(null);
  const [clientLocationId, setClientLocationId] = useState(null);
  const [clientLocation, setClientLocation] = useState(null);
  const [isRegenModalOpen, setIsRegenModalOpen] = useState(false);
  
  const [profileData, setProfileData] = useState({
    name: currentUser?.name || '',
    phone: currentUser?.phone || '',
    location: currentUser?.location || '',
    bio: '',
    profession: '',
    instagramHandle: currentUser?.instagramHandle || '',
    youtubeChannel: currentUser?.youtubeChannel || '',
    tiktokHandle: currentUser?.tiktokHandle || '',
    contentNiche: currentUser?.contentNiche || '',
    influencerBio: currentUser?.influencerBio || ''
  });

  // Payment State
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [cardForm, setCardForm] = useState({
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    cardholderName: ''
  });
  const [paypalData, setPaypalData] = useState({
    email: currentUser?.paypalEmail || '',
    connected: currentUser?.paypalConnected || false
  });
  const [stripeData, setStripeData] = useState({
    email: currentUser?.stripeEmail || '',
    connected: currentUser?.stripeConnected || false
  });

  // Account State
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const loadAvatar = () => {
    if (currentUser?.profilePicture) {
      setAvatarPreview(pb.files.getUrl(currentUser, currentUser.profilePicture));
    } else if (currentUser?.avatar) {
      setAvatarPreview(pb.files.getUrl(currentUser, currentUser.avatar));
    }
  };

  useEffect(() => {
    loadAvatar();

    const fetchContractorData = async () => {
      if (currentUser?.userType === 'master' || currentUser?.userType === 'contractor') {
        try {
          const records = await pb.collection('contractors').getList(1, 1, {
            filter: `userId = "${currentUser.id}"`,
            $autoCancel: false
          });
          if (records.items.length > 0) {
            const contractor = records.items[0];
            setContractorRecordId(contractor.id);
            setProfileData(prev => ({ 
              ...prev, 
              bio: contractor.bio || '',
              profession: contractor.profession || '',
              location: contractor.location || prev.location
            }));
          }
        } catch (err) {
          console.error('Error fetching contractor record:', err);
        }
      }
    };

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

    const fetchPaymentMethods = async () => {
      try {
        const records = await pb.collection('payment_methods').getFullList({
          filter: `userId = "${currentUser.id}"`,
          sort: '-created',
          $autoCancel: false
        });
        setPaymentMethods(records);
      } catch (err) {
        console.error('Error fetching payment methods:', err);
      }
    };

    fetchContractorData();
    fetchClientLocation();
    fetchPaymentMethods();
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
        formData.append('profilePicture', avatarFile);
        formData.append('avatar', avatarFile);
      }

      await pb.collection('users').update(currentUser.id, formData, { $autoCancel: false });

      if ((currentUser.userType === 'master' || currentUser.userType === 'contractor') && contractorRecordId) {
        const contractorUpdateData = {
          bio: profileData.bio,
          name: profileData.name,
          profession: profileData.profession,
          location: profileData.location
        };
        await pb.collection('contractors').update(contractorRecordId, contractorUpdateData, { $autoCancel: false });
      }

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

  // --- Payment Handlers ---
  const handleAddCard = async (e) => {
    e.preventDefault();
    setPaymentLoading(true);
    try {
      const newCard = await pb.collection('payment_methods').create({
        userId: currentUser.id,
        cardNumber: cardForm.cardNumber,
        expiryDate: cardForm.expiryDate,
        cvv: cardForm.cvv,
        cardholderName: cardForm.cardholderName,
        isDefault: paymentMethods.length === 0
      }, { $autoCancel: false });

      setPaymentMethods([newCard, ...paymentMethods]);
      setCardForm({ cardNumber: '', expiryDate: '', cvv: '', cardholderName: '' });
      toast({ title: "Card Added", description: "Payment method saved successfully." });
    } catch (error) {
      console.error('Add card error:', error);
      toast({ title: "Failed to add card", description: "Please check your card details.", variant: "destructive" });
    } finally {
      setPaymentLoading(false);
    }
  };

  const handleDeleteCard = async (id) => {
    try {
      await pb.collection('payment_methods').delete(id, { $autoCancel: false });
      setPaymentMethods(paymentMethods.filter(card => card.id !== id));
      toast({ title: "Card Removed", description: "Payment method has been deleted." });
    } catch (error) {
      console.error('Delete card error:', error);
      toast({ title: "Error", description: "Could not remove card.", variant: "destructive" });
    }
  };

  const handleConnectPaypal = async () => {
    if (!paypalData.email) return toast({ title: "Email Required", description: "Please enter your PayPal email.", variant: "destructive" });
    try {
      const isConnecting = !paypalData.connected;
      await pb.collection('users').update(currentUser.id, {
        paypalEmail: isConnecting ? paypalData.email : '',
        paypalConnected: isConnecting
      }, { $autoCancel: false });
      
      setPaypalData({ email: isConnecting ? paypalData.email : '', connected: isConnecting });
      toast({ title: isConnecting ? "PayPal Connected" : "PayPal Disconnected" });
    } catch (error) {
      toast({ title: "Error", description: "Could not update PayPal settings.", variant: "destructive" });
    }
  };

  const handleConnectStripe = async () => {
    if (!stripeData.email) return toast({ title: "Email Required", description: "Please enter your Stripe email.", variant: "destructive" });
    try {
      const isConnecting = !stripeData.connected;
      await pb.collection('users').update(currentUser.id, {
        stripeEmail: isConnecting ? stripeData.email : '',
        stripeConnected: isConnecting
      }, { $autoCancel: false });
      
      setStripeData({ email: isConnecting ? stripeData.email : '', connected: isConnecting });
      toast({ title: isConnecting ? "Stripe Connected" : "Stripe Disconnected" });
    } catch (error) {
      toast({ title: "Error", description: "Could not update Stripe settings.", variant: "destructive" });
    }
  };

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

  const maskCardNumber = (number) => {
    if (!number) return '****';
    const last4 = number.slice(-4);
    return `**** **** **** ${last4}`;
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
                            <Button type="button" variant="secondary" size="sm" onClick={() => setIsRegenModalOpen(true)} className="rounded-lg bg-primary/10 text-primary hover:bg-primary/20 border-none">
                              <Sparkles className="w-4 h-4 mr-2" />
                              Regenerate with AI
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
                        
                        {(currentUser?.userType === 'master' || currentUser?.userType === 'contractor') && (
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
              <TabsContent value="payment" className="space-y-6">
                <Card className="bg-card border-border rounded-2xl">
                  <CardHeader>
                    <CardTitle>{t('settings.saved_cards')}</CardTitle>
                    <CardDescription>{t('settings.cards_desc')}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {paymentMethods.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {paymentMethods.map(card => (
                          <div key={card.id} className="p-4 rounded-xl border border-border bg-muted/30 flex justify-between items-start">
                            <div className="flex gap-3">
                              <div className="p-2 bg-background rounded-lg h-fit">
                                <CreditCard className="w-6 h-6 text-primary" />
                              </div>
                              <div>
                                <p className="font-medium text-foreground">{maskCardNumber(card.cardNumber)}</p>
                                <p className="text-sm text-muted-foreground">Expires {card.expiryDate}</p>
                                <p className="text-sm text-muted-foreground mt-1">{card.cardholderName}</p>
                              </div>
                            </div>
                            <Button variant="ghost" size="icon" onClick={() => handleDeleteCard(card.id)} className="text-destructive hover:text-destructive hover:bg-destructive/10">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-muted-foreground text-sm">{t('settings.no_cards')}</p>
                    )}

                    <div className="pt-6 border-t border-border">
                      <h4 className="font-medium mb-4">{t('settings.add_card')}</h4>
                      <form onSubmit={handleAddCard} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2 md:col-span-2">
                          <Label>{t('settings.card_number')}</Label>
                          <Input 
                            required value={cardForm.cardNumber} onChange={e => setCardForm({...cardForm, cardNumber: e.target.value})}
                            placeholder="0000 0000 0000 0000" className="bg-input border-border text-foreground rounded-lg"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>{t('settings.expiry')}</Label>
                          <Input 
                            required value={cardForm.expiryDate} onChange={e => setCardForm({...cardForm, expiryDate: e.target.value})}
                            placeholder="MM/YY" className="bg-input border-border text-foreground rounded-lg"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>{t('settings.cvv')}</Label>
                          <Input 
                            required type="password" maxLength={4} value={cardForm.cvv} onChange={e => setCardForm({...cardForm, cvv: e.target.value})}
                            placeholder="123" className="bg-input border-border text-foreground rounded-lg"
                          />
                        </div>
                        <div className="space-y-2 md:col-span-2">
                          <Label>{t('settings.cardholder')}</Label>
                          <Input 
                            required value={cardForm.cardholderName} onChange={e => setCardForm({...cardForm, cardholderName: e.target.value})}
                            placeholder="John Doe" className="bg-input border-border text-foreground rounded-lg"
                          />
                        </div>
                        <Button type="submit" disabled={paymentLoading} className="w-fit mt-2 bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl">
                          {paymentLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
                          {t('settings.add_btn')}
                        </Button>
                      </form>
                    </div>
                  </CardContent>
                </Card>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card className="bg-card border-border rounded-2xl">
                    <CardHeader>
                      <CardTitle>{t('settings.paypal')}</CardTitle>
                      <CardDescription>{t('settings.paypal_desc')}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label>PayPal Email</Label>
                        <Input 
                          type="email" value={paypalData.email} onChange={e => setPaypalData({...paypalData, email: e.target.value})}
                          disabled={paypalData.connected} className="bg-input border-border text-foreground rounded-lg" placeholder="email@example.com"
                        />
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        {paypalData.connected ? (
                          <><CheckCircle2 className="w-4 h-4 text-green-500" /> <span className="text-green-500">{t('settings.connected')}</span></>
                        ) : (
                          <><XCircle className="w-4 h-4 text-muted-foreground" /> <span className="text-muted-foreground">{t('settings.not_connected')}</span></>
                        )}
                      </div>
                    </CardContent>
                    <CardFooter>
                      <Button 
                        variant={paypalData.connected ? "outline" : "default"} 
                        onClick={handleConnectPaypal}
                        className={!paypalData.connected ? "bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl" : "rounded-xl"}
                      >
                        {paypalData.connected ? t('settings.disconnect') : t('settings.connect')}
                      </Button>
                    </CardFooter>
                  </Card>

                  <Card className="bg-card border-border rounded-2xl">
                    <CardHeader>
                      <CardTitle>{t('settings.stripe')}</CardTitle>
                      <CardDescription>{t('settings.stripe_desc')}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label>Stripe Email</Label>
                        <Input 
                          type="email" value={stripeData.email} onChange={e => setStripeData({...stripeData, email: e.target.value})}
                          disabled={stripeData.connected} className="bg-input border-border text-foreground rounded-lg" placeholder="email@example.com"
                        />
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        {stripeData.connected ? (
                          <><CheckCircle2 className="w-4 h-4 text-green-500" /> <span className="text-green-500">{t('settings.connected')}</span></>
                        ) : (
                          <><XCircle className="w-4 h-4 text-muted-foreground" /> <span className="text-muted-foreground">{t('settings.not_connected')}</span></>
                        )}
                      </div>
                    </CardContent>
                    <CardFooter>
                      <Button 
                        variant={stripeData.connected ? "outline" : "default"} 
                        onClick={handleConnectStripe}
                        className={!stripeData.connected ? "bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl" : "rounded-xl"}
                      >
                        {stripeData.connected ? t('settings.disconnect') : t('settings.connect')}
                      </Button>
                    </CardFooter>
                  </Card>
                </div>
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
                        <Input value={currentUser?.userType === 'master' || currentUser?.userType === 'contractor' ? 'Contractor / Professional' : currentUser?.userType === 'influencer' ? 'Influencer' : 'Client'} disabled className="bg-muted text-muted-foreground border-border capitalize rounded-lg" />
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

      <ImageRegenerationModal 
        isOpen={isRegenModalOpen} 
        onClose={() => setIsRegenModalOpen(false)} 
        userId={currentUser?.id}
        currentImageUrl={avatarPreview}
        imageType="profilePicture"
        onSuccess={() => {
          // Refresh user data to get new avatar
          pb.collection('users').getOne(currentUser.id, { $autoCancel: false }).then(updatedUser => {
            if (updatedUser.profilePicture) {
              setAvatarPreview(pb.files.getUrl(updatedUser, updatedUser.profilePicture));
            }
          });
        }}
      />

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