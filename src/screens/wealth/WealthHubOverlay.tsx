// src/screens/wealth/WealthHubOverlay.tsx
import React from "react";
import {
  X,
  Download,
  CalendarDays,
  ArrowUpRight,
  ArrowDownRight,
  Target,
  Trophy,
  Award,
  Users,
  PiggyBank,
  Wallet,
  PieChart as PieIcon,
  BarChart2,
  LineChart as LineChartIcon,
  BookOpen,
  Sparkles,
} from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  AreaChart,
  Area,
} from "recharts";

type Props = { onClose: () => void };
type Tab = "dashboard" | "savings" | "investments" | "insights" | "learning" | "social";

/* ------------------------ Utils ------------------------ */
const BDT = (n: number) => `৳${n.toLocaleString("en-US")}`;
const pct = (n: number) => `${n.toFixed(1)}%`;
const rnd = (min: number, max: number) => Math.round(min + Math.random() * (max - min));
const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n));

/* ---------------------- Mock Data ---------------------- */
/** We synthesize data that looks alive:
 *  - Income clusters around salary day (5th), includes incentives
 *  - Expenses reflect BD categories (food/transport/rent/utilities)
 *  - Savings goals with varying progress
 *  - Investments: FD/DPS + two funds, with monthly contributions
 *  - Engagement: quizzes, badges, leaderboards
 */

// Months (latest first ~ rolling 18 months)
const MONTHS = (() => {
  const out: { key: string; y: number; m: number }[] = [];
  const now = new Date();
  for (let i = 0; i < 18; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    out.push({ key: d.toLocaleString("en-US", { month: "short", year: "2-digit" }), y: d.getFullYear(), m: d.getMonth() + 1 });
  }
  return out.reverse();
})();

type MonthlyRow = {
  month: string;
  income: number;
  expense: number;
  savings: number;
  invest: number;
  net: number;
};

const MONTHLY_SERIES: MonthlyRow[] = MONTHS.map((mm, idx) => {
  // Salary ~80k on 5th; extra income up to total ~110k
  const baseIncome = 80000 + rnd(5000, 20000); // incentives/bonus
  // Expenses realistic for Dhaka middle-class
  let rent = 35000;
  const utilities = rnd(3500, 5200);
  const groceries = rnd(12000, 18000);
  const transport = rnd(3500, 7000);
  const eatingOut = rnd(4000, 9000);
  const shopping = rnd(3000, 9000);
  let expense = rent + utilities + groceries + transport + eatingOut + shopping;

  // Keep expense in 55–80k range
  expense = clamp(expense, 55000, 80000);

  // Savings & investments pattern (5k–20k savings, 3k–12k invest),
  // but never push net negative unrealistically
  let savings = rnd(6000, 20000);
  let invest = rnd(4000, 12000);

  // If expense + savings + invest > income, reduce invest first then savings slightly
  let income = clamp(baseIncome, 90000, 115000);
  if (expense + savings + invest > income) {
    const over = expense + savings + invest - income;
    const cutInvest = Math.min(invest - 2000, Math.ceil(over * 0.6));
    invest -= Math.max(0, cutInvest);
    const stillOver = expense + savings + invest - income;
    if (stillOver > 0) {
      savings = Math.max(4000, savings - stillOver);
    }
  }

  const net = income - expense - savings - invest;

  // Slight seasonal variance: Eid months (Apr/May-ish) more spend, Dec shopping
  if (idx % 12 === 3 || idx % 12 === 4) {
    expense += 5000;
  }
  if (idx % 12 === 11) {
    expense += 4000;
  }

  return {
    month: mm.key,
    income,
    expense,
    savings: Math.max(4000, Math.round(savings)),
    invest: Math.max(3000, Math.round(invest)),
    net: Math.round(net),
  };
});

