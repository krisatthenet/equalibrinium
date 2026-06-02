import React, { useState, useCallback, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import i18n from '@/i18n';
import { useAuth } from '@/contexts/AuthContext.jsx';
import pb from '@/lib/pocketbaseClient.js';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { User, Briefcase, Loader2, Megaphone, MailCheck, Gift, GraduationCap } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Header from '@/components/Header.jsx';
import Footer from '@/components/Footer.jsx';
import ProfessionSelector from '@/components/ProfessionSelector.jsx';
import PlacesAutocompleteInput from '@/components/PlacesAutocompleteInput.jsx';
import SocialAuthButtons from '@/components/SocialAuthButtons.jsx';
import { isValidPersonalCode, isValidIBAN, normaliseIBAN } from '@/lib/ltValidation.js';
import { LT_INSTITUTION_GROUPS } from '@/lib/ltInstitutions.js';

const RegistrationPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { signup } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (pb.authStore.isValid) {
      const type = pb.authStore.record?.userType ?? pb.authStore.model?.userType ?? '';
      if (type === 'contractor') navigate('/dashboard/contractor', { replace: true });
      else if (type === 'influencer') navigate('/dashboard/influencer', { replace: true });
      else navigate('/dashboard/client', { replace: true });
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const [userType, setUserType] = useState(searchParams.get('type') || '');
  const refCode = searchParams.get('ref') || '';
  const isStudent = searchParams.get('promo') === 'student';
  const [formData, setFormData] = useState({
    email: searchParams.get('email') || '',
    password: '',
    passwordConfirm: '',
    name: searchParams.get('name') || '',
    phone: '',
    location: '',
    institution: '',
    profession: '',
    personalCode: '',
    businessCode: '',
    iban: '',
    instagramHandle: '',
    instagramFollowers: '',
    youtubeChannel: '',
    youtubeFollowers: '',
    tiktokHandle: '',
    tiktokFollowers: '',
    contentNiche: '',
    influencerBio: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [studentDoc, setStudentDoc] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!userType) {
      setError('Please select a user type');
      return;
    }

    if (isStudent) {
      if (!formData.institution) {
        setError(t('student.err_institution'));
        return;
      }
      if (!studentDoc) {
        setError(t('student.err_document'));
        return;
      }
    }

    if (userType === 'contractor') {
      if (!formData.profession) {
        setError(t('auth.err_profession'));
        return;
      }
      if (!isValidPersonalCode(formData.personalCode)) {
        setError(t('auth.err_personal_code'));
        return;
      }
      if (!formData.businessCode.trim()) {
        setError(t('auth.err_business_code'));
        return;
      }
      if (!isValidIBAN(formData.iban)) {
        setError(t('auth.err_iban'));
        return;
      }
    }

    if (formData.password !== formData.passwordConfirm) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    setLoading(true);

    try {
      const extraData = {
        name: formData.name,
        phone: formData.phone,
        location: formData.location,
        ...(refCode ? { referredByCode: refCode } : {}),
        ...(isStudent ? { isStudent: true, institution: formData.institution } : {}),
      };
      
      if (userType === 'contractor') {
        extraData.profession = formData.profession;
      } else if (userType === 'influencer') {
        extraData.instagramHandle = formData.instagramHandle;
        extraData.instagramFollowers = formData.instagramFollowers ? parseInt(formData.instagramFollowers) : 0;
        extraData.youtubeChannel = formData.youtubeChannel;
        extraData.youtubeFollowers = formData.youtubeFollowers ? parseInt(formData.youtubeFollowers) : 0;
        extraData.tiktokHandle = formData.tiktokHandle;
        extraData.tiktokFollowers = formData.tiktokFollowers ? parseInt(formData.tiktokFollowers) : 0;
        extraData.contentNiche = formData.contentNiche;
        extraData.influencerBio = formData.influencerBio;
      }

      const newUser = await signup(formData.email, formData.password, userType, extraData);

      // Store sensitive compliance data in the owner-scoped contractor_kyc
      // collection (kept off the publicly-listable users record). signup()
      // authenticates the new user, so this create passes the owner rule.
      if (userType === 'contractor') {
        try {
          await pb.collection('contractor_kyc').create({
            userId: newUser.id,
            personalCode: formData.personalCode.trim(),
            businessCode: formData.businessCode.trim(),
            iban: normaliseIBAN(formData.iban),
          });
        } catch (kycErr) {
          console.error('KYC save failed:', kycErr);
        }
      }

      // Student promo: store proof of study in the owner-scoped
      // student_verifications collection (kept off the publicly-listable users
      // record). A 'pending' record triggers the student-verification hook,
      // which mirrors the status onto users for admin review.
      if (isStudent) {
        try {
          const verification = new FormData();
          verification.append('userId', newUser.id);
          verification.append('institution', formData.institution);
          verification.append('status', 'pending');
          if (studentDoc) verification.append('idDocument', studentDoc);
          await pb.collection('student_verifications').create(verification);
        } catch (svErr) {
          console.error('Student verification save failed:', svErr);
        }
      }

      navigate('/onboarding', { replace: true });

    } catch (err) {
      console.error('Registration error:', err);
      setLoading(false);

      if (err.response?.data?.email?.code === 'validation_not_unique') {
        setError('An account with this email already exists. Please log in instead.');
      } else if (err.response?.data?.password) {
        setError('Invalid password format. Please ensure it meets the requirements.');
      } else {
        setError(err.message || 'Registration failed. Please check your connection and try again.');
      }
    }
  };

  const handleChange = (e) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const COUNTRY_LANGUAGE_MAP = { LT: 'lt', RU: 'ru', PL: 'pl', BY: 'ru', UA: 'ru' };

  const handleLocationSelect = useCallback((place) => {
    setFormData(prev => ({ ...prev, location: place.address }));
    if (place.countryCode) {
      const lng = COUNTRY_LANGUAGE_MAP[place.countryCode] || 'en';
      i18n.changeLanguage(lng);
    }
  }, []);

  const handleProfessionChange = (value) => {
    setFormData(prev => ({
      ...prev,
      profession: value
    }));
  };

  return (
    <>
      <Helmet>
        <title>{t('auth.register_title')} - WorkBee</title>
        <meta name="description" content={t('auth.register_subtitle')} />
      </Helmet>

      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        
        <div className="flex-1 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
          <Card className="w-full max-w-xl bg-card border-border shadow-xl rounded-2xl">
            <CardHeader className="pb-8">
              <CardTitle className="text-3xl text-center font-bold">{t('auth.register_title')}</CardTitle>
              <CardDescription className="text-center text-base">
                {t('auth.register_subtitle')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!userType ? (
                <div className="space-y-4">
                  <p className="text-center text-muted-foreground mb-6 font-medium">
                    {t('auth.choose_type')}
                  </p>

                  <SocialAuthButtons createData={refCode ? { referredByCode: refCode } : {}} />

                  <div className="relative my-2">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t border-border" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-card px-2 text-muted-foreground">Or register with email</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <Button
                      variant="outline"
                      className="min-h-32 h-auto py-4 flex flex-col items-center justify-center gap-3 border-border hover:border-primary hover:bg-primary/5 hover:text-foreground transition-all duration-300 rounded-xl whitespace-normal"
                      onClick={() => setUserType('client')}
                    >
                      <User className="h-8 w-8 text-primary" />
                      <div className="text-center">
                        <span className="font-semibold block">{t('auth.client_type')}</span>
                        <span className="text-xs text-muted-foreground">{t('auth.client_desc')}</span>
                      </div>
                    </Button>
                    <Button
                      variant="outline"
                      className="min-h-32 h-auto py-4 flex flex-col items-center justify-center gap-3 border-border hover:border-primary hover:bg-primary/5 hover:text-foreground transition-all duration-300 rounded-xl whitespace-normal"
                      onClick={() => setUserType('contractor')}
                    >
                      <Briefcase className="h-8 w-8 text-primary" />
                      <div className="text-center">
                        <span className="font-semibold block">{t('auth.contractor_type')}</span>
                        <span className="text-xs text-muted-foreground">{t('auth.contractor_desc')}</span>
                      </div>
                    </Button>
                    <Button
                      variant="outline"
                      className="min-h-32 h-auto py-4 flex flex-col items-center justify-center gap-3 border-border hover:border-primary hover:bg-primary/5 hover:text-foreground transition-all duration-300 rounded-xl whitespace-normal"
                      onClick={() => setUserType('influencer')}
                    >
                      <Megaphone className="h-8 w-8 text-primary" />
                      <div className="text-center">
                        <span className="font-semibold block">{t('auth.influencer_type')}</span>
                        <span className="text-xs text-muted-foreground">{t('auth.influencer_desc')}</span>
                      </div>
                    </Button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  {refCode && (
                    <div className="flex items-center gap-2 px-4 py-3 bg-primary/10 border border-primary/20 rounded-xl text-sm">
                      <Gift className="h-4 w-4 text-primary shrink-0" />
                      <span className="text-foreground">You were referred by a friend — you'll get <strong>1 free month</strong> on your first plan upgrade.</span>
                    </div>
                  )}
                  {isStudent && (
                    <div className="flex items-center gap-2 px-4 py-3 bg-violet-500/10 border border-violet-500/20 rounded-xl text-sm">
                      <GraduationCap className="h-4 w-4 text-violet-500 shrink-0" />
                      <span className="text-foreground">{t('student.form_notice')}</span>
                    </div>
                  )}
                  {error && (
                    <Alert variant="destructive" className="rounded-xl">
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="space-y-2">
                      <Label htmlFor="email">{t('auth.email')}</Label>
                      <Input
                        id="email" name="email" type="email" required
                        value={formData.email} onChange={handleChange}
                        className="bg-input border-border text-foreground rounded-lg"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="name">{t('auth.full_name')}</Label>
                      <Input
                        id="name" name="name" type="text" required
                        value={formData.name} onChange={handleChange}
                        className="bg-input border-border text-foreground rounded-lg"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="password">{t('auth.password')}</Label>
                      <Input
                        id="password" name="password" type="password" required
                        value={formData.password} onChange={handleChange}
                        className="bg-input border-border text-foreground rounded-lg"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="passwordConfirm">{t('auth.confirm_password')}</Label>
                      <Input
                        id="passwordConfirm" name="passwordConfirm" type="password" required
                        value={formData.passwordConfirm} onChange={handleChange}
                        className="bg-input border-border text-foreground rounded-lg"
                      />
                    </div>

                    {isStudent && (
                      <div className="space-y-2 md:col-span-2">
                        <Label htmlFor="institution">{t('student.institution_label')}</Label>
                        <select
                          id="institution" name="institution" required
                          value={formData.institution} onChange={handleChange}
                          className="flex h-10 w-full rounded-lg border border-border bg-input px-3 py-2 text-sm text-foreground ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <option value="" disabled>{t('student.institution_placeholder')}</option>
                          {LT_INSTITUTION_GROUPS.map((group) => (
                            <optgroup key={group.label} label={group.label}>
                              {group.options.map((name) => (
                                <option key={name} value={name}>{name}</option>
                              ))}
                            </optgroup>
                          ))}
                          <option value="other">{t('student.institution_other')}</option>
                        </select>
                      </div>
                    )}

                    {isStudent && (
                      <div className="space-y-2 md:col-span-2">
                        <Label htmlFor="studentDoc">{t('student.document_label')}</Label>
                        <Input
                          id="studentDoc" name="studentDoc" type="file" required
                          accept="image/jpeg,image/png,image/webp,application/pdf"
                          onChange={(e) => setStudentDoc(e.target.files?.[0] || null)}
                          className="bg-input border-border text-foreground rounded-lg file:text-foreground file:bg-transparent file:border-0 cursor-pointer"
                        />
                        <p className="text-xs text-muted-foreground">{t('student.document_hint')}</p>
                      </div>
                    )}

                    {userType === 'contractor' && (
                      <div className="space-y-2 md:col-span-2">
                        <Label htmlFor="profession">{t('auth.profession')}</Label>
                        <ProfessionSelector
                          value={formData.profession}
                          onChange={handleProfessionChange}
                          required={true}
                        />
                      </div>
                    )}

                    {userType === 'contractor' && (
                      <>
                        <div className="space-y-2 md:col-span-2 pt-2">
                          <p className="text-sm font-medium text-foreground">{t('auth.compliance_heading')}</p>
                          <p className="text-xs text-muted-foreground">{t('auth.compliance_note')}</p>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="personalCode">{t('auth.personal_code')}</Label>
                          <Input
                            id="personalCode" name="personalCode" type="text" inputMode="numeric"
                            required maxLength={11} placeholder="49001011234"
                            value={formData.personalCode} onChange={handleChange}
                            className="bg-input border-border text-foreground rounded-lg"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="businessCode">{t('auth.business_code')}</Label>
                          <Input
                            id="businessCode" name="businessCode" type="text"
                            required placeholder={t('auth.business_code_ph')}
                            value={formData.businessCode} onChange={handleChange}
                            className="bg-input border-border text-foreground rounded-lg"
                          />
                        </div>
                        <div className="space-y-2 md:col-span-2">
                          <Label htmlFor="iban">{t('auth.iban')}</Label>
                          <Input
                            id="iban" name="iban" type="text"
                            required placeholder="LT12 1000 0111 0100 1000"
                            value={formData.iban} onChange={handleChange}
                            className="bg-input border-border text-foreground rounded-lg"
                          />
                        </div>
                      </>
                    )}

                    {userType !== 'influencer' && (
                      <>
                        <div className="space-y-2">
                          <Label htmlFor="phone">{t('auth.phone')}</Label>
                          <Input
                            id="phone" name="phone" type="tel"
                            value={formData.phone} onChange={handleChange}
                            className="bg-input border-border text-foreground rounded-lg"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="location">{t('auth.location')}</Label>
                          <PlacesAutocompleteInput
                            value={formData.location}
                            onChange={(val) => setFormData(prev => ({ ...prev, location: val }))}
                            onSelectPlace={handleLocationSelect}
                            placeholder="Search for your city or address..."
                            className="bg-input border-border text-foreground rounded-lg"
                          />
                        </div>
                      </>
                    )}

                    {userType === 'influencer' && (
                      <>
                        <div className="space-y-2">
                          <Label htmlFor="instagramHandle">{t('auth.instagram')}</Label>
                          <Input
                            id="instagramHandle" name="instagramHandle" type="text" placeholder="@username"
                            value={formData.instagramHandle} onChange={handleChange}
                            className="bg-input border-border text-foreground rounded-lg"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="instagramFollowers">{t('auth.followers')} (Instagram)</Label>
                          <Input
                            id="instagramFollowers" name="instagramFollowers" type="number" min="0"
                            value={formData.instagramFollowers} onChange={handleChange}
                            className="bg-input border-border text-foreground rounded-lg"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="youtubeChannel">{t('auth.youtube')}</Label>
                          <Input
                            id="youtubeChannel" name="youtubeChannel" type="text" placeholder="Channel URL or Name"
                            value={formData.youtubeChannel} onChange={handleChange}
                            className="bg-input border-border text-foreground rounded-lg"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="youtubeFollowers">{t('auth.followers')} (YouTube)</Label>
                          <Input
                            id="youtubeFollowers" name="youtubeFollowers" type="number" min="0"
                            value={formData.youtubeFollowers} onChange={handleChange}
                            className="bg-input border-border text-foreground rounded-lg"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="tiktokHandle">{t('auth.tiktok')}</Label>
                          <Input
                            id="tiktokHandle" name="tiktokHandle" type="text" placeholder="@username"
                            value={formData.tiktokHandle} onChange={handleChange}
                            className="bg-input border-border text-foreground rounded-lg"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="tiktokFollowers">{t('auth.followers')} (TikTok)</Label>
                          <Input
                            id="tiktokFollowers" name="tiktokFollowers" type="number" min="0"
                            value={formData.tiktokFollowers} onChange={handleChange}
                            className="bg-input border-border text-foreground rounded-lg"
                          />
                        </div>
                        <div className="space-y-2 md:col-span-2">
                          <Label htmlFor="contentNiche">{t('auth.niche')}</Label>
                          <Input
                            id="contentNiche" name="contentNiche" type="text" placeholder="e.g. Tech, Beauty, Fitness"
                            value={formData.contentNiche} onChange={handleChange}
                            className="bg-input border-border text-foreground rounded-lg"
                          />
                        </div>
                        <div className="space-y-2 md:col-span-2">
                          <Label htmlFor="influencerBio">{t('auth.bio')}</Label>
                          <Textarea
                            id="influencerBio" name="influencerBio" placeholder="Tell brands about your audience and content..."
                            value={formData.influencerBio} onChange={handleChange}
                            className="bg-input border-border text-foreground rounded-lg min-h-[100px]"
                          />
                        </div>
                      </>
                    )}
                  </div>

                  <div className="flex gap-3 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      className="flex-1 rounded-xl"
                      onClick={() => setUserType('')}
                      disabled={loading}
                    >
                      {t('auth.back')}
                    </Button>
                    <Button
                      type="submit"
                      disabled={loading}
                      className="flex-[2] bg-primary text-primary-foreground hover:bg-primary/90 transition-all duration-200 active:scale-[0.98] rounded-xl font-semibold"
                    >
                      {loading ? (
                        <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> {t('auth.registering')}</>
                      ) : (
                        t('auth.register_btn')
                      )}
                    </Button>
                  </div>

                  <p className="text-center text-sm text-muted-foreground mt-6">
                    {t('auth.has_account')}{' '}
                    <Link to="/login" className="text-primary hover:underline font-medium">
                      {t('auth.login_btn')}
                    </Link>
                  </p>
                </form>
              )}
            </CardContent>
          </Card>
        </div>

        <Footer />
      </div>
    </>
  );
};

export default RegistrationPage;