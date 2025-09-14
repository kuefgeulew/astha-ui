// Lightweight client-side store (mock) for budgets, caps, alerts, prefs,
// jar/pot balances, badges, streaks & digest. Everything persists to localStorage.

export type Period = "daily" | "weekly" | "monthly";

export type BudgetCategory = {
  id: string;
  name: string;
  period: Period;
  cap: number;         // user-set cap
  spend: number;       // mock realized spend
  essential?: boolean; // used by "Lock non-essential"
};

export type CategoryAlert = {
  id: string;             // same as categoryId for simplicity
  categoryId: string;
  threshold: number;      // amount in BDT
};

export type MerchantCap = {
  id: string;             // unique key ("daraz")
  label: string;          // "Daraz"
  weeklyCap: number;
  monthlyCap: number;
};

export type SeasonBoost = {
  id: string;
  label: string;          // "Eid shopping"
  start: string;          // ISO date
  end: string;            // ISO date
  boostPercent: number;   // +% applied to categories
  categoryIds: string[];
};

export type BudgetPrefs = {
  rolloverRule: "none" | "daily_to_weekly" | "weekly_to_monthly" | "full_chain";
  autoSavingsEnabled: boolean;
  autoSavingsPercent: number; // 0-100
  lockNonEssential: boolean;
  familySharedEnabled: boolean;
  rewardBoostersEnabled: boolean;
  pushDeepLinksEnabled: boolean;
  monthlyIncomeBDT: number;
};

// ---------------- Keys ----------------
const K_BUDGETS = "astha_budgets_v1";
const K_ALERTS = "astha_category_alerts_v1";
const K_MCAPS = "astha_merchant_caps_v1";
const K_SEASONS = "astha_season_boosts_v1";
const K_PREFS = "astha_budget_prefs_v1";
const K_POINTS = "astha_budget_points_v1";
const K_BADGES = "astha_budget_badges_v1";
const K_JAR = "astha_budget_jar_v1";
const K_POT = "astha_budget_shared_pot_v1";
const K_STREAK_CUR = "astha_budget_streak_cur_v1";
const K_STREAK_BEST = "astha_budget_streak_best_v1";
const K_STREAK_LAST = "astha_budget_streak_last_v1"; // YYYY-MM-DD for simple maintenance

// ---------------- Seed data ----------------
function seedBudgets(): BudgetCategory[] {
  return [
    // Daily
    { id: "daily_essentials", name: "Daily Essentials", period: "daily", cap: 1200, spend: 780, essential: true },
    // Weekly
    { id: "weekly_shopping", name: "Weekly Shopping", period: "weekly", cap: 6000, spend: 3950 },
    { id: "food_dining", name: "Food & Dining", period: "weekly", cap: 4200, spend: 3600 },
    // Monthly
    { id: "travel", name: "Travel", period: "monthly", cap: 15000, spend: 2300 },
    { id: "utilities", name: "Utilities", period: "monthly", cap: 7000, spend: 4200, essential: true },
    { id: "shopping", name: "Shopping", period: "monthly", cap: 10000, spend: 6900 },
  ];
}

function seedMerchantCaps(): MerchantCap[] {
  return [
    { id: "daraz", label: "Daraz", weeklyCap: 4000, monthlyCap: 12000 },
    { id: "foodpanda", label: "foodpanda", weeklyCap: 2500, monthlyCap: 8000 },
  ];
}

function seedAlerts(): CategoryAlert[] {
  return [
    { id: "food_dining", categoryId: "food_dining", threshold: 3800 },
    { id: "shopping", categoryId: "shopping", threshold: 9000 },
  ];
}

function seedSeasons(): SeasonBoost[] {
  const d = new Date();
  const start = new Date(d.getFullYear(), d.getMonth(), d.getDate()).toISOString();
  const end = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 15).toISOString();
  return [
    { id: "eid", label: "Eid Shopping", start, end, boostPercent: 15, categoryIds: ["shopping"] },
  ];
}

