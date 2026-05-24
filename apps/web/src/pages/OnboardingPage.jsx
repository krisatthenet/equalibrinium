import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext.jsx';
import pb from '@/lib/pocketbaseClient.js';
import apiServerClient from '@/lib/apiServerClient.js';
import { getUserImageUrl } from '@/lib/userImage';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Camera, CheckCircle, ChevronRight, Loader2, User, Image } from 'lucide-react';
import PlacesAutocompleteInput from '@/components/PlacesAutocompleteInput.jsx';

const ONBOARDING_KEY = (id) => `wb_onboarded_${id}`;

// Steps per user type
const STEPS = {
  contractor: ['photo', 'about', 'categories', 'portfolio', 'trial', 'done'],
  client:     ['photo', 'location', 'trial', 'done'],
  influencer: ['photo', 'social', 'done'],
};

const ProgressBar = ({ current, total }) => (
  <div className="flex items-center gap-1.5 mb-8">
    {Array.from({ length: total }).map((_, i) => (
      <div
        key={i}
        className={`h-1.5 rounded-full flex-1 transition-all duration-300 ${
          i < current ? 'bg-primary' : i === current ? 'bg-primary/50' : 'bg-border'
        }`}
      />
    ))}
  </div>
);

// ── Step: Photo ──────────────────────────────────────────────────────────────
const PhotoStep = ({ user, onNext, onSkip, saving }) => {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(getUserImageUrl(user, { thumb: '400x400' }) || null);
  const inputRef = useRef();

  const handleFile = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    setFile(f);
    setPreview(URL.createObjectURL(f));
  };

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-foreground mb-1">Add a profile photo</h2>
        <p className="text-muted-foreground text-sm">Help clients put a face to your name.</p>
      </div>

      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="w-36 h-36 rounded-full border-2 border-dashed border-border bg-muted/30 flex items-center justify-center overflow-hidden hover:border-primary transition-colors relative group"
      >
        {preview
          ? <img src={preview} alt="avatar" className="w-full h-full object-cover" />
          : <User className="w-14 h-14 text-muted-foreground" />}
        <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <Camera className="w-8 h-8 text-white" />
        </div>
      </button>
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />

      <div className="flex gap-3 w-full max-w-xs">
        <Button variant="outline" className="flex-1 rounded-xl" onClick={onSkip} disabled={saving}>
          Skip for now
        </Button>
        <Button className="flex-1 rounded-xl" onClick={() => onNext(file)} disabled={saving}>
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Continue'}
          {!saving && <ChevronRight className="h-4 w-4 ml-1" />}
        </Button>
      </div>
    </div>
  );
};

// ── Step: About ──────────────────────────────────────────────────────────────
const AboutStep = ({ user, onNext, saving }) => {
  const [bio, setBio] = useState(user.bio || '');
  const [title, setTitle] = useState(user.title || '');

  return (
    <div className="flex flex-col gap-5 w-full">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-foreground mb-1">Tell us about yourself</h2>
        <p className="text-muted-foreground text-sm">This shows on your public profile.</p>
      </div>
      <div className="space-y-4">
        <div>
          <Label className="text-sm font-medium mb-1.5 block">Professional title</Label>
          <Input
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="e.g. Senior Electrician, Freelance Painter…"
            className="rounded-xl"
          />
        </div>
        <div>
          <Label className="text-sm font-medium mb-1.5 block">Bio</Label>
          <Textarea
            value={bio}
            onChange={e => setBio(e.target.value)}
            placeholder="Describe your experience, what you specialise in, and what clients can expect…"
            rows={4}
            className="rounded-xl resize-none"
          />
        </div>
      </div>
      <Button className="w-full rounded-xl" onClick={() => onNext({ bio, title })} disabled={saving}>
        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Continue <ChevronRight className="h-4 w-4 ml-1" /></>}
      </Button>
    </div>
  );
};

