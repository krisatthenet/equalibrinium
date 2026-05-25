export const PLAN_ORDER = ['standard', 'vip', 'elite', 'premium', 'ultra'];

export const PLANS = {
  standard: {
    label: 'Standard',
    color: 'border-border text-muted-foreground bg-transparent',
    contractor: { bidsPerMonth: 5,        activeBids: 2,         featuredSlots: 0, verifiedBadge: false, priorityListing: false },
    client:     { ticketsPerMonth: 3,     activeTickets: 1,      priorityMatching: false, featuredTicket: false },
    pricing:    { contractor: { monthly: 0,  yearly: 0   }, client: { monthly: 0,  yearly: 0   } },
  },
  vip: {
    label: 'VIP',
    color: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
    contractor: { bidsPerMonth: 15,       activeBids: 5,         featuredSlots: 1, verifiedBadge: true, priorityListing: true },
    client:     { ticketsPerMonth: 8,     activeTickets: 3,      priorityMatching: false, featuredTicket: false },
    pricing:    { contractor: { monthly: 9,  yearly: 81  }, client: { monthly: 7,  yearly: 63  } },
  },
  elite: {
    label: 'Elite',
    color: 'bg-purple-500/15 text-purple-400 border-purple-500/30',
    contractor: { bidsPerMonth: 30,       activeBids: 10,        featuredSlots: 3, verifiedBadge: true, priorityListing: true },
    client:     { ticketsPerMonth: 20,    activeTickets: 8,      priorityMatching: true,  featuredTicket: false },
    pricing:    { contractor: { monthly: 24, yearly: 216 }, client: { monthly: 18, yearly: 162 } },
  },
  premium: {
    label: 'Premium',
    color: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
    contractor: { bidsPerMonth: Infinity, activeBids: Infinity,  featuredSlots: 5, verifiedBadge: true, priorityListing: true },
    client:     { ticketsPerMonth: Infinity, activeTickets: Infinity, priorityMatching: true, featuredTicket: true },
    pricing:    { contractor: { monthly: 49, yearly: 441 }, client: { monthly: 35, yearly: 315 } },
  },
  ultra: {
    label: 'Ultra',
    color: 'bg-pink-500/15 text-pink-400 border-pink-500/30',
    contractor: { bidsPerMonth: Infinity, activeBids: Infinity,  featuredSlots: 10, verifiedBadge: true, priorityListing: true },
    client:     { ticketsPerMonth: Infinity, activeTickets: Infinity, priorityMatching: true, featuredTicket: true },
    pricing:    { contractor: { monthly: 99, yearly: 891 }, client: { monthly: 69, yearly: 621 } },
  },
};

export const getPlan = (key) => PLANS[key] ?? PLANS.standard;

export const formatLimit = (n) => (n === Infinity ? 'Unlimited' : n);

export const TRIAL_PLAN = 'premium';

export const isInTrial = (user) =>
  !!(user?.trialEndsAt && new Date(user.trialEndsAt) > new Date());

export const getEffectivePlan = (user) => {
  if (!user) return 'standard';
  if (isInTrial(user)) return TRIAL_PLAN;
  return user.plan || 'standard';
};
