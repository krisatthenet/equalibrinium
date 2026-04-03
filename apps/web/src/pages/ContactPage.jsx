import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { useTranslation } from 'react-i18next';
import { Send, CheckCircle, Loader2, ShieldCheck } from 'lucide-react';
import pb from '@/lib/pocketbaseClient';
import apiServerClient from '@/lib/apiServerClient.js';
import Header from '@/components/Header.jsx';
import Footer from '@/components/Footer.jsx';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useRecaptchaEnterprise } from '@/hooks/useRecaptchaEnterprise.js';

const ContactPage = () => {
  const { t } = useTranslation();
  const { isLoaded: isRecaptchaLoaded, loadError: recaptchaLoadError, generateToken } = useRecaptchaEnterprise('contact');
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    category: '',
    message: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCategoryChange = (value) => {
    setFormData(prev => ({ ...prev, category: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    setIsSuccess(false);

    let recaptchaToken;
    try {
      recaptchaToken = await generateToken();
    } catch (err) {
      console.error('Token generation failed:', err);
      setError(err.message || 'Security verification failed. Please try again.');
      setIsSubmitting(false);
      return;
    }

    try {
      const response = await apiServerClient.fetch('/contacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          recaptchaToken
        })
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Security verification failed. Please try again.');
      }

      await pb.collection('contacts').create(formData, { $autoCancel: false });

      setIsSuccess(true);
      setFormData({
        name: '',
        email: '',
        subject: '',
        category: '',
        message: ''
      });
    } catch (err) {
      console.error('Error submitting contact form:', err);
      setError(err.message || t('contact.error'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Helmet>
        <title>{t('contact.title')} - Equalibrinium Community</title>
      </Helmet>
      
      <Header />
      
      <main className="flex-1 py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-foreground mb-4">{t('contact.title')}</h1>
            <p className="text-lg text-muted-foreground">
              {t('contact.subtitle')}
            </p>
          </div>

          <div className="bg-card border border-border rounded-2xl p-6 md:p-8 shadow-xl">
            {isSuccess ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="h-16 w-16 bg-primary/10 rounded-full flex items-center justify-center mb-6">
                  <CheckCircle className="h-8 w-8 text-primary" />
                </div>
                <h2 className="text-2xl font-semibold text-foreground mb-2">Message Sent!</h2>
                <p className="text-muted-foreground mb-8">{t('contact.success')}</p>
                <Button onClick={() => setIsSuccess(false)} variant="outline" className="rounded-xl">
                  Send Another Message
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                {error && (
                  <Alert variant="destructive" className="rounded-xl">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                {recaptchaLoadError && (
                  <Alert variant="destructive" className="rounded-xl">
                    <AlertDescription>Security verification failed to load. Please refresh and try again.</AlertDescription>
                  </Alert>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="name">{t('contact.name')} *</Label>
                    <Input
                      id="name"
                      name="name"
                      required
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="John Doe"
                      className="bg-input border-border text-foreground rounded-lg"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">{t('contact.email')} *</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      required
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="john@example.com"
                      className="bg-input border-border text-foreground rounded-lg"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="subject">{t('contact.subject')} *</Label>
                    <Input
                      id="subject"
                      name="subject"
                      required
                      value={formData.subject}
                      onChange={handleChange}
                      placeholder="How can we help?"
                      className="bg-input border-border text-foreground rounded-lg"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="category">{t('contact.category')} *</Label>
                    <Select required value={formData.category} onValueChange={handleCategoryChange}>
                      <SelectTrigger className="bg-input border-border text-foreground rounded-lg">
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="General">{t('contact.categories.general')}</SelectItem>
                        <SelectItem value="Support">{t('contact.categories.support')}</SelectItem>
                        <SelectItem value="Partnership">{t('contact.categories.partnership')}</SelectItem>
                        <SelectItem value="Other">{t('contact.categories.other')}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="message">{t('contact.message')} *</Label>
                  <Textarea
                    id="message"
                    name="message"
                    required
                    value={formData.message}
                    onChange={handleChange}
                    placeholder="Write your message here..."
                    className="min-h-[150px] bg-input border-border text-foreground resize-y rounded-lg"
                  />
                </div>

                <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground py-2">
                  <ShieldCheck className="h-4 w-4" />
                  <span>Protected by reCAPTCHA Enterprise</span>
                </div>

                <Button 
                  type="submit" 
                  className="w-full h-12 text-base font-medium rounded-xl transition-all duration-200 active:scale-[0.98]"
                  disabled={isSubmitting || !isRecaptchaLoaded || !!recaptchaLoadError}
                >
                  {isSubmitting ? (
                    <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> {t('contact.sending')}</>
                  ) : (
                    <><Send className="mr-2 h-5 w-5" /> {t('contact.send')}</>
                  )}
                </Button>
              </form>
            )}
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default ContactPage;