// ── Step: Categories ─────────────────────────────────────────────────────────
const CategoriesStep = ({ user, onNext, saving }) => {
  const [allCats, setAllCats] = useState([]);
  const [selected, setSelected] = useState(user.categories || []);

  useEffect(() => {
    pb.collection('categories').getFullList({ sort: 'name', $autoCancel: false })
      .then(setAllCats).catch(() => {});
  }, []);

  const toggle = (id) =>
    setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  return (
    <div className="flex flex-col gap-5 w-full">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-foreground mb-1">What services do you offer?</h2>
        <p className="text-muted-foreground text-sm">Select all that apply — clients filter by these.</p>
      </div>
      <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto pr-1">
        {allCats.map(cat => (
          <button
            key={cat.id}
            type="button"
            onClick={() => toggle(cat.id)}
            className={`text-left px-3 py-2.5 rounded-xl border text-sm transition-all ${
              selected.includes(cat.id)
                ? 'border-primary bg-primary/10 text-primary font-medium'
                : 'border-border bg-muted/20 text-foreground hover:border-primary/50'
            }`}
          >
            {cat.name}
          </button>
        ))}
      </div>
      <div className="flex gap-3">
        <Button variant="outline" className="flex-1 rounded-xl" onClick={() => onNext([])} disabled={saving}>
          Skip
        </Button>
        <Button className="flex-1 rounded-xl" onClick={() => onNext(selected)} disabled={saving || selected.length === 0}>
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Continue <ChevronRight className="h-4 w-4 ml-1" /></>}
        </Button>
      </div>
    </div>
  );
};

// ── Step: Portfolio ──────────────────────────────────────────────────────────
const PortfolioStep = ({ onNext, onSkip, saving }) => {
  const [files, setFiles] = useState([]);
  const inputRef = useRef();

  const handleFiles = (e) => {
    const picked = Array.from(e.target.files).slice(0, 6);
    setFiles(prev => [...prev, ...picked].slice(0, 6));
  };

  return (
    <div className="flex flex-col gap-5 w-full">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-foreground mb-1">Show your work</h2>
        <p className="text-muted-foreground text-sm">Upload photos of completed jobs (up to 6). Optional.</p>
      </div>

      {files.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {files.map((f, i) => (
            <div key={i} className="aspect-square rounded-xl overflow-hidden bg-muted border border-border">
              <img src={URL.createObjectURL(f)} alt={f.name} className="w-full h-full object-cover" />
            </div>
          ))}
        </div>
      )}

      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="border-2 border-dashed border-border rounded-xl py-6 flex flex-col items-center gap-2 text-muted-foreground hover:border-primary hover:text-primary transition-colors"
      >
        <Image className="w-7 h-7" />
        <span className="text-sm">{files.length > 0 ? 'Add more photos' : 'Click to upload photos'}</span>
      </button>
      <input ref={inputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleFiles} />

      <div className="flex gap-3">
        <Button variant="outline" className="flex-1 rounded-xl" onClick={onSkip} disabled={saving}>
          Skip
        </Button>
        <Button className="flex-1 rounded-xl" onClick={() => onNext(files)} disabled={saving}>
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Continue <ChevronRight className="h-4 w-4 ml-1" /></>}
        </Button>
      </div>
    </div>
  );
};

// ── Step: Location ───────────────────────────────────────────────────────────
const LocationStep = ({ user, onNext, onSkip, saving }) => {
  const [location, setLocation] = useState(user.location || '');

  return (
    <div className="flex flex-col gap-5 w-full">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-foreground mb-1">Where are you based?</h2>
        <p className="text-muted-foreground text-sm">We use this to match you with nearby contractors.</p>
      </div>
      <div>
        <Label className="text-sm font-medium mb-1.5 block">Your location</Label>
        <PlacesAutocompleteInput
          value={location}
          onChange={setLocation}
          placeholder="City or address…"
        />
      </div>
      <div className="flex gap-3">
        <Button variant="outline" className="flex-1 rounded-xl" onClick={onSkip} disabled={saving}>
          Skip
        </Button>
        <Button className="flex-1 rounded-xl" onClick={() => onNext({ location })} disabled={saving}>
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Continue <ChevronRight className="h-4 w-4 ml-1" /></>}
        </Button>
      </div>
    </div>
  );
};

// ── Step: Social (Influencer) ────────────────────────────────────────────────
const SocialStep = ({ user, onNext, saving }) => {
  const [data, setData] = useState({
    instagramHandle: user.instagramHandle || '',
    youtubeChannel: user.youtubeChannel || '',
    tiktokHandle: user.tiktokHandle || '',
  });
  const set = (k) => (e) => setData(prev => ({ ...prev, [k]: e.target.value }));

  return (
    <div className="flex flex-col gap-5 w-full">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-foreground mb-1">Your social channels</h2>
        <p className="text-muted-foreground text-sm">Help brands understand your reach.</p>
      </div>
      <div className="space-y-3">
        <div>
          <Label className="text-sm font-medium mb-1.5 block">Instagram handle</Label>
          <Input value={data.instagramHandle} onChange={set('instagramHandle')} placeholder="@username" className="rounded-xl" />
        </div>
        <div>
          <Label className="text-sm font-medium mb-1.5 block">YouTube channel URL</Label>
          <Input value={data.youtubeChannel} onChange={set('youtubeChannel')} placeholder="https://youtube.com/…" className="rounded-xl" />
        </div>
        <div>
          <Label className="text-sm font-medium mb-1.5 block">TikTok handle</Label>
          <Input value={data.tiktokHandle} onChange={set('tiktokHandle')} placeholder="@username" className="rounded-xl" />
        </div>
      </div>
      <Button className="w-full rounded-xl" onClick={() => onNext(data)} disabled={saving}>
        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Continue <ChevronRight className="h-4 w-4 ml-1" /></>}
      </Button>
    </div>
  );
};