// Category split (avg of recent month)
const LAST = MONTHLY_SERIES[MONTHLY_SERIES.length - 1];
const OUTGO_SPLIT = (() => {
  const total = LAST.expense;
  const weights = {
    Rent: 35000,
    Groceries: 15000,
    Utilities: 4500,
    Transport: 5000,
    EatingOut: 6500,
    Shopping: 6000,
    Healthcare: 3000,
    Others: 2000,
  };
  const sumW = Object.values(weights).reduce((a, b) => a + b, 0);
  const entries = Object.entries(weights).map(([k, w]) => ({
    name: k,
    value: Math.round((total * w) / sumW),
  }));
  // rounding fix
  const diff = total - entries.reduce((a, b) => a + b.value, 0);
  if (diff !== 0) entries[0].value += diff;
  return entries;
})();

// Savings goals
type Goal = { id: string; title: string; target: number; saved: number; perMonth: number; due: string; priority: "High" | "Medium" | "Low" };
const GOALS: Goal[] = [
  { id: "g1", title: "Emergency Fund", target: 150000, saved: 112000, perMonth: 8000, due: "2026-02-01", priority: "High" },
  { id: "g2", title: "New Laptop", target: 120000, saved: 58000, perMonth: 6000, due: "2025-12-10", priority: "Medium" },
  { id: "g3", title: "Sylhet Trip", target: 45000, saved: 29000, perMonth: 2500, due: "2025-11-15", priority: "Low" },
  { id: "g4", title: "Home Renovation", target: 250000, saved: 92000, perMonth: 10000, due: "2026-05-01", priority: "High" },
];

// Savings streak & auto-sweep
const SAVINGS_STREAK = 7; // months
const ROUND_UP = true;
const AUTO_SWEEP_THRESHOLD = 20000;

// Investments
type Holding =
  | { type: "FD"; bank: "BRAC Bank"; rate: number; amount: number; matures: string }
  | { type: "DPS"; bank: "BRAC Bank"; rate: number; amount: number; started: string; monthly: number }
  | { type: "FUND"; name: "Prime BlueChip" | "EBL Balanced"; units: number; nav: number; sip: number };

const HOLDINGS: Holding[] = [
  { type: "FD", bank: "BRAC Bank", rate: 9.1, amount: 200000, matures: "2026-06-10" },
  { type: "DPS", bank: "BRAC Bank", rate: 8.5, amount: 78000, started: "2024-03-01", monthly: 5000 },
  { type: "FUND", name: "Prime BlueChip", units: 1250, nav: 18.9, sip: 4000 },
  { type: "FUND", name: "EBL Balanced", units: 890, nav: 21.4, sip: 3000 },
];

// Investment P&L series (mock, trending upward softly)
const INVEST_SERIES = MONTHS.map((mm, i) => {
  const base = 300000 + i * rnd(3500, 7000);
  const jitter = rnd(-3000, 3500);
  return { month: mm.key, value: Math.max(240000, base + jitter) };
});

// Leaderboard (anon)
const LEADERBOARD = [
  { name: "User-4521", monthlySave: 22000 },
  { name: "User-9927", monthlySave: 18500 },
  { name: "You", monthlySave: LAST.savings },
  { name: "User-7360", monthlySave: 15200 },
  { name: "User-1130", monthlySave: 14100 },
];

// Learning items
const LESSONS = [
  { id: "l1", title: "How DPS Works", mins: 3, done: true },
  { id: "l2", title: "FD vs. DPS: Which & When", mins: 4, done: true },
  { id: "l3", title: "Compounding 101", mins: 5, done: false },
  { id: "l4", title: "Budgeting in 10 Minutes", mins: 10, done: false },
  { id: "l5", title: "Funds: NAV, SIP & Risk", mins: 6, done: false },
];

