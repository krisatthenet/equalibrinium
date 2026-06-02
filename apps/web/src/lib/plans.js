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

// Plan granted free to verified students (the "students go free" promo). Kept
// at Premium so it never downgrades a student who paid for an even higher tier.
export const STUDENT_PLAN = 'premium';

export const isInTrial = (user) =>
  !!(user?.trialEndsAt && new Date(user.trialEndsAt) > new Date());

// A student only gets the free perk once an admin has approved their uploaded
// proof of study — see student_verifications + the student-verification hook
// that mirrors the outcome onto users.studentStatus.
export const isVerifiedStudent = (user) =>
  !!(user?.isStudent && user?.studentStatus === 'approved');

export const getEffectivePlan = (user) => {
  if (!user) return 'standard';
  const base = isInTrial(user) ? TRIAL_PLAN : (user.plan || 'standard');
  // Grant at least the student plan to verified students, never downgrading
  // a higher tier they may already hold.
  if (isVerifiedStudent(user) &&
      PLAN_ORDER.indexOf(STUDENT_PLAN) > PLAN_ORDER.indexOf(base)) {
    return STUDENT_PLAN;
  }
  return base;
};