// ── Step: Trial ──────────────────────────────────────────────────────────────
const TRIAL_BENEFITS = {
  contractor: [
    'Priority listing in search results',
    'Unlimited job bids per month',
    'Direct client contact unlocked',
  ],
  client: [
    'Post unlimited jobs',
    'Access verified specialist profiles',
    'Priority support',
  ],
};

const TrialStep = ({ userType, onSkip, onStartTrial }) => {
  const [loading, setLoading] = useState(false);
  const price = userType === 'contractor' ? '€9' : '€7';
  const benefits = TRIAL_BENEFITS[userType] || TRIAL_BENEFITS.client;

  const handleTrial = async () => {
    setLoading(true);
    try {
      await onStartTrial();
    } catch {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-6 text-center">
      <div className="w-20 h-20 rounded-full bg-primary/15 flex items-center justify-center">
        <img src="/logo.svg" alt="WorkBee" className="w-12 h-12" />
      </div>
      <div>
        <h2 className="text-2xl font-bold text-foreground mb-2">7 days free, on us 🐝</h2>
        <p className="text-muted-foreground text-sm max-w-xs">
          Try WorkBee VIP free for 7 days. Then just {price}/month. Cancel anytime before your trial ends — no charge.
        </p>
      </div>
      <div className="w-full space-y-3">
        <div className="bg-muted/40 border border-border rounded-xl p-4 text-sm text-left space-y-2.5">
          {benefits.map((b) => (
            <div key={b} className="flex items-center gap-2.5 text-foreground">
              <CheckCircle className="w-4 h-4 text-primary shrink-0" />
              {b}
            </div>
          ))}
          <div className="flex items-center gap-2.5 text-foreground">
            <CheckCircle className="w-4 h-4 text-primary shrink-0" />
            No charges for 7 days
          </div>
        </div>
        <Button
          className="w-full rounded-xl text-base py-5 bg-primary text-primary-foreground hover:bg-primary/90"
          onClick={handleTrial}
          disabled={loading}
        >
          {loading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
          Start free trial — card required
        </Button>
        <button
          type="button"
          onClick={onSkip}
          className="w-full text-xs text-muted-foreground hover:text-foreground transition-colors py-1"
        >
          Skip, take me to my dashboard
        </button>
      </div>
    </div>
  );
};

// ── Step: Done ───────────────────────────────────────────────────────────────
const DoneStep = ({ userType, onGo }) => (
  <div className="flex flex-col items-center gap-6 text-center">
    <div className="w-20 h-20 rounded-full bg-primary/15 flex items-center justify-center">
      <CheckCircle className="w-10 h-10 text-primary" />
    </div>
    <div>
      <h2 className="text-2xl font-bold text-foreground mb-2">You're all set!</h2>
      <p className="text-muted-foreground text-sm max-w-xs">
        {userType === 'contractor'
          ? 'Your profile is live. Start bidding on jobs and grow your business.'
          : userType === 'client'
          ? 'Post your first job and get offers from vetted contractors.'
          : 'Your influencer profile is ready. Brands can now discover you.'}
      </p>
    </div>
    <Button className="w-full max-w-xs rounded-xl text-base py-5" onClick={onGo}>
      Go to my dashboard
    </Button>
  </div>
);

// ── Main Onboarding Page ─────────────────────────────────────────────────────
const getDashboardPath = () => {
  const authRecord = pb.authStore.record ?? pb.authStore.model;
  const type = authRecord?.userType ?? '';
  if (type === 'contractor') return '/dashboard/contractor';
  if (type === 'influencer') return '/dashboard/influencer';
  if (type === 'client') return '/dashboard/client';
  return '/dashboard/client';
};

const OnboardingPage = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [stepIndex, setStepIndex] = useState(0);
  const [saving, setSaving] = useState(false);

  const authRecord = pb.authStore.record ?? pb.authStore.model;
  const userType = authRecord?.userType ?? currentUser?.userType ?? 'client';
  const steps = STEPS[userType] || STEPS.client;
  const currentStep = steps[stepIndex];

  // Skip onboarding if already completed — run once on mount only.
  // [currentUser] would re-run after every PB save (authStore.onChange → setCurrentUser),
  // which can cause a second navigate() call with a stale dashboardPath after finish().
  useEffect(() => {
    const id = pb.authStore.record?.id ?? pb.authStore.model?.id ?? currentUser?.id;
    if (!id) return;
    if (localStorage.getItem(ONBOARDING_KEY(id))) {
      navigate(getDashboardPath(), { replace: true });
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const save = async (data) => {
    const userId = pb.authStore.record?.id ?? pb.authStore.model?.id ?? currentUser?.id;
    setSaving(true);
    try {
      if (data && Object.keys(data).length > 0 && userId) {
        const formData = new FormData();
        Object.entries(data).forEach(([k, v]) => {
          if (Array.isArray(v)) {
            if (k === 'workExamples') v.forEach(f => formData.append('workExamples', f));
            else v.forEach(id => formData.append('categories', id));
          } else if (v instanceof File) {
            formData.append(k, v);
          } else if (v !== null && v !== undefined && v !== '') {
            formData.append(k, v);
          }
        });
        await pb.collection('users').update(userId, formData, { $autoCancel: false });
      }
      setStepIndex(i => i + 1);
    } catch (err) {
      toast({ title: 'Could not save', description: err.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const userId = pb.authStore.record?.id ?? pb.authStore.model?.id ?? currentUser?.id;

  const finish = () => {
    if (userId) localStorage.setItem(ONBOARDING_KEY(userId), '1');
    // Read userType from pb.authStore — React state (currentUser) may not reflect
    // the latest authStore update by the time this callback fires.
    navigate(getDashboardPath(), { replace: true });
  };

  const startTrial = async () => {
    if (userId) localStorage.setItem(ONBOARDING_KEY(userId), '1');
    const dashPath = getDashboardPath();
    try {
      const res = await apiServerClient.fetch('/stripe/create-subscription-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: 'vip', cycle: 'monthly', trial: true, successPath: dashPath + '?trial=started' }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error(data.error || 'Could not create trial session');
      }
    } catch (err) {
      toast({ title: 'Could not start trial', description: err.message, variant: 'destructive' });
      throw err;
    }
  };

  if (!currentUser && !userId) return null;

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <img src="/logo.svg" alt="WorkBee" className="h-8 w-8" />
          <span className="text-xl font-bold text-primary">WorkBee</span>
        </div>

        {/* Card */}
        <div className="bg-card border border-border rounded-2xl p-8 shadow-sm">
          <ProgressBar current={stepIndex} total={steps.length - 1} />

          {currentStep === 'photo' && (
            <PhotoStep
              user={currentUser}
              saving={saving}
              onNext={(file) => save(file ? { avatar: file } : {})}
              onSkip={() => setStepIndex(i => i + 1)}
            />
          )}
          {currentStep === 'about' && (
            <AboutStep
              user={currentUser}
              saving={saving}
              onNext={(data) => save(data)}
            />
          )}
          {currentStep === 'categories' && (
            <CategoriesStep
              user={currentUser}
              saving={saving}
              onNext={(ids) => save(ids.length ? { categories: ids } : {})}
            />
          )}
          {currentStep === 'portfolio' && (
            <PortfolioStep
              saving={saving}
              onNext={(files) => save(files.length ? { workExamples: files } : {})}
              onSkip={() => setStepIndex(i => i + 1)}
            />
          )}
          {currentStep === 'location' && (
            <LocationStep
              user={currentUser}
              saving={saving}
              onNext={(data) => save(data)}
              onSkip={() => setStepIndex(i => i + 1)}
            />
          )}
          {currentStep === 'social' && (
            <SocialStep
              user={currentUser}
              saving={saving}
              onNext={(data) => save(data)}
            />
          )}
          {currentStep === 'trial' && (
            <TrialStep
              userType={userType}
              onSkip={() => setStepIndex(i => i + 1)}
              onStartTrial={startTrial}
            />
          )}
          {currentStep === 'done' && (
            <DoneStep userType={userType} onGo={finish} />
          )}
        </div>

        {/* Skip entire onboarding */}
        {currentStep !== 'done' && currentStep !== 'trial' && (
          <button
            type="button"
            onClick={finish}
            className="w-full text-center text-xs text-muted-foreground hover:text-foreground mt-4 py-2 transition-colors"
          >
            Skip setup — I'll do this later
          </button>
        )}
      </div>
    </div>
  );
};

export default OnboardingPage;
