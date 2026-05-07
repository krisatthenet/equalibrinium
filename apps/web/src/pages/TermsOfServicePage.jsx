import React from 'react';
import { PageMeta } from '@/components/PageMeta.jsx';
import { useTranslation } from 'react-i18next';
import Header from '@/components/Header.jsx';
import Footer from '@/components/Footer.jsx';

const TermsOfServicePage = () => {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <PageMeta title={`${t('legal.terms_title')} - WorkBee`} description="Review the terms and conditions governing your use of the WorkBee marketplace platform." />
      
      <Header />
      
      <main className="flex-1 py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <div className="mb-12 text-center">
            <h1 className="text-4xl font-bold text-foreground mb-4">{t('legal.terms_title')}</h1>
            <p className="text-muted-foreground">{t('legal.last_updated')}</p>
          </div>
          
          <div className="prose prose-neutral dark:prose-invert max-w-none">
            <p className="text-lg text-muted-foreground mb-8">
              Welcome to WorkBee. By accessing or using our platform, you agree to be bound by these Terms of Service. Please read them carefully.
            </p>

            <section className="mb-10">
              <h2 className="text-2xl font-semibold text-foreground mb-4">1. User Responsibilities</h2>
              <p className="text-muted-foreground mb-4">
                As a user of the WorkBee platform, whether as a client or contractor, you agree to:
              </p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                <li>Provide accurate, current, and complete information during registration.</li>
                <li>Maintain the security of your account credentials.</li>
                <li>Communicate respectfully and professionally with other users.</li>
                <li>Comply with all applicable local, state, and national laws regarding your services or requests.</li>
                <li>Not use the platform for any illegal or unauthorized purpose.</li>
              </ul>
            </section>

            <section className="mb-10">
              <h2 className="text-2xl font-semibold text-foreground mb-4">2. Service Limitations</h2>
              <p className="text-muted-foreground mb-4">
                WorkBee acts solely as a marketplace connecting clients with contractors. We do not directly provide the services listed on our platform. Therefore:
              </p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                <li>We do not guarantee the quality, safety, or legality of the services advertised.</li>
                <li>We are not responsible for the completion of any agreed-upon work.</li>
                <li>We do not endorse any specific contractor, despite any "featured" or "promoted" status.</li>
              </ul>
            </section>

            <section className="mb-10">
              <h2 className="text-2xl font-semibold text-foreground mb-4">3. Dispute Resolution</h2>
              <p className="text-muted-foreground mb-4">
                In the event of a dispute between users (e.g., a client and a contractor):
              </p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                <li>Users are encouraged to resolve the issue amicably between themselves first.</li>
                <li>WorkBee may, at its discretion, offer mediation services, but is under no obligation to do so.</li>
                <li>WorkBee is not liable for any financial losses or damages resulting from user disputes.</li>
              </ul>
            </section>

            <section className="mb-10">
              <h2 className="text-2xl font-semibold text-foreground mb-4">4. Intellectual Property</h2>
              <p className="text-muted-foreground mb-4">
                All content on the WorkBee platform, including logos, text, graphics, and software, is the property of WorkBee or its licensors and is protected by intellectual property laws. Users retain ownership of the content they upload (e.g., portfolio images) but grant WorkBee a license to display it on the platform.
              </p>
            </section>

            <section className="mb-10">
              <h2 className="text-2xl font-semibold text-foreground mb-4">5. Liability Limitations</h2>
              <p className="text-muted-foreground mb-4">
                To the maximum extent permitted by law, WorkBee shall not be liable for any indirect, incidental, special, consequential, or punitive damages, or any loss of profits or revenues, whether incurred directly or indirectly, or any loss of data, use, goodwill, or other intangible losses resulting from your use of the platform.
              </p>
            </section>

            <section className="mb-10">
              <h2 className="text-2xl font-semibold text-foreground mb-4">6. Account Termination</h2>
              <p className="text-muted-foreground mb-4">
                We reserve the right to suspend or terminate your account at any time, without notice, for conduct that we believe violates these Terms of Service or is harmful to other users of the platform, us, or third parties, or for any other reason.
              </p>
            </section>

            <section className="mb-10">
              <h2 className="text-2xl font-semibold text-foreground mb-4">7. Changes to Terms</h2>
              <p className="text-muted-foreground mb-4">
                We may modify these Terms of Service at any time. We will notify users of any significant changes via email or a prominent notice on the platform. Your continued use of the platform after such modifications constitutes your acceptance of the updated terms.
              </p>
            </section>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default TermsOfServicePage;