// Suggestions (dynamic, based on last month gap)
const SUGGESTIONS = (() => {
  const gap = Math.max(0, 100000 - LAST.income); // if salary lower than 100k, nudge
  return [
    gap > 0
      ? `Income volatility detected. Consider setting Auto-Sweep threshold at ${BDT(AUTO_SWEEP_THRESHOLD)} to always save surplus.`
      : "Your income is steady. Increase SIP by ৳1,000 to accelerate goals.",
    `Enable Round-up saving${ROUND_UP ? " (already ON)" : ""} to push spare change into goals.`,
    `You saved ${pct((LAST.savings / LAST.income) * 100)} of income last month. Aim for 20–30% for faster progress.`,
  ];
})();

/* ------------------------ Component ------------------------ */
export default function WealthHubOverlay({ onClose }: Props) {
  const [tab, setTab] = React.useState<Tab>("dashboard");

  function exportCSV() {
    const header = ["month", "income", "expense", "savings", "invest", "net"].join(",");
    const rows = MONTHLY_SERIES.map((r) => [r.month, r.income, r.expense, r.savings, r.invest, r.net].join(",")).join("\n");
    const csv = header + "\n" + rows;
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "wealth-hub-monthly.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  // Derived totals
  const totalInvested =
    HOLDINGS.reduce((s, h) => {
      if (h.type === "FD") return s + h.amount;
      if (h.type === "DPS") return s + h.amount;
      // funds: units * nav * 100? nav assumed BDT per unit
      if (h.type === "FUND") return s + h.units * h.nav;
      return s;
    }, 0) + LAST.invest;

  const monthlyContribution =
    HOLDINGS.reduce((s, h) => s + (h.type === "DPS" ? h.monthly : 0) + (h.type === "FUND" ? h.sip : 0), 0) + LAST.invest;

  /* ----------------------------- UI ----------------------------- */
  return (
    <div className="fixed inset-0 z-[1210] grid place-items-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative z-[1211] h-[min(92vh,900px)] w-[min(1200px,96vw)] overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-black/10">
        {/* Header */}
        <div className="flex items-center justify-between bg-gradient-to-r from-blue-700 to-indigo-600 px-4 py-3 text-white">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-white/15 px-3 py-1 text-[15px] font-semibold">Astha Wealth Hub</div>
            <div className="hidden md:block text-white/90 text-sm">Savings • Investments • Insights • Learning</div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={exportCSV}
              className="inline-flex items-center gap-2 rounded-xl bg-white/90 px-3 py-2 text-blue-700 shadow hover:bg-white"
              title="Export monthly CSV"
            >
              <Download className="h-4 w-4" />
              <span className="text-sm">Export CSV</span>
            </button>
            <button
              onClick={onClose}
              className="grid h-9 w-9 place-items-center rounded-lg bg-white/15 hover:bg-white/25"
              title="Close"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center justify-between border-b px-4 py-2">
          <div className="rounded-xl bg-slate-100 p-1">
            <TabBtn id="dashboard" current={tab} setTab={setTab} label="Dashboard" />
            <TabBtn id="savings" current={tab} setTab={setTab} label="Smart Savings" />
            <TabBtn id="investments" current={tab} setTab={setTab} label="Investments" />
            <TabBtn id="insights" current={tab} setTab={setTab} label="Insights" />
            <TabBtn id="learning" current={tab} setTab={setTab} label="Learning" />
            <TabBtn id="social" current={tab} setTab={setTab} label="Social" />
          </div>
          <div className="hidden md:flex items-center gap-2 text-slate-500 text-sm">
            <CalendarDays className="h-4 w-4" />
            Last month: <b className="ml-1 text-slate-700">{MONTHLY_SERIES[MONTHLY_SERIES.length - 1].month}</b>
          </div>
        </div>

        {/* Body */}
        <div className="h-[calc(100%-106px)] overflow-auto p-4">
          {tab === "dashboard" && <DashboardTab />}
          {tab === "savings" && <SavingsTab />}
          {tab === "investments" && (
            <InvestmentsTab totalInvested={totalInvested} monthlyContribution={monthlyContribution} />
          )}
          {tab === "insights" && <InsightsTab />}
          {tab === "learning" && <LearningTab />}
          {tab === "social" && <SocialTab />}
        </div>
      </div>
    </div>
  );
}

/* --------------------------- Tabs --------------------------- */

function DashboardTab() {
  // KPI cards from latest month + trend vs previous
  const last = MONTHLY_SERIES[MONTHLY_SERIES.length - 1];
  const prev = MONTHLY_SERIES[MONTHLY_SERIES.length - 2];
  const upDown = (delta: number) =>
    delta >= 0 ? (
      <span className="inline-flex items-center gap-1 text-emerald-700">
        <ArrowUpRight className="h-4 w-4" />
        {pct(delta)}
      </span>
    ) : (
      <span className="inline-flex items-center gap-1 text-rose-700">
        <ArrowDownRight className="h-4 w-4" />
        {pct(Math.abs(delta))}
      </span>
    );

  const incDelta = (last.income - prev.income) / Math.max(1, prev.income);
  const savDelta = (last.savings - prev.savings) / Math.max(1, prev.savings);
  const invDelta = (last.invest - prev.invest) / Math.max(1, prev.invest);

  const donutColors = ["#1D4ED8", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#06B6D4", "#64748B", "#22C55E"];

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      {/* KPIs */}
      <KpiCard
        icon={<Wallet className="h-4 w-4" />}
        title="Income (Last Month)"
        value={BDT(last.income)}
        sub={<span className="text-[12px]">{upDown(incDelta)}</span>}
      />
      <KpiCard
        icon={<PiggyBank className="h-4 w-4" />}
        title="Savings (Last Month)"
        value={BDT(last.savings)}
        sub={<span className="text-[12px]">{upDown(savDelta)}</span>}
      />
      <KpiCard
        icon={<BarChart2 className="h-4 w-4" />}
        title="Invested (Last Month)"
        value={BDT(last.invest)}
        sub={<span className="text-[12px]">{upDown(invDelta)}</span>}
      />

      {/* Income vs Expense vs Savings */}
      <div className="lg:col-span-2 rounded-2xl border bg-white p-4 shadow-sm">
        <h3 className="px-1 pb-2 text-[15px] font-semibold text-slate-800">Monthly Cashflow</h3>
        <div className="min-h-[320px]">
          <ResponsiveContainer width="100%" height={320}>
            <ComposedFlow />
          </ResponsiveContainer>
        </div>
      </div>

      {/* Outgoing breakdown */}
      <div className="rounded-2xl border bg-white p-4 shadow-sm">
        <h3 className="px-1 pb-2 text-[15px] font-semibold text-slate-800">Expense Breakdown (Last Month)</h3>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
          <div className="lg:col-span-3 min-h-[300px]">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={OUTGO_SPLIT} dataKey="value" nameKey="name" innerRadius={80} outerRadius={120} stroke="#fff" strokeWidth={2}>
                  {OUTGO_SPLIT.map((_, i) => (
                    <Cell key={i} fill={donutColors[i % donutColors.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v: any, _n, p: any) => [BDT(Number(v)), p?.payload?.name || ""]} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="lg:col-span-2">
            <ul className="space-y-2">
              {OUTGO_SPLIT.slice()
                .sort((a, b) => b.value - a.value)
                .map((row, i) => (
                  <li key={i} className="flex items-center justify-between rounded-lg px-2 py-1 hover:bg-slate-50">
                    <div className="flex items-center gap-2">
                      <span className="inline-block h-3 w-3 rounded-sm" style={{ background: donutColors[i % donutColors.length] }} />
                      <span className="text-[13px] text-slate-700">{row.name}</span>
                    </div>
                    <div className="text-[13px] font-medium text-slate-800">{BDT(row.value)}</div>
                  </li>
                ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Suggestions + Goals recap */}
      <div className="lg:col-span-3 grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-2xl border bg-white p-4 shadow-sm md:col-span-2">
          <h3 className="px-1 pb-2 text-[15px] font-semibold text-slate-800">Smart Suggestions</h3>
          <ul className="space-y-2 text-sm">
            {SUGGESTIONS.map((s, i) => (
              <li key={i} className="rounded-lg bg-blue-50 p-3 text-blue-800 ring-1 ring-blue-100">
                • {s}
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-2xl border bg-white p-4 shadow-sm">
          <h3 className="px-1 pb-2 text-[15px] font-semibold text-slate-800">Savings Streak</h3>
          <div className="text-2xl font-semibold text-slate-900">{SAVINGS_STREAK} months 🔥</div>
          <div className="mt-2 text-sm text-slate-600">Round-up: {ROUND_UP ? "ON" : "OFF"}</div>
          <div className="text-sm text-slate-600">Auto-sweep threshold: {BDT(AUTO_SWEEP_THRESHOLD)}</div>
        </div>
      </div>
    </div>
  );
}

function SavingsTab() {
  // Progress bars for goals + round-up visualization + auto-sweep simulation
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      {/* Goals */}
      <div className="rounded-2xl border bg-white p-4 shadow-sm">
        <h3 className="px-1 pb-2 text-[15px] font-semibold text-slate-800">Goal Pots</h3>
        <div className="space-y-3">
          {GOALS.map((g) => {
            const pctv = clamp((g.saved / g.target) * 100, 0, 100);
            return (
              <div key={g.id} className="rounded-xl border p-3">
                <div className="flex items-center justify-between">
                  <div className="font-semibold text-slate-800">{g.title}</div>
                  <span
                    className={`rounded-md px-2 py-0.5 text-[12px] ring-1 ${
                      g.priority === "High"
                        ? "bg-rose-50 text-rose-700 ring-rose-100"
                        : g.priority === "Medium"
                        ? "bg-amber-50 text-amber-700 ring-amber-100"
                        : "bg-emerald-50 text-emerald-700 ring-emerald-100"
                    }`}
                  >
                    {g.priority}
                  </span>
                </div>
                <div className="mt-1 text-sm text-slate-600">
                  {BDT(g.saved)} / {BDT(g.target)} • Monthly {BDT(g.perMonth)} • Due {new Date(g.due).toLocaleDateString()}
                </div>
                <div className="mt-2 h-2 w-full rounded-full bg-slate-100">
                  <div
                    className="h-2 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500"
                    style={{ width: `${pctv}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Round-up + Auto-sweep explainers */}
      <div className="rounded-2xl border bg-white p-4 shadow-sm">
        <h3 className="px-1 pb-2 text-[15px] font-semibold text-slate-800">Automation</h3>
        <div className="rounded-xl bg-blue-50 p-3 text-blue-800 ring-1 ring-blue-100 text-sm">
          <b>Round-up</b> routes spare change from card transactions into your smallest goal.
        </div>
        <div className="mt-2 rounded-xl bg-emerald-50 p-3 text-emerald-800 ring-1 ring-emerald-100 text-sm">
          <b>Auto-Sweep</b> moves balance above {BDT(AUTO_SWEEP_THRESHOLD)} to your Emergency Fund pot.
        </div>

        <div className="mt-4">
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart
              data={MONTHLY_SERIES.map((r) => ({
                month: r.month,
                roundUp: Math.round(r.expense * 0.008), // ~0.8% of spending
                sweep: Math.max(0, r.net > 0 ? Math.min(r.net, 10000) : 0),
              }))}
              margin={{ top: 10, right: 20, bottom: 10, left: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Area type="monotone" dataKey="roundUp" name="Round-up" stroke="#06B6D4" fill="#06B6D4" fillOpacity={0.25} />
              <Area type="monotone" dataKey="sweep" name="Auto-Sweep" stroke="#10B981" fill="#10B981" fillOpacity={0.25} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

function InvestmentsTab({ totalInvested, monthlyContribution }: { totalInvested: number; monthlyContribution: number }) {
  const fundColors = ["#1D4ED8", "#10B981", "#F59E0B", "#8B5CF6"];

  // Holdings breakdown for pie
  const PIE = HOLDINGS.map((h) => {
    if (h.type === "FD") return { name: "FD (BRAC)", value: h.amount };
    if (h.type === "DPS") return { name: "DPS (BRAC)", value: h.amount };
    return { name: h.name, value: h.units * h.nav };
  });

  // rounding fix for pie (if needed)
  const totalPie = PIE.reduce((s, r) => s + r.value, 0);
  if (Math.abs(totalPie - totalInvested) > 1) {
    PIE[0].value += totalInvested - totalPie;
  }

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
      {/* Holdings list */}
      <div className="lg:col-span-3 rounded-2xl border bg-white p-4 shadow-sm">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-[15px] font-semibold text-slate-800">Holdings</h3>
          <div className="text-sm text-slate-600">Monthly contribution: <b className="text-slate-800">{BDT(monthlyContribution)}</b></div>
        </div>
        <div className="divide-y">
          {HOLDINGS.map((h, i) => (
            <div key={i} className="flex items-center justify-between py-3">
              <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-slate-100 text-slate-700">
                  {h.type === "FD" ? <Trophy className="h-5 w-5" /> : h.type === "DPS" ? <PiggyBank className="h-5 w-5" /> : <PieIcon className="h-5 w-5" />}
                </div>
                <div>
                  <div className="text-[15px] font-semibold text-slate-800">
                    {h.type === "FD" && `FD — ${h.bank}`}
                    {h.type === "DPS" && `DPS — ${h.bank}`}
                    {h.type === "FUND" && `${h.name} Fund`}
                  </div>
                  <div className="text-[12px] text-slate-500">
                    {h.type === "FD" && <>Rate {h.rate}% • Maturity {new Date(h.matures).toLocaleDateString()}</>}
                    {h.type === "DPS" && <>Rate {h.rate}% • Started {new Date(h.started).toLocaleDateString()} • Monthly {BDT(h.monthly)}</>}
                    {h.type === "FUND" && <>Units {h.units.toLocaleString()} • NAV {BDT(h.nav)} • SIP {BDT(h.sip)}</>}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-[13px] text-slate-500">Value</div>
                <div className="text-sm font-semibold">
                  {h.type === "FUND" ? BDT(h.units * h.nav) : BDT(h.amount)}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Pie + P&L */}
      <div className="lg:col-span-2 grid grid-cols-1 gap-4">
        <div className="rounded-2xl border bg-white p-4 shadow-sm">
          <h3 className="px-1 pb-2 text-[15px] font-semibold text-slate-800">Portfolio Split</h3>
          <div className="min-h-[240px]">
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie data={PIE} dataKey="value" nameKey="name" innerRadius={70} outerRadius={110} stroke="#fff" strokeWidth={2}>
                  {PIE.map((_, i) => (
                    <Cell key={i} fill={fundColors[i % fundColors.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v: any, _n, p: any) => [BDT(Number(v)), p?.payload?.name || ""]} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-1 text-sm text-slate-600">Total Invested: <b className="text-slate-800">{BDT(totalInvested)}</b></div>
        </div>

        <div className="rounded-2xl border bg-white p-4 shadow-sm">
          <h3 className="px-1 pb-2 text-[15px] font-semibold text-slate-800">Portfolio Value (18 mo)</h3>
          <div className="min-h-[220px]">
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={INVEST_SERIES} margin={{ top: 10, right: 20, bottom: 10, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(v: any) => [BDT(Number(v)), "Value"]} />
                <Line type="monotone" dataKey="value" stroke="#1D4ED8" strokeWidth={3} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}

function InsightsTab() {
  const series = MONTHLY_SERIES.map((r) => ({
    month: r.month,
    savings: r.savings,
    invest: r.invest,
    expense: r.expense,
  }));

  // Savings vs Expense ratio bars
  const ratioBars = MONTHLY_SERIES.map((r) => ({
    month: r.month,
    ratio: Math.round((r.savings / Math.max(1, r.expense)) * 100),
  }));

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <div className="rounded-2xl border bg-white p-4 shadow-sm">
        <h3 className="px-1 pb-2 text-[15px] font-semibold text-slate-800">Savings & Investments vs Expense</h3>
        <div className="min-h-[320px]">
          <ResponsiveContainer width="100%" height={320}>
            <ComposedSI data={series} />
          </ResponsiveContainer>
        </div>
      </div>

      <div className="rounded-2xl border bg-white p-4 shadow-sm">
        <h3 className="px-1 pb-2 text-[15px] font-semibold text-slate-800">Savings-to-Expense Ratio (%)</h3>
        <div className="min-h-[320px]">
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={ratioBars} margin={{ top: 10, right: 20, bottom: 10, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip formatter={(v: any) => [`${v}%`, "Ratio"]} />
              <Bar dataKey="ratio" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <p className="mt-2 text-[12px] text-slate-500">Target 20–30% ratio for healthy growth.</p>
      </div>
    </div>
  );
}

function LearningTab() {
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      <div className="lg:col-span-2 rounded-2xl border bg-white p-4 shadow-sm">
        <h3 className="px-1 pb-2 text-[15px] font-semibold text-slate-800">Mini Courses</h3>
        <div className="divide-y">
          {LESSONS.map((l) => (
            <div key={l.id} className="flex items-center justify-between py-3">
              <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-slate-100 text-slate-700">
                  <BookOpen className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-[15px] font-semibold text-slate-800">{l.title}</div>
                  <div className="text-[12px] text-slate-500">{l.mins} minutes</div>
                </div>
              </div>
              <div className="text-right">
                {l.done ? (
                  <span className="rounded-md bg-emerald-50 px-2 py-1 text-[12px] text-emerald-700 ring-1 ring-emerald-100">
                    Completed
                  </span>
                ) : (
                  <button className="rounded-md bg-blue-600 px-3 py-1.5 text-[12px] text-white hover:bg-blue-700">Start</button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border bg-white p-4 shadow-sm">
        <h3 className="px-1 pb-2 text-[15px] font-semibold text-slate-800">Badges</h3>
        <ul className="space-y-2 text-sm">
          <li className="rounded-lg bg-emerald-50 p-3 text-emerald-800 ring-1 ring-emerald-100">
            <Award className="mr-1 inline h-4 w-4" /> 6-Month Saving Streak
          </li>
          <li className="rounded-lg bg-blue-50 p-3 text-blue-800 ring-1 ring-blue-100">
            <Trophy className="mr-1 inline h-4 w-4" /> First 1 Lakh Saved
          </li>
          <li className="rounded-lg bg-amber-50 p-3 text-amber-800 ring-1 ring-amber-100">
            <Sparkles className="mr-1 inline h-4 w-4" /> Investment Beginner
          </li>
        </ul>
      </div>
    </div>
  );
}

function SocialTab() {
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      <div className="lg:col-span-2 rounded-2xl border bg-white p-4 shadow-sm">
        <h3 className="px-1 pb-2 text-[15px] font-semibold text-slate-800">Leaderboard (Monthly Savings)</h3>
        <div className="divide-y">
          {LEADERBOARD.map((r, i) => (
            <div key={i} className="flex items-center justify-between py-3">
              <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-slate-100 text-slate-700">
                  <Users className="h-5 w-5" />
                </div>
                <div className="text-[15px] font-semibold text-slate-800">
                  {i + 1}. {r.name}
                </div>
              </div>
              <div className="text-sm font-semibold">{BDT(r.monthlySave)}</div>
            </div>
          ))}
        </div>
        <p className="mt-2 text-[12px] text-slate-500">Anonymous, for motivation only.</p>
      </div>

      <div className="rounded-2xl border bg-white p-4 shadow-sm">
        <h3 className="px-1 pb-2 text-[15px] font-semibold text-slate-800">Challenges</h3>
        <ul className="space-y-2 text-sm">
          <li className="rounded-lg bg-blue-50 p-3 text-blue-800 ring-1 ring-blue-100">
            • 52-Week Saving Challenge (start ৳100; increase weekly)
          </li>
          <li className="rounded-lg bg-emerald-50 p-3 text-emerald-800 ring-1 ring-emerald-100">
            • No-Spend Weekend (earn badge + leaderboard boost)
          </li>
          <li className="rounded-lg bg-amber-50 p-3 text-amber-800 ring-1 ring-amber-100">
            • 30-Day Round-up Marathon (max spare change)
          </li>
        </ul>
      </div>
    </div>
  );
}

/* ------------------------- Small Pieces ------------------------- */

function TabBtn({
  current,
  id,
  setTab,
  label,
}: {
  current: Tab;
  id: Tab;
  setTab: (t: Tab) => void;
  label: string;
}) {
  const active = current === id;
  return (
    <button
      onClick={() => setTab(id)}
      className={`mx-0.5 rounded-lg px-3 py-1 text-sm ${
        active ? "bg-white text-blue-700 shadow" : "text-slate-600 hover:bg-white"
      }`}
    >
      {label}
    </button>
  );
}

function KpiCard({
  icon,
  title,
  value,
  sub,
}: {
  icon: React.ReactNode;
  title: string;
  value: string;
  sub?: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border bg-white p-4 shadow-sm">
      <div className="flex items-center gap-2 text-[12px] uppercase tracking-wide text-slate-500">
        {icon} {title}
      </div>
      <div className="mt-1 text-xl font-bold text-slate-900">{value}</div>
      {!!sub && <div className="text-[12px] text-slate-500">{sub}</div>}
    </div>
  );
}

/** Income/Expense/Savings/Invest lines & bars (dashboard) */
function ComposedFlow() {
  return (
    <LineChart data={MONTHLY_SERIES} margin={{ top: 10, right: 20, bottom: 10, left: 0 }}>
      <CartesianGrid strokeDasharray="3 3" />
      <XAxis dataKey="month" />
      <YAxis />
      <Tooltip
        formatter={(v: any, n: string) => [BDT(Number(v)), n[0].toUpperCase() + n.slice(1)]}
        labelFormatter={(l) => `Month ${l}`}
      />
      <Line type="monotone" dataKey="income" stroke="#16A34A" strokeWidth={3} dot={false} />
      <Line type="monotone" dataKey="expense" stroke="#EF4444" strokeWidth={3} dot={false} />
      <Line type="monotone" dataKey="savings" stroke="#3B82F6" strokeWidth={3} dot={false} />
      <Line type="monotone" dataKey="invest" stroke="#F59E0B" strokeWidth={3} dot={false} />
    </LineChart>
  );
}

/** Savings/Invest vs Expense overlay (insights) */
function ComposedSI({ data }: { data: Array<{ month: string; savings: number; invest: number; expense: number }> }) {
  return (
    <BarChart data={data} margin={{ top: 10, right: 20, bottom: 10, left: 0 }}>
      <CartesianGrid strokeDasharray="3 3" />
      <XAxis dataKey="month" />
      <YAxis />
      <Tooltip formatter={(v: any, n: string) => [BDT(Number(v)), n]} />
      <Bar dataKey="expense" name="Expense" fill="#EF4444" radius={[6, 6, 0, 0]} />
      <Bar dataKey="savings" name="Savings" fill="#3B82F6" radius={[6, 6, 0, 0]} />
      <Bar dataKey="invest" name="Invest" fill="#F59E0B" radius={[6, 6, 0, 0]} />
    </BarChart>
  );
}