function seedPrefs(): BudgetPrefs {
  return {
    rolloverRule: "weekly_to_monthly",
    autoSavingsEnabled: true,
    autoSavingsPercent: 20,
    lockNonEssential: false,
    familySharedEnabled: false,
    rewardBoostersEnabled: true,
    pushDeepLinksEnabled: true,
    monthlyIncomeBDT: 90000,
  };
}

// ---------------- Generic helpers ----------------
function loadJSON<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (raw) return JSON.parse(raw) as T;
  } catch {}
  localStorage.setItem(key, JSON.stringify(fallback));
  return fallback;
}

function saveJSON<T>(key: string, value: T) {
  localStorage.setItem(key, JSON.stringify(value));
}

// ---------------- Budgets ----------------
export function loadBudgets(): BudgetCategory[] {
  return loadJSON<BudgetCategory[]>(K_BUDGETS, seedBudgets());
}

export function saveBudgets(b: BudgetCategory[]) {
  saveJSON(K_BUDGETS, b);
}

export function getBudgetsByPeriod(period: Period): BudgetCategory[] {
  return loadBudgets().filter((b) => b.period === period);
}

// ---------------- Category Alerts ----------------
export function loadCategoryAlerts(): CategoryAlert[] {
  return loadJSON<CategoryAlert[]>(K_ALERTS, seedAlerts());
}

export function saveCategoryAlerts(a: CategoryAlert[]) {
  saveJSON(K_ALERTS, a);
}

export function upsertAlert(alerts: CategoryAlert[], categoryId: string, threshold: number): CategoryAlert[] {
  const i = alerts.findIndex(a => a.categoryId === categoryId);
  if (i >= 0) alerts[i].threshold = threshold;
  else alerts.push({ id: categoryId, categoryId, threshold });
  return [...alerts];
}

// ---------------- Merchant Caps ----------------
export function loadMerchantCaps(): MerchantCap[] {
  return loadJSON<MerchantCap[]>(K_MCAPS, seedMerchantCaps());
}

export function saveMerchantCaps(caps: MerchantCap[]) {
  saveJSON(K_MCAPS, caps);
}

export type MerchantCapStatus = {
  id: string;
  merchant: string;
  cap: number;      // chosen scope's cap (weekly or monthly)
  spend: number;    // mocked current spend within that scope
  usage: number;    // spend / cap
  status: "ok" | "near" | "breached";
};

/** Deterministic mock of each merchant cap’s current status. */
export function getMerchantCapStatus(scope: "weekly" | "monthly" = "weekly"): MerchantCapStatus[] {
  const caps = loadMerchantCaps();
  const todayKey = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

  return caps.map((c) => {
    const cap = scope === "weekly" ? c.weeklyCap : c.monthlyCap;
    const seed = hashCode(`${c.id}|${scope}|${todayKey}`);
    const rand01 = ((seed % 1000) / 1000) * 1.0; // 0..1
    const factor = 0.55 + rand01 * 0.65; // 0.55..1.20
    const spendRaw = Math.round(cap * factor);

    const spend = Math.max(0, spendRaw);
    const usage = cap > 0 ? spend / cap : 0;

    let status: "ok" | "near" | "breached" = "ok";
    if (usage >= 1.0) status = "breached";
    else if (usage >= 0.8) status = "near";

    return { id: c.id, merchant: c.label, cap, spend, usage, status };
  });
}

// ---------------- Seasons / Events ----------------
export function loadSeasonBoosts(): SeasonBoost[] {
  return loadJSON<SeasonBoost[]>(K_SEASONS, seedSeasons());
}

export function saveSeasonBoosts(s: SeasonBoost[]) {
  saveJSON(K_SEASONS, s);
}

// ---------------- Preferences ----------------
export function loadPrefs(): BudgetPrefs {
  return loadJSON<BudgetPrefs>(K_PREFS, seedPrefs());
}

