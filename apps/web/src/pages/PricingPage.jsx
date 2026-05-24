import React, { useState } from 'react';
import { PageMeta } from '@/components/PageMeta.jsx';
import { Check, Minus } from 'lucide-react';
import Header from '@/components/Header.jsx';
import Footer from '@/components/Footer.jsx';
import { Button } from '@/components/ui/button';
import { PLANS, PLAN_ORDER, formatLimit } from '@/lib/plans';
import { useNavigate } from 'react-router-dom';

const FEATURES = {
  contractor: [
    { key: 'bidsPerMonth',  label: 'Bids per month',     fmt: (v) => formatLimit(v) },
    { key: 'activeBids',    label: 'Active bids',         fmt: (v) => formatLimit(v) },
    { key: 'featuredSlots', label: 'Featured slots',      fmt: (v) => formatLimit(v) },
  ],
  client: [
    { key: 'ticketsPerMonth',  label: 'Tickets per month',    fmt: (v) => formatLimit(v) },
    { key: 'activeTickets',    label: 'Active tickets',        fmt: (v) => formatLimit(v) },
    { key: 'priorityMatching', label: 'Priority matching',     fmt: (v) => (v ? true : false) },
    { key: 'featuredTicket',   label: 'Featured ticket',       fmt: (v) => (v ? true : false) },
  ],
};

const Cell = ({ value }) => {
  if (value === true)  return <Check className="w-4 h-4 text-primary mx-auto" />;
  if (value === false) return <Minus className="w-4 h-4 text-muted-foreground mx-auto" />;
  return <span className="text-sm font-medium text-foreground">{value}</span>;
};

const PricingPage = () => {
  const [userType, setUserType] = useState('contractor');
  const [cycle, setCycle]       = useState('monthly');
  const navigate = useNavigate();

  const features = FEATURES[userType];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <PageMeta title="Pricing - WorkBee" description="Simple, transparent pricing for accessing WorkBee's marketplace of qualified specialists." />
      <Header />

      <main className="flex-1 py-16 px-4">
        <div className="max-w-5xl mx-auto">

          {/* Heading */}
          <div className="text-center mb-10">
            <h1 className="text-4xl font-bold text-foreground mb-3">Simple, transparent pricing</h1>
            <p className="text-muted-foreground text-lg">Scale as your business grows. Cancel anytime.</p>
          </div>

          {/* Toggles */}
          <div className="flex flex-col sm:flex-row justify-center gap-4 mb-10">
            <div className="flex rounded-xl border border-border p-1 bg-card self-center">
              {['contractor', 'client'].map((t) => (
                <button
                  key={t}
                  onClick={() => setUserType(t)}
                  className={`px-5 py-1.5 rounded-lg text-sm font-medium capitalize transition-colors ${
                    userType === t
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
            <div className="flex rounded-xl border border-border p-1 bg-card self-center">
              {['monthly', 'yearly'].map((c) => (
                <button
                  key={c}
                  onClick={() => setCycle(c)}
                  className={`px-5 py-1.5 rounded-lg text-sm font-medium capitalize transition-colors ${
                    cycle === c
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {c === 'yearly' ? 'Yearly (3mo free)' : 'Monthly'}
                </button>
              ))}
            </div>
          </div>

          {/* Price cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-12">
            {PLAN_ORDER.map((key) => {
              const plan  = PLANS[key];
              const price = plan.pricing[userType][cycle];
              const isPopular = key === 'elite';
              return (
                <div
                  key={key}
                  className={`relative flex flex-col rounded-2xl border p-5 ${
                    isPopular
                      ? 'border-primary bg-primary/5'
                      : 'border-border bg-card'
                  }`}
                >
                  {isPopular && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-xs font-semibold px-3 py-0.5 rounded-full">
                      Popular
                    </span>
                  )}
                  <span className={`inline-flex self-start rounded-md border px-2 py-0.5 text-xs font-semibold mb-3 ${plan.color}`}>
                    {plan.label}
                  </span>
                  <div className="mb-4">
                    {price === 0 ? (
                      <span className="text-3xl font-bold text-foreground">Free</span>
                    ) : (
                      <>
                        <span className="text-3xl font-bold text-foreground">€{price}</span>
                        <span className="text-muted-foreground text-sm">/{cycle === 'yearly' ? 'yr' : 'mo'}</span>
                      </>
                    )}
                  </div>
                  <Button
                    size="sm"
                    variant={isPopular ? 'default' : 'outline'}
                    className="w-full mb-5"
                    onClick={() => navigate('/settings')}
                  >
                    {price === 0 ? 'Get started' : 'Upgrade'}
                  </Button>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    {features.map(({ key: fk, label, fmt }) => {
                      const val = fmt(plan[userType][fk]);
                      return (
                        <li key={fk} className="flex items-center gap-2">
                          {val === true  && <Check className="w-3.5 h-3.5 text-primary shrink-0" />}
                          {val === false && <Minus className="w-3.5 h-3.5 text-muted-foreground shrink-0" />}
                          {val !== true && val !== false && (
                            <span className="font-medium text-foreground">{val}</span>
                          )}
                          <span>{label}</span>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              );
            })}
          </div>

          {/* Comparison table */}
          <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
          <div className="rounded-2xl border border-border overflow-hidden min-w-[480px]">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/40">
                  <th className="text-left px-6 py-4 font-medium text-muted-foreground">Feature</th>
                  {PLAN_ORDER.map((key) => (
                    <th key={key} className="px-4 py-4 text-center">
                      <span className={`inline-flex rounded-md border px-2 py-0.5 text-xs font-semibold ${PLANS[key].color}`}>
                        {PLANS[key].label}
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {features.map(({ key: fk, label, fmt }) => (
                  <tr key={fk} className="hover:bg-muted/20 transition-colors">
                    <td className="px-6 py-3 text-muted-foreground">{label}</td>
                    {PLAN_ORDER.map((pk) => (
                      <td key={pk} className="px-4 py-3 text-center">
                        <Cell value={fmt(PLANS[pk][userType][fk])} />
                      </td>
                    ))}
                  </tr>
                ))}
                <tr className="hover:bg-muted/20 transition-colors">
                  <td className="px-6 py-3 text-muted-foreground">Account manager</td>
                  {PLAN_ORDER.map((pk) => (
                    <td key={pk} className="px-4 py-3 text-center">
                      <Cell value={pk === 'ultra'} />
                    </td>
                  ))}
                </tr>
                <tr className="hover:bg-muted/20 transition-colors">
                  <td className="px-6 py-3 text-muted-foreground">Early feature access</td>
                  {PLAN_ORDER.map((pk) => (
                    <td key={pk} className="px-4 py-3 text-center">
                      <Cell value={pk === 'ultra'} />
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
          </div>

          <p className="text-center text-xs text-muted-foreground mt-6">
            Yearly billing saves 3 months · All prices in EUR · Cancel anytime
          </p>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default PricingPage;
