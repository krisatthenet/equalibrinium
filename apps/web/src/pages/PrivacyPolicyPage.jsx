import React from 'react';
import { PageMeta } from '@/components/PageMeta.jsx';
import { useTranslation } from 'react-i18next';
import Header from '@/components/Header.jsx';
import Footer from '@/components/Footer.jsx';

const PrivacyPolicyPage = () => {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <PageMeta title={`${t('legal.privacy_title')} - WorkBee`} description="Read WorkBee's privacy policy to understand how we collect and use your personal data." />
      
      <Header />
      
      <main className="flex-1 py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <div className="mb-12 text-center">
            <h1 className="text-4xl font-bold text-foreground mb-4">{t('legal.privacy_title')}</h1>
            <p className="text-muted-foreground">{t('legal.last_updated')}</p>
          </div>
          
          <div className="prose prose-neutral dark:prose-invert max-w-none">
            <p className="text-lg text-muted-foreground mb-8">
              At WorkBee, we take your privacy seriously. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our platform.
            </p>

            <section className="mb-10">
              <h2 className="text-2xl font-semibold text-foreground mb-4">1. Data Collection</h2>
              <p className="text-muted-foreground mb-4">
                We collect information that you provide directly to us when you register for an account, update your profile, or use our services. This may include:
              </p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                <li>Personal identification information (Name, Email, Phone number)</li>
                <li>Profile data (Profession, Bio, Location, Social media links)</li>
                <li>Service data (Requests, Bids, Reviews, Messages)</li>
                <li>Payment information (processed securely by our third-party payment providers)</li>
              </ul>
            </section>

            <section className="mb-10">
              <h2 className="text-2xl font-semibold text-foreground mb-4">2. Data Usage</h2>
              <p className="text-muted-foreground mb-4">
                We use the information we collect to:
              </p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                <li>Provide, operate, and maintain our platform</li>
                <li>Match clients with suitable contractors</li>
                <li>Process transactions and send related information</li>
                <li>Send administrative messages, updates, and security alerts</li>
                <li>Respond to your comments, questions, and customer service requests</li>
                <li>Monitor and analyze trends, usage, and activities on our platform</li>
              </ul>
            </section>

            <section className="mb-10">
              <h2 className="text-2xl font-semibold text-foreground mb-4">3. Data Protection</h2>
              <p className="text-muted-foreground mb-4">
                We implement appropriate technical and organizational security measures designed to protect the security of any personal information we process. However, please note that no electronic transmission over the Internet or information storage technology can be guaranteed to be 100% secure.
              </p>
            </section>

            <section className="mb-10">
              <h2 className="text-2xl font-semibold text-foreground mb-4">4. User Rights</h2>
              <p className="text-muted-foreground mb-4">
                Depending on your location, you may have certain rights regarding your personal data, including:
              </p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                <li>The right to access the personal information we hold about you</li>
                <li>The right to request correction of inaccurate data</li>
                <li>The right to request deletion of your personal data</li>
                <li>The right to object to our processing of your data</li>
                <li>The right to data portability</li>
              </ul>
              <p className="text-muted-foreground mt-4">
                You can exercise these rights by contacting us or managing your account settings.
              </p>
            </section>

            <section className="mb-10">
              <h2 className="text-2xl font-semibold text-foreground mb-4">5. Cookies</h2>
              <p className="text-muted-foreground mb-4">
                We use cookies and similar tracking technologies to track the activity on our platform and hold certain information. You can instruct your browser to refuse all cookies or to indicate when a cookie is being sent. For more details, please review our Cookie Policy.
              </p>
            </section>

            <section className="mb-10">
              <h2 className="text-2xl font-semibold text-foreground mb-4">6. Third-Party Services</h2>
              <p className="text-muted-foreground mb-4">
                We may share your information with third-party vendors, service providers, contractors, or agents who perform services for us or on our behalf (e.g., payment processing, data analysis, email delivery, hosting services). These third parties are bound by confidentiality agreements and are not permitted to use your personal data for any other purpose.
              </p>
            </section>

            <section className="mb-10">
              <h2 className="text-2xl font-semibold text-foreground mb-4">7. Contact for Privacy Concerns</h2>
              <p className="text-muted-foreground mb-4">
                If you have questions or comments about this Privacy Policy, please contact us via our Contact page or email us directly at privacy@workbee.space.
              </p>
            </section>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default PrivacyPolicyPage;