import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { useTranslation } from 'react-i18next';
import { Send, CheckCircle, Loader2, Mail, MapPin, Clock } from 'lucide-react';
import pb from '@/lib/pocketbaseClient';
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

const ContactPage = () => {
  const { t } = useTranslation();
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    try {
      await pb.collection('contacts').create(formData, { $autoCancel: false });
      setIsSuccess(true);
      setFormData({ name: '', email: '', subject: '', category: '', message: '' });
    } catch (err) {
      console.error('Contact form error:', err);
      setError(t('contact.error') || 'Failed to send message. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Helmet>
        <title>{t('contact.title')} - WorkBee</title>
      </Helmet>

      <Header />

      <main className="flex-1 py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-foreground mb-4">{t('contact.title')}</h1>
            <p className="text-lg text-muted-foreground">{t('contact.subtitle')}</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Info cards */}
            <div className="space-y-4">
              <div className="bg-card border border-border rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-primary/10 rounded-xl"><Mail className="h-5 w-5 text-primary" /></div>
                  <h3 className="font-semibold">Email</h3>
                </div>
                <p className="text-sm text-muted-foreground">hello@workbee.space</p>
              </div>
              <div className="bg-card border border-border rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-primary/10 rounded-xl"><MapPin className="h-5 w-5 text-primary" /></div>
                  <h3 className="font-semibold">Location</h3>
                </div>
                <p className="text-sm text-muted-foreground">Vilnius, Lithuania</p>
              </div>
              <div className="bg-card border border-border rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-primary/10 rounded-xl"><Clock className="h-5 w-5 text-primary" /></div>
                  <h3 className="font-semibold">Response time</h3>
                </div>
                <p className="text-sm text-muted-foreground">Within 24 hours</p>
              </div>
            </div>

            {/* Form */}
            <div className="lg:col-span-2 bg-card border border-border rounded-2xl p-6 md:p-8 shadow-xl">
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

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="name">{t('contact.name')} *</Label>
                      <Input
                        id="name" name="name" required
                        value={formData.name} onChange={handleChange}
                        placeholder="John Doe"
                        className="bg-input border-border text-foreground rounded-lg"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">{t('contact.email')} *</Label>
                      <Input
                        id="email" name="email" type="email" required
                        value={formData.email} onChange={handleChange}
                        placeholder="john@example.com"
                        className="bg-input border-border text-foreground rounded-lg"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="subject">{t('contact.subject')} *</Label>
                      <Input
                        id="subject" name="subject" required
                        value={formData.subject} onChange={handleChange}
                        placeholder="How can we help?"
                        className="bg-input border-border text-foreground rounded-lg"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>{t('contact.category')}</Label>
                      <Select value={formData.category} onValueChange={(v) => setFormData(p => ({ ...p, category: v }))}>
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
                      id="message" name="message" required
                      value={formData.message} onChange={handleChange}
                      placeholder="Write your message here..."
                      className="min-h-[150px] bg-input border-border text-foreground resize-y rounded-lg"
                    />
                  </div>

                  <Button
                    type="submit"
                    className="w-full h-12 text-base font-medium rounded-xl transition-all duration-200 active:scale-[0.98]"
                    disabled={isSubmitting}
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
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default ContactPage;
