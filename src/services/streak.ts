// src/services/streak.ts
// Astha Streak — daily checklist + streak/points stored in localStorage

export type StreakEvent =
  // Payments
  | "qr_pay_success"
  | "bill_payment_electricity"
  | "bill_payment_gas"
  | "bill_payment_water"
  | "bill_payment_internet"
  | "bill_payment_tv"
  | "bill_payment_education"
  | "card_bill_payment"
  | "loan_installment_payment"
  // Mobile top-up (FlexiLoad)
  | "recharge_gp"
  | "recharge_robi"
  | "recharge_banglalink"
  | "recharge_teletalk"
  // Wallet / MFS cash-in
  | "wallet_cash_in_bkash"
  | "wallet_cash_in_nagad"
  | "wallet_cash_in_upay"
  // Transfers
  | "transfer_within_brac"
  | "transfer_other_bank_npsb"
  | "transfer_beftn_rtgs"
  // Savings & investments
  | "open_fdr_dps"
  | "deposit_to_savings"
  // Housekeeping / engagement
  | "add_beneficiary"
  | "set_standing_instruction"
  | "rewards_viewed"
  | "chatbot_used";

export type StreakState = {
  days: number;                 // current consecutive days
  best: number;                 // best streak
  points: number;               // lifetime points
  dateISO: string;              // yyyy-mm-dd
  completed: Record<StreakEvent, boolean>;
  badges: string[];             // "3d","7d","30d","powerUser"
  lastSeenAt: number;
};

export const ALL_EVENTS: { key: StreakEvent; label: string; group: string }[] = [
  // Payments
  { key: "qr_pay_success",           label: "QR payment",                 group: "Payments" },
  { key: "bill_payment_electricity", label: "Electricity bill",           group: "Payments" },   // DESCO/DPDC/NESCO/REB
  { key: "bill_payment_gas",         label: "Gas bill (Titas/Others)",    group: "Payments" },
  { key: "bill_payment_water",       label: "WASA bill",                  group: "Payments" },
  { key: "bill_payment_internet",    label: "Internet bill",              group: "Payments" },
  { key: "bill_payment_tv",          label: "Cable/DTH bill",             group: "Payments" },
  { key: "bill_payment_education",   label: "Education fee",              group: "Payments" },
  { key: "card_bill_payment",        label: "Credit card bill",           group: "Payments" },
  { key: "loan_installment_payment", label: "Loan installment",           group: "Payments" },

  // FlexiLoad (top-up)
  { key: "recharge_gp",              label: "FlexiLoad — GP",             group: "Top-up" },
  { key: "recharge_robi",            label: "FlexiLoad — Robi",           group: "Top-up" },
  { key: "recharge_banglalink",      label: "FlexiLoad — Banglalink",     group: "Top-up" },
  { key: "recharge_teletalk",        label: "FlexiLoad — Teletalk",       group: "Top-up" },

  // Wallet / MFS
  { key: "wallet_cash_in_bkash",     label: "Cash-in to bKash",           group: "Wallet" },
  { key: "wallet_cash_in_nagad",     label: "Cash-in to Nagad",           group: "Wallet" },
  { key: "wallet_cash_in_upay",      label: "Cash-in to Upay",            group: "Wallet" },

  // Transfers
  { key: "transfer_within_brac",     label: "Transfer within BRAC",       group: "Transfers" },
  { key: "transfer_other_bank_npsb", label: "Other bank (NPSB)",          group: "Transfers" },
  { key: "transfer_beftn_rtgs",      label: "BEFTN / RTGS",               group: "Transfers" },

  // Savings & investments
  { key: "open_fdr_dps",             label: "Open FDR/DPS",               group: "Savings" },
  { key: "deposit_to_savings",       label: "Deposit to Savings",         group: "Savings" },

  // Housekeeping / engagement
  { key: "add_beneficiary",          label: "Add beneficiary",            group: "Manage" },
  { key: "set_standing_instruction", label: "Set standing instruction",   group: "Manage" },
  { key: "rewards_viewed",           label: "Check Rewards & Cashback",   group: "Engage" },
  { key: "chatbot_used",             label: "Use Astha Assistant",        group: "Engage" },
];

const LS_KEY = "astha_streak_v1";

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}
function yesterISO() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().slice(0, 10);
}

function blankDay(): StreakState {
  return {
    days: 0,
    best: 0,
    points: 0,
    dateISO: todayISO(),
    completed: Object.fromEntries(
      ALL_EVENTS.map(e => [e.key, false])
    ) as Record<StreakEvent, boolean>,
    badges: [],
    lastSeenAt: Date.now(),
  };
}

function load(): StreakState {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return blankDay();
    const s = JSON.parse(raw) as StreakState;

    // roll day if needed
    const t = todayISO();
    if (s.dateISO === t) return s;

    const wasYesterday = s.dateISO === yesterISO();
    const days = wasYesterday ? Math.max(1, (s.days || 0) + 1) : 1;
    const best = Math.max(s.best || 0, days);

    return {
      ...blankDay(),
      days,
      best,
      points: s.points || 0,
      badges: s.badges || [],
    };
  } catch {
    return blankDay();
  }
}

function save(s: StreakState) {
  localStorage.setItem(LS_KEY, JSON.stringify({ ...s, lastSeenAt: Date.now() }));
}

function maybeBadge(s: StreakState) {
  const add = (b: string) => { if (!s.badges.includes(b)) s.badges.push(b); };
  if (s.days >= 3)  add("3d");
  if (s.days >= 7)  add("7d");
  if (s.days >= 30) add("30d");
  const allDone = Object.values(s.completed).every(Boolean);
  if (allDone) add("powerUser");
}

export const Streak = {
  snapshot(): StreakState {
    return load();
  },

  mark(event: StreakEvent): StreakState {
    const s = load();
    if (!s.completed[event]) {
      s.completed[event] = true;
      s.points += 10; // flat +10 per unique task/day
    }
    maybeBadge(s);
    save(s);
    return s;
  },

  addPoints(n: number): StreakState {
    const s = load();
    s.points += Math.max(0, Math.floor(n));
    save(s);
    return s;
  },

  resetToday(): StreakState {
    const base = load();
    const s = {
      ...base,
      dateISO: todayISO(),
      completed: Object.fromEntries(
        ALL_EVENTS.map(e => [e.key, false])
      ) as Record<StreakEvent, boolean>,
    };
    save(s);
    return s;
  },
};
