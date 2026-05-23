import React from 'react';
import { Link } from 'react-router-dom';
import { PageMeta } from '@/components/PageMeta.jsx';
import { useTranslation } from 'react-i18next';
import Header from '@/components/Header.jsx';
import Footer from '@/components/Footer.jsx';

const GdprPage = () => {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <PageMeta
        title="GDPR Policy - WorkBee"
        description="Learn how WorkBee processes your personal data in compliance with the General Data Protection Regulation (GDPR)."
      />

      <Header />

      <main className="flex-1 py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <div className="mb-12 text-center">
            <h1 className="text-4xl font-bold text-foreground mb-4">GDPR Policy</h1>
            <p className="text-muted-foreground">Last updated: May 2025</p>
          </div>

          <div className="prose prose-neutral dark:prose-invert max-w-none">
            <p className="text-lg text-muted-foreground mb-8">
              This GDPR Policy describes how WorkBee ("we", "us", or "our") collects, uses, and protects
              your personal data in accordance with the General Data Protection Regulation (EU) 2016/679
              ("GDPR"). We are committed to ensuring the privacy and security of your personal data.
            </p>

            <section className="mb-10">
              <h2 className="text-2xl font-semibold text-foreground mb-4">1. Data Controller</h2>
              <p className="text-muted-foreground mb-4">
                WorkBee operates the platform at <strong className="text-foreground">workbee.space</strong>.
                For the purposes of the GDPR, WorkBee is the data controller responsible for your personal data.
              </p>
              <p className="text-muted-foreground">
                You can contact us regarding any data protection matter at:{' '}
                <a href="mailto:privacy@workbee.space" className="text-primary hover:underline">
                  privacy@workbee.space
                </a>
              </p>
            </section>

            <section className="mb-10">
              <h2 className="text-2xl font-semibold text-foreground mb-4">2. Personal Data We Collect</h2>
              <p className="text-muted-foreground mb-4">
                We collect and process the following categories of personal data:
              </p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                <li><strong className="text-foreground">Identity data:</strong> name, username, profile photo</li>
                <li><strong className="text-foreground">Contact data:</strong> email address, phone number, location</li>
                <li><strong className="text-foreground">Profile data:</strong> professional bio, skills, service categories, social media links</li>
                <li><strong className="text-foreground">Transaction data:</strong> service requests, bids, payment records</li>
                <li><strong className="text-foreground">Communication data:</strong> messages exchanged through our platform</li>
                <li><strong className="text-foreground">Usage data:</strong> pages visited, features used, timestamps, IP address, browser type</li>
                <li><strong className="text-foreground">Review data:</strong> ratings and feedback submitted on the platform</li>
              </ul>
              <p className="text-muted-foreground mt-4">
                Payment card details are not stored by us — they are processed directly by our PCI-DSS
                compliant payment provider (Stripe).
              </p>
            </section>

            <section className="mb-10">
              <h2 className="text-2xl font-semibold text-foreground mb-4">3. Legal Basis for Processing</h2>
              <p className="text-muted-foreground mb-4">
                We only process your personal data when we have a lawful basis to do so. The legal bases
                we rely on are:
              </p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                <li>
                  <strong className="text-foreground">Contract performance (Art. 6(1)(b)):</strong> Processing
                  is necessary to provide our services — account creation, matching clients with contractors,
                  facilitating payments and communications.
                </li>
                <li>
                  <strong className="text-foreground">Legitimate interests (Art. 6(1)(f)):</strong> Improving
                  platform performance, preventing fraud, ensuring security, and sending service-related
                  communications.
                </li>
                <li>
                  <strong className="text-foreground">Legal obligation (Art. 6(1)(c)):</strong> Compliance
                  with applicable laws including tax, anti-money laundering, and financial regulations.
                </li>
                <li>
                  <strong className="text-foreground">Consent (Art. 6(1)(a)):</strong> Marketing emails and
                  non-essential cookies — only where you have given explicit consent, which you may withdraw
                  at any time.
                </li>
              </ul>
            </section>

            <section className="mb-10">
              <h2 className="text-2xl font-semibold text-foreground mb-4">4. How We Use Your Data</h2>
              <p className="text-muted-foreground mb-4">We use your personal data to:</p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                <li>Create and manage your account and profile</li>
                <li>Match clients with suitable contractors and service providers</li>
                <li>Process payments and maintain transaction records</li>
                <li>Enable in-platform messaging between users</li>
                <li>Send transactional notifications (booking confirmations, payment receipts, security alerts)</li>
                <li>Resolve disputes and provide customer support</li>
                <li>Detect and prevent fraud, abuse, and security incidents</li>
                <li>Comply with legal and regulatory obligations</li>
                <li>Improve and personalise platform features based on usage patterns</li>
              </ul>
            </section>

            <section className="mb-10">
              <h2 className="text-2xl font-semibold text-foreground mb-4">5. Data Retention</h2>
              <p className="text-muted-foreground mb-4">
                We retain your personal data only for as long as necessary to fulfil the purposes for
                which it was collected, or as required by law:
              </p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                <li><strong className="text-foreground">Account data:</strong> retained for the duration of your account plus 30 days after deletion (to allow account recovery)</li>
                <li><strong className="text-foreground">Transaction and payment records:</strong> retained for 7 years to meet tax and financial regulatory requirements</li>
                <li><strong className="text-foreground">Communications:</strong> retained for 2 years after the conversation ends</li>
                <li><strong className="text-foreground">Usage logs:</strong> retained for 12 months for security and fraud prevention</li>
              </ul>
              <p className="text-muted-foreground mt-4">
                When data is no longer required, it is securely deleted or anonymised.
              </p>
            </section>

            <section className="mb-10">
              <h2 className="text-2xl font-semibold text-foreground mb-4">6. Data Sharing and Third Parties</h2>
              <p className="text-muted-foreground mb-4">
                We do not sell your personal data. We share it only in the following circumstances:
              </p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                <li>
                  <strong className="text-foreground">Service providers:</strong> Stripe (payments), PocketBase
                  (database hosting), and email delivery providers — all bound by Data Processing Agreements.
                </li>
                <li>
                  <strong className="text-foreground">Between users:</strong> Profile and review data is shared
                  with other users as part of the platform's core functionality.
                </li>
                <li>
                  <strong className="text-foreground">Analytics:</strong> Aggregated, anonymised usage data may
                  be shared with analytics providers to improve the platform.
                </li>
                <li>
                  <strong className="text-foreground">Legal requirements:</strong> Where required by law, court
                  order, or to protect our rights and the safety of users.
                </li>
              </ul>
            </section>

            <section className="mb-10">
              <h2 className="text-2xl font-semibold text-foreground mb-4">7. International Data Transfers</h2>
              <p className="text-muted-foreground mb-4">
                Some of our service providers may process data outside the European Economic Area (EEA).
                Where this occurs, we ensure that appropriate safeguards are in place, such as:
              </p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                <li>Standard Contractual Clauses (SCCs) approved by the European Commission</li>
                <li>Transfers to countries with an adequacy decision from the European Commission</li>
              </ul>
            </section>

            <section className="mb-10">
              <h2 className="text-2xl font-semibold text-foreground mb-4">8. Your Rights Under GDPR</h2>
              <p className="text-muted-foreground mb-4">
                As a data subject under the GDPR, you have the following rights:
              </p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                <li>
                  <strong className="text-foreground">Right of access (Art. 15):</strong> Request a copy of
                  the personal data we hold about you.
                </li>
                <li>
                  <strong className="text-foreground">Right to rectification (Art. 16):</strong> Request
                  correction of inaccurate or incomplete data.
                </li>
                <li>
                  <strong className="text-foreground">Right to erasure (Art. 17):</strong> Request deletion
                  of your personal data ("right to be forgotten"), subject to legal retention obligations.
                </li>
                <li>
                  <strong className="text-foreground">Right to restriction (Art. 18):</strong> Request that
                  we limit how we process your data in certain circumstances.
                </li>
                <li>
                  <strong className="text-foreground">Right to data portability (Art. 20):</strong> Receive
                  your data in a structured, machine-readable format and transfer it to another controller.
                </li>
                <li>
                  <strong className="text-foreground">Right to object (Art. 21):</strong> Object to processing
                  based on legitimate interests or for direct marketing purposes.
                </li>
                <li>
                  <strong className="text-foreground">Rights related to automated decisions (Art. 22):</strong>{' '}
                  Not to be subject to decisions based solely on automated processing that significantly
                  affects you.
                </li>
                <li>
                  <strong className="text-foreground">Right to withdraw consent:</strong> Where processing is
                  based on consent, you may withdraw it at any time without affecting the lawfulness of prior
                  processing.
                </li>
              </ul>
              <p className="text-muted-foreground mt-4">
                To exercise any of these rights, contact us at{' '}
                <a href="mailto:privacy@workbee.space" className="text-primary hover:underline">
                  privacy@workbee.space
                </a>
                . We will respond within 30 days. You can also manage many of these preferences directly
                in your{' '}
                <Link to="/settings" className="text-primary hover:underline">
                  account settings
                </Link>
                .
              </p>
            </section>

            <section className="mb-10">
              <h2 className="text-2xl font-semibold text-foreground mb-4">9. Cookies</h2>
              <p className="text-muted-foreground mb-4">
                We use cookies and similar technologies to operate the platform and, where you have
                consented, to analyse usage. For full details on which cookies we use, their purpose,
                and how to manage your preferences, please read our{' '}
                <Link to="/cookie-policy" className="text-primary hover:underline">
                  Cookie Policy
                </Link>
                .
              </p>
            </section>

            <section className="mb-10">
              <h2 className="text-2xl font-semibold text-foreground mb-4">10. Data Security</h2>
              <p className="text-muted-foreground mb-4">
                We implement appropriate technical and organisational measures to protect your personal
                data against unauthorised access, accidental loss, destruction, or damage. These include
                encrypted data storage, TLS in transit, access controls, and regular security reviews.
              </p>
              <p className="text-muted-foreground">
                If a data breach occurs that is likely to result in a risk to your rights and freedoms,
                we will notify the relevant supervisory authority within 72 hours and, where required,
                inform you directly.
              </p>
            </section>

            <section className="mb-10">
              <h2 className="text-2xl font-semibold text-foreground mb-4">11. Right to Lodge a Complaint</h2>
              <p className="text-muted-foreground mb-4">
                If you believe we have not handled your personal data in accordance with the GDPR, you
                have the right to lodge a complaint with the supervisory authority in your EU member state.
                For users in Lithuania, the relevant authority is:
              </p>
              <address className="text-muted-foreground not-italic mb-4 pl-4 border-l-2 border-border">
                State Data Protection Inspectorate (VDAI)<br />
                L. Sapiegos g. 17, LT-10312 Vilnius, Lithuania<br />
                <a href="https://vdai.lrv.lt" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                  vdai.lrv.lt
                </a>
              </address>
              <p className="text-muted-foreground">
                We encourage you to contact us first at{' '}
                <a href="mailto:privacy@workbee.space" className="text-primary hover:underline">
                  privacy@workbee.space
                </a>{' '}
                so we can resolve your concern directly.
              </p>
            </section>

            <section className="mb-10">
              <h2 className="text-2xl font-semibold text-foreground mb-4">12. Changes to This Policy</h2>
              <p className="text-muted-foreground mb-4">
                We may update this GDPR Policy from time to time. When we make material changes, we will
                notify you by email or via a prominent notice on the platform before the changes take
                effect. The "Last updated" date at the top of this page reflects when changes were last made.
              </p>
            </section>

            <section className="mb-10">
              <h2 className="text-2xl font-semibold text-foreground mb-4">13. Contact Us</h2>
              <p className="text-muted-foreground mb-4">
                For any questions or requests relating to this GDPR Policy or our data practices, please
                contact us:
              </p>
              <ul className="list-none pl-0 text-muted-foreground space-y-1">
                <li>
                  <strong className="text-foreground">Email:</strong>{' '}
                  <a href="mailto:privacy@workbee.space" className="text-primary hover:underline">
                    privacy@workbee.space
                  </a>
                </li>
                <li>
                  <strong className="text-foreground">Website:</strong>{' '}
                  <Link to="/contact" className="text-primary hover:underline">
                    workbee.space/contact
                  </Link>
                </li>
              </ul>
            </section>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default GdprPage;