export function savePrefs(p: BudgetPrefs) {
  saveJSON(K_PREFS, p);
}

// ---------------- Rewards & Badges (mock) ----------------
export function getPoints(): number {
  const n = Number(localStorage.getItem(K_POINTS) || "0");
  return Number.isFinite(n) ? n : 0;
}

export function addPoints(delta: number) {
  const next = Math.max(0, getPoints() + delta);
  localStorage.setItem(K_POINTS, String(next));
}

export function getBadges(): string[] {
  try {
    const raw = localStorage.getItem(K_BADGES);
    const arr = raw ? (JSON.parse(raw) as string[]) : [];
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

export function awardBadge(id: string) {
  if (!id) return;
  const set = new Set(getBadges());
  set.add(id);
  localStorage.setItem(K_BADGES, JSON.stringify([...set]));
}

// ---------------- Jar & Shared Pot (mock balances) ----------------
export function getJar(): number {
  const n = Number(localStorage.getItem(K_JAR) || "2500");
  return Number.isFinite(n) ? n : 0;
}

export function addToJar(amount: number): number {
  const next = Math.max(0, getJar() + (Number.isFinite(amount) ? amount : 0));
  localStorage.setItem(K_JAR, String(next));
  return next;
}

export function getSharedPot(): number {
  const n = Number(localStorage.getItem(K_POT) || "1200");
  return Number.isFinite(n) ? n : 0;
}

export function addToSharedPot(amount: number): number {
  const next = Math.max(0, getSharedPot() + (Number.isFinite(amount) ? amount : 0));
  localStorage.setItem(K_POT, String(next));
  return next;
}

// ---------------- Streaks (simple, mock) ----------------
function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

/** Call occasionally to maintain a playful daily budgeting “streak”. */
export function touchStreakToday() {
  const last = localStorage.getItem(K_STREAK_LAST);
  const cur = Number(localStorage.getItem(K_STREAK_CUR) || "0");
  const best = Number(localStorage.getItem(K_STREAK_BEST) || "0");
  const today = todayStr();

  if (last === today) return; // already counted
  // naive: if previous day, +1; else reset to 1
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yStr = yesterday.toISOString().slice(0, 10);

  const nextCur = last === yStr ? cur + 1 : 1;
  const nextBest = Math.max(best, nextCur);

  localStorage.setItem(K_STREAK_CUR, String(nextCur));
  localStorage.setItem(K_STREAK_BEST, String(nextBest));
  localStorage.setItem(K_STREAK_LAST, today);
}

export function getStreak() {
  return {
    current: Number(localStorage.getItem(K_STREAK_CUR) || "0"),
    best: Number(localStorage.getItem(K_STREAK_BEST) || "0"),
  };
}

// ---------------- Logic helpers ----------------
/** Simple guardrail: caps across monthly-like scope should not exceed income */
export function calcCashFlowGuardrail(
  incomeBDT: number,
  budgets: BudgetCategory[],
  seasons: SeasonBoost[]
): { totalCap: number; warn: boolean; msg: string } {
  const dailyCap = budgets.filter(b => b.period === "daily").reduce((s, b) => s + b.cap * 30, 0);
  const weeklyCap = budgets.filter(b => b.period === "weekly").reduce((s, b) => s + b.cap * 4, 0);
  let monthlyCap = budgets.filter(b => b.period === "monthly").reduce((s, b) => s + b.cap, 0);

  const today = new Date();
  seasons.forEach(season => {
    const inRange = today >= new Date(season.start) && today <= new Date(season.end);
    if (!inRange) return;
    season.categoryIds.forEach(id => {
      const cat = budgets.find(b => b.id === id);
      if (!cat) return;
      const bump = cat.cap * (season.boostPercent / 100);
      if (cat.period === "monthly") monthlyCap += bump;
      if (cat.period === "weekly") monthlyCap += bump * 4;
      if (cat.period === "daily") monthlyCap += bump * 30;
    });
  });

  const totalCap = dailyCap + weeklyCap + monthlyCap;
  const warn = totalCap > incomeBDT;
  const msg = warn
    ? `Planned budgets (≈BDT ${totalCap.toLocaleString("en-BD")}) exceed your monthly income (BDT ${incomeBDT.toLocaleString("en-BD")}).`
    : `Planned budgets look healthy against your income.`;
  return { totalCap, warn, msg };
}

/** Very lightweight "AI" suggestions (rule-based, mocked) */
export function getAISuggestions(budgets: BudgetCategory[]): string[] {
  const out: string[] = [];
  budgets.forEach((b) => {
    const ratio = b.spend / Math.max(1, b.cap);
    if (ratio >= 0.7 && b.period !== "monthly") {
      out.push(`You spent ${Math.round(ratio * 100)}% of ${b.name} earlier than expected. Consider trimming to stay within cap.`);
    }
  });
  if (!out.length) out.push("All categories are on track. Nice!");
  return out.slice(0, 4);
}

/** Apply a weekly round-ups “70/30” split into Savings Jar vs Shared Pot (mock) */
export function allocateWeeklyRoundupsSplit() {
  const jarAdd = 350;
  const potAdd = 150;
  const total = jarAdd + potAdd;

  addToJar(jarAdd);
  addToSharedPot(potAdd);
  addPoints(5); // a tiny “reward”

  // touch the streak whenever the user engages
  touchStreakToday();

  return { jarAdd, potAdd, total };
}

export function setBudgetCap(budgets: BudgetCategory[], id: string, cap: number): BudgetCategory[] {
  return budgets.map(b => (b.id === id ? { ...b, cap } : b));
}

export function toggleEssentialLock(budgets: BudgetCategory[], lock: boolean): BudgetCategory[] {
  // placeholder — UI enforces lock states
  return budgets.map(b => (lock ? b : b));
}

/** Make a shareable deep link to open the Budget overlay with some context */
export function makeBudgetDeepLink(params?: { tab?: "setup" | "tracker" | "insights" }) {
  const q = params?.tab ? `?tab=${params.tab}` : "";
  return `astha://budget${q}`;
}

// ---------------- Aggregates for widgets ----------------
export function getTopCategories(limit = 5) {
  const all = loadBudgets();
  const sorted = [...all].sort((a, b) => b.spend - a.spend).slice(0, limit);
  return sorted.map((b) => ({
    id: b.id,
    name: b.name,
    period: b.period,
    spend: b.spend,
    cap: b.cap,
    pct: b.cap ? Math.min(100, Math.round((b.spend / b.cap) * 100)) : 0,
  }));
}

export function getWeeklyDigest() {
  // very small, deterministic mock
  const tx = [
    { id: "t1", merchant: "foodpanda", amount: 420, category: "Food & Dining" },
    { id: "t2", merchant: "Daraz", amount: 950, category: "Shopping" },
    { id: "t3", merchant: "Uber", amount: 260, category: "Transport" },
  ];
  const total = tx.reduce((s, t) => s + t.amount, 0);
  const topMerchants = [
    { name: "Daraz", amount: 950 },
    { name: "foodpanda", amount: 420 },
  ];
  return { week: "This week", totalSpend: total, tx, topMerchants };
}

// ---------------- Snapshot helper ----------------
export function loadPlan() {
  return {
    budgets: loadBudgets(),
    alerts: loadCategoryAlerts(),
    merchantCaps: loadMerchantCaps(),
    seasons: loadSeasonBoosts(),
    prefs: loadPrefs(),
    jar: getJar(),
    sharedPot: getSharedPot(),
    points: getPoints(),
    badges: getBadges(),
    streak: getStreak(),
  };
}

// simple stable hash
function hashCode(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